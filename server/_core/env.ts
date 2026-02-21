/**
 * Centralized environment variable configuration.
 * All values default to empty string — the server starts without any keys set.
 * Configure via .env file or your deployment platform's environment variables.
 * See .env.example for the full list of supported variables.
 */
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // Optional: built-in LLM/embedding proxy (OpenAI-compatible endpoint)
  forgeApiUrl: process.env.FORGE_API_URL ?? process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.FORGE_API_KEY ?? process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // Runware AI for image generation (optional)
  runwareApiKey: process.env.RUNWARE_API_KEY ?? "",

  // Google OAuth (optional)
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  // Stripe payments (optional)
  // Supports both standard STRIPE_SECRET_KEY and STRIPE_SECRET_LIVE_KEY
  stripeSecretKey:
    process.env.STRIPE_SECRET_LIVE_KEY ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.Secretkey_live_stripe || // legacy name — kept for backwards compat
    "",
  stripeWebhookSecret:
    process.env.STRIPE_WEBHOOK_SECRET_LIVE ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    "",
  stripeUncensoredPriceId: process.env.STRIPE_UNCENSORED_PRICE_ID ?? "",

  // Web Search APIs (optional)
  BRAVE_SEARCH_API_KEY: process.env.BRAVE_SEARCH_API_KEY ?? "",
  SERPER_API_KEY: process.env.SERPER_API_KEY ?? "",
};
