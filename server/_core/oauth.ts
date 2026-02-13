import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Google Auth will not work.");
}

const client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  // We'll determine the redirect URL dynamically based on the request host to support both local and prod
  // But strictly, it should be matched in Google Console.
  // For now, we assume the callback path is fixed.
  // The client needs initialization, but the redirect URI is passed in `generateAuthUrl` and `getToken`.
);

export function registerOAuthRoutes(app: Express) {
  // 1. Redirect to Google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    console.log(`[OAuth] Hit /api/auth/google from ${req.ip}`);
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error("[OAuth] Missing Google Auth configuration");
      return res.status(500).send("Google Auth not configured on server.");
    }

    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
    console.log(`[OAuth] Redirecting with URI: ${redirectUri}`);

    // Create a temporary client just for generating the URL with the correct redirect URI
    // Or we can just use the static generateAuthUrl if we update the redirectUri on the instance
    const authorizeUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      redirect_uri: redirectUri
    });

    res.redirect(authorizeUrl);
  });

  // 2. Google Callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    console.log(`[OAuth] Hit /api/oauth/callback from ${req.ip}`);
    const code = typeof req.query.code === "string" ? req.query.code : undefined;

    if (!code) {
      return res.status(400).send("Missing code in callback");
    }

    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;

      const { tokens } = await client.getToken({
        code,
        redirect_uri: redirectUri,
      });

      client.setCredentials(tokens);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        return res.status(400).send("Invalid Google ID Token payload");
      }

      // Allowlist Check
      if (ENV.allowedEmails.length > 0 && !ENV.allowedEmails.includes(payload.email)) {
        console.warn(`[Auth] Blocked login attempt from unauthorized email: ${payload.email}`);
        return res.status(403).send("Access Denied: Your email is not on the allowed list.");
      }

      // Upsert User
      await db.upsertUser({
        openId: `google_${payload.sub}`, // Prefix to avoid collisions
        name: payload.name || "Unknown",
        email: payload.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create Session with all required fields
      const sessionToken = await sdk.signSession(
        {
          openId: `google_${payload.sub}`,
          appId: "snowboard-tracker", // App identifier for session validation
          name: payload.name || "Unknown",
        },
        { expiresInMs: ONE_YEAR_MS }
      );

      // Set Cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log(`[OAuth] Successfully logged in user: ${payload.email}. Redirecting to /`);
      res.redirect("/");

    } catch (error) {
      console.error("[OAuth] Google Login Failed:", error);
      res.status(500).send("Authentication failed");
    }
  });
}
