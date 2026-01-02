/**
 * Stripe Checkout and Portal Routes
 */

import { Router, Request, Response } from "express";
import cookieParser from "cookie-parser";
import Stripe from "stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { SUBSCRIPTION_TIERS } from "./products";
import { sdk } from "../_core/sdk";
import * as db from "../db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil" as any,
});

const router = Router();

// Use cookie parser
router.use(cookieParser());

// Get user from session cookie using SDK
async function getUserFromRequest(req: Request) {
  try {
    const user = await sdk.authenticateRequest(req);
    return user;
  } catch (error) {
    console.log("[Stripe Routes] Auth failed:", error);
    return null;
  }
}

// Create checkout session
router.get("/checkout", async (req: Request, res: Response) => {
  try {
    const tier = req.query.tier as string;
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    
    if (!tierConfig || tier === "free") {
      return res.status(400).json({ error: "Invalid tier" });
    }

    // Get user from session
    const user = await getUserFromRequest(req);
    if (!user) {
      // Redirect to Google OAuth login
      return res.redirect("/api/auth/google?redirect=/settings");
    }

    // Check if tier has a price ID configured
    if (!("priceId" in tierConfig) || !tierConfig.priceId) {
      return res.status(400).json({ error: "Price not configured for this tier" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.protocol}://${req.get("host")}/settings?subscription=success`,
      cancel_url: `${req.protocol}://${req.get("host")}/settings?subscription=canceled`,
      customer_email: user.email || undefined,
      client_reference_id: user.id.toString(),
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id.toString(),
        customer_email: user.email || "",
        customer_name: user.name || "",
        tier,
      },
    });

    res.redirect(session.url || "/settings");
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Customer portal - manage subscription
router.get("/portal", async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      // Redirect to Google OAuth login
      return res.redirect("/api/auth/google?redirect=/settings");
    }

    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      console.log("[Stripe Portal] User has no Stripe customer ID");
      return res.redirect("/settings?error=no_subscription");
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${req.protocol}://${req.get("host")}/settings`,
    });

    res.redirect(portalSession.url);
  } catch (error) {
    console.error("Stripe portal error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
