import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { notifyOwner } from "./notification";
import { createAuditLog } from "../db";

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if this is a new user
      const existingUser = await db.getUserByOpenId(userInfo.openId);
      const isNewUser = !existingUser;
      
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      
      // Get user from database to get the ID
      const dbUser = await db.getUserByOpenId(userInfo.openId);
      
      // Log the login event
      await createAuditLog({
        userId: dbUser?.id || null,
        userOpenId: userInfo.openId,
        actionType: "login",
        ipAddress: getClientIp(req),
        userAgent: req.headers["user-agent"] || null,
        metadata: JSON.stringify({
          loginMethod: userInfo.loginMethod || userInfo.platform || 'manus',
          isNewUser,
          email: userInfo.email || null,
        }),
        timestamp: new Date(),
      });
      
      // Notify owner of new user registration
      if (isNewUser) {
        notifyOwner({
          title: "New User Registration - Chofesh.ai",
          content: `A new user has registered:\n\nName: ${userInfo.name || 'Not provided'}\nEmail: ${userInfo.email || 'Not provided'}\nLogin Method: ${userInfo.loginMethod || userInfo.platform || 'Unknown'}\nTime: ${new Date().toISOString()}`,
        }).catch(err => console.error("[OAuth] Failed to notify owner of new user:", err));
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
