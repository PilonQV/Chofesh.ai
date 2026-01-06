import { Router, raw } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getTierFromPriceId, SUBSCRIPTION_TIERS } from "./products";
import { sendSubscriptionConfirmationEmail } from "../_core/resend";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Webhook endpoint - must use raw body for signature verification
router.post("/", raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Check for both user_id and userId in metadata (different casing from different sources)
  const userId = session.metadata?.user_id || session.metadata?.userId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const subscriptionType = session.metadata?.type;

  if (!userId) {
    console.error("[Stripe Webhook] No user_id in checkout session metadata");
    return;
  }

  console.log(`[Stripe Webhook] Checkout completed for user ${userId}, type: ${subscriptionType}`);

  // Handle NSFW subscription separately
  if (subscriptionType === "nsfw_subscription") {
    await handleNsfwSubscriptionActivation(parseInt(userId), subscriptionId);
    return;
  }

  const db = await getDb();
  if (!db) return;

  // Get the subscription to determine the tier
  let tier: "starter" | "pro" | "unlimited" | "free" = "free";
  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const detectedTier = getTierFromPriceId(priceId);
      if (detectedTier && detectedTier !== "free") {
        tier = detectedTier as "starter" | "pro" | "unlimited";
      }
      console.log(`[Stripe Webhook] Detected tier from subscription: ${tier} (price: ${priceId})`);
    } catch (err) {
      console.error("[Stripe Webhook] Failed to retrieve subscription:", err);
    }
  }

  // Update user with Stripe customer and subscription IDs AND tier
  await db
    .update(users)
    .set({
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      subscriptionStatus: "active",
      subscriptionTier: tier,
    })
    .where(eq(users.id, parseInt(userId)));

  console.log(`[Stripe Webhook] Updated user ${userId} to tier ${tier}`);

  // Send subscription confirmation email
  const [updatedUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(userId)))
    .limit(1);

  if (updatedUser && updatedUser.email) {
    const tierConfig = SUBSCRIPTION_TIERS[tier];
    sendSubscriptionConfirmationEmail(updatedUser.email, updatedUser.name || "User", {
      planName: tierConfig.name,
      price: `$${(tierConfig.price / 100).toFixed(2)}`,
      billingPeriod: "monthly",
      action: "new",
      features: tierConfig.features.slice(0, 5),
    }).catch(err => console.error("[Stripe Webhook] Failed to send subscription email:", err));
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);

  const db = await getDb();
  if (!db) return;

  // Find user by Stripe customer ID
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error(`[Stripe Webhook] No user found for customer ${customerId}`);
    return;
  }

  const status = subscription.status === "active" || subscription.status === "trialing"
    ? "active"
    : subscription.status === "past_due"
    ? "past_due"
    : subscription.status === "canceled"
    ? "canceled"
    : "none";

  await db
    .update(users)
    .set({
      stripeSubscriptionId: subscription.id,
      subscriptionTier: tier || "free",
      subscriptionStatus: status,
    })
    .where(eq(users.id, user.id));

  console.log(`[Stripe Webhook] Updated user ${user.id} to tier ${tier}, status ${status}`);

  // Send subscription update email if tier changed
  if (user.email && tier && tier !== "free" && tier !== user.subscriptionTier) {
    const oldTier = user.subscriptionTier || "free";
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    const action = (SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS]?.price || 0) > 
                   (SUBSCRIPTION_TIERS[oldTier as keyof typeof SUBSCRIPTION_TIERS]?.price || 0) 
                   ? "upgrade" : "downgrade";
    
    sendSubscriptionConfirmationEmail(user.email, user.name || "User", {
      planName: tierConfig.name,
      price: `$${(tierConfig.price / 100).toFixed(2)}`,
      billingPeriod: "monthly",
      action,
      features: tierConfig.features.slice(0, 5),
    }).catch(err => console.error("[Stripe Webhook] Failed to send subscription update email:", err));
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const db = await getDb();
  if (!db) return;

  // Find user by Stripe customer ID
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error(`[Stripe Webhook] No user found for customer ${customerId}`);
    return;
  }

  // Downgrade to free tier
  await db
    .update(users)
    .set({
      subscriptionTier: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    })
    .where(eq(users.id, user.id));

  console.log(`[Stripe Webhook] User ${user.id} subscription canceled, downgraded to free`);

  // Send cancellation confirmation email
  if (user.email) {
    const oldTierConfig = SUBSCRIPTION_TIERS[(user.subscriptionTier || "free") as keyof typeof SUBSCRIPTION_TIERS];
    sendSubscriptionConfirmationEmail(user.email, user.name || "User", {
      planName: oldTierConfig.name,
      price: `$${(oldTierConfig.price / 100).toFixed(2)}`,
      billingPeriod: "monthly",
      action: "cancel",
      effectiveDate: subscription.ended_at ? new Date(subscription.ended_at * 1000) : new Date(),
    }).catch(err => console.error("[Stripe Webhook] Failed to send cancellation email:", err));
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const db = await getDb();
  if (!db) return;

  // Find user by Stripe customer ID
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    console.error(`[Stripe Webhook] No user found for customer ${customerId}`);
    return;
  }

  // Mark subscription as past due
  await db
    .update(users)
    .set({
      subscriptionStatus: "past_due",
    })
    .where(eq(users.id, user.id));

  console.log(`[Stripe Webhook] User ${user.id} payment failed, marked as past_due`);
}

async function handleNsfwSubscriptionActivation(userId: number, subscriptionId: string) {
  const db = await getDb();
  if (!db) return;

  // Activate NSFW subscription for user
  await db
    .update(users)
    .set({
      nsfwSubscriptionStatus: "active",
      nsfwSubscriptionId: subscriptionId,
      nsfwImagesUsed: 0, // Reset usage on new subscription
      nsfwImagesResetAt: new Date(),
      ageVerified: true, // Auto-verify age since they're paying for adult content
    })
    .where(eq(users.id, userId));

  console.log(`[Stripe Webhook] NSFW subscription activated for user ${userId}`);
}

export default router;
