import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { notifyOwner } from "./notification";
import { ENV } from "./env";
import crypto from "crypto";

// Google OAuth URLs
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getRedirectUri(req: Request): string {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}/api/auth/google/callback`;
}

export function registerGoogleOAuthRoutes(app: Express) {
  // Initiate Google OAuth flow
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const redirectUri = getRedirectUri(req);
    const state = crypto.randomBytes(16).toString("hex");
    
    // Store state in cookie for CSRF protection
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: ENV.isProduction,
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
    });

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state: state,
      access_type: "offline",
      prompt: "consent",
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
      console.error("[Google OAuth] Error:", error);
      res.redirect("/?error=oauth_denied");
      return;
    }

    if (!code || typeof code !== "string") {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    // Verify state for CSRF protection
    const storedState = req.cookies?.oauth_state;
    if (!storedState || storedState !== state) {
      console.error("[Google OAuth] State mismatch - CSRF protection triggered");
      res.status(400).json({ error: "Invalid state parameter" });
      return;
    }

    // Clear state cookie
    res.clearCookie("oauth_state");

    try {
      const redirectUri = getRedirectUri(req);

      // Exchange code for tokens
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error("[Google OAuth] Token exchange failed:", errorData);
        res.redirect("/?error=token_exchange_failed");
        return;
      }

      const tokens = await tokenResponse.json();

      // Get user info from Google
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        console.error("[Google OAuth] Failed to get user info");
        res.redirect("/?error=userinfo_failed");
        return;
      }

      const googleUser = await userInfoResponse.json();

      // Create a unique openId from Google's user ID
      const openId = `google_${googleUser.id}`;

      // Check if this is a new user
      const existingUser = await db.getUserByOpenId(openId);
      const isNewUser = !existingUser;

      // Upsert user in database
      await db.upsertUser({
        openId: openId,
        name: googleUser.name || googleUser.email?.split("@")[0] || null,
        email: googleUser.email ?? null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Notify owner of new user registration
      if (isNewUser) {
        notifyOwner({
          title: "New User Registration - Chofesh.ai",
          content: `A new user has registered via Google OAuth:\n\nName: ${googleUser.name || "Not provided"}\nEmail: ${googleUser.email || "Not provided"}\nGoogle ID: ${googleUser.id}\nTime: ${new Date().toISOString()}`,
        }).catch((err) =>
          console.error("[Google OAuth] Failed to notify owner:", err)
        );
      }

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || googleUser.email || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      // Redirect to home page
      res.redirect("/");
    } catch (error) {
      console.error("[Google OAuth] Callback failed:", error);
      res.redirect("/?error=oauth_failed");
    }
  });

  // Login redirect endpoint (for frontend compatibility)
  app.get("/api/auth/login", (req: Request, res: Response) => {
    res.redirect("/api/auth/google");
  });
}
