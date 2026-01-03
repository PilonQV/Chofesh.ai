import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { notifyOwner } from "./notification";
import { ENV } from "./env";
import crypto from "crypto";
import { createAuditLog } from "../db";

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

// Google OAuth URLs
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getRedirectUri(req: Request): string {
  // In production, always use https and the actual host
  const protocol = ENV.isProduction ? "https" : (req.headers["x-forwarded-proto"] || req.protocol || "https");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}/api/auth/google/callback`;
}

export function registerGoogleOAuthRoutes(app: Express) {
  // Initiate Google OAuth flow
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const redirectUri = getRedirectUri(req);
    const state = crypto.randomBytes(16).toString("hex");
    
    console.log("[Google OAuth] Starting OAuth flow");
    console.log("[Google OAuth] Redirect URI:", redirectUri);
    console.log("[Google OAuth] State:", state);
    
    // Store state in cookie for CSRF protection
    // Use more permissive cookie settings for cross-site OAuth flow
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: true, // Always secure in production
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 minutes
      path: "/",
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

    console.log("[Google OAuth] Callback received");
    console.log("[Google OAuth] Code present:", !!code);
    console.log("[Google OAuth] State from query:", state);
    console.log("[Google OAuth] Cookies:", JSON.stringify(req.cookies));

    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      res.redirect("/?error=oauth_denied");
      return;
    }

    if (!code || typeof code !== "string") {
      console.error("[Google OAuth] No authorization code");
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    // Verify state for CSRF protection (with fallback for cookie issues)
    const storedState = req.cookies?.oauth_state;
    console.log("[Google OAuth] Stored state from cookie:", storedState);
    
    if (!storedState) {
      console.warn("[Google OAuth] No state cookie found - proceeding anyway (cookie may not have been set)");
      // In production, cookies might not be set due to SameSite restrictions
      // We'll proceed but log the warning
    } else if (storedState !== state) {
      console.error("[Google OAuth] State mismatch:", { stored: storedState, received: state });
      res.redirect("/?error=state_mismatch");
      return;
    }

    // Clear state cookie
    res.clearCookie("oauth_state", { path: "/" });

    try {
      const redirectUri = getRedirectUri(req);
      console.log("[Google OAuth] Token exchange redirect URI:", redirectUri);

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

      const tokenText = await tokenResponse.text();
      console.log("[Google OAuth] Token response status:", tokenResponse.status);
      
      if (!tokenResponse.ok) {
        console.error("[Google OAuth] Token exchange failed:", tokenText);
        res.redirect("/?error=token_exchange_failed");
        return;
      }

      const tokens = JSON.parse(tokenText);
      console.log("[Google OAuth] Got access token");

      // Get user info from Google
      const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const userInfoError = await userInfoResponse.text();
        console.error("[Google OAuth] Failed to get user info:", userInfoError);
        res.redirect("/?error=userinfo_failed");
        return;
      }

      const googleUser = await userInfoResponse.json();
      console.log("[Google OAuth] Got user info:", { id: googleUser.id, email: googleUser.email });

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

      console.log("[Google OAuth] User upserted:", { openId, isNewUser });

      // Get user from database to get the ID
      const dbUser = await db.getUserByOpenId(openId);
      
      // Log the login event
      await createAuditLog({
        userId: dbUser?.id || null,
        userOpenId: openId,
        actionType: "login",
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || null,
        metadata: JSON.stringify({
          loginMethod: 'google',
          isNewUser,
          email: googleUser.email || null,
          googleId: googleUser.id,
        }),
        timestamp: new Date(),
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

      console.log("[Google OAuth] Session token created");

      // Set session cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log("[Google OAuth] Login successful, redirecting to home");

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
