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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil" as any,
});

const router = Router();

// Get user from session cookie
async function getUserFromRequest(req: Request) {
  // This would need to integrate with your auth system
  // For now, return null - the actual implementation depends on your auth setup
  const sessionCookie = req.cookies?.session;
  if (!sessionCookie) return null;
  
  // Decode JWT and get user
  // This is a placeholder - integrate with your actual auth
  return null;
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
      return res.redirect("/api/oauth/login?redirect=/settings");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tierConfig.name,
              description: `${tierConfig.dailyLimit === -1 ? "Unlimited" : tierConfig.dailyLimit} queries per day`,
            },
            unit_amount: tierConfig.price * 100, // Convert to cents
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${req.protocol}://${req.get("host")}/settings?success=true`,
      cancel_url: `${req.protocol}://${req.get("host")}/settings?canceled=true`,
      metadata: {
        tier,
      },
    });

    res.redirect(session.url || "/settings");
  } catch (error) {
    console.error("Stripe checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Customer portal
router.get("/portal", async (req: Request, res: Response) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.redirect("/api/oauth/login?redirect=/settings");
    }

    // Get user's Stripe customer ID from database
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // This would need the actual user ID from auth
    // For now, redirect to settings
    res.redirect("/settings");
  } catch (error) {
    console.error("Stripe portal error:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
