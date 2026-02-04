import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import stripeWebhook from "../stripe/webhook";
import stripeRoutes from "../stripe/routes";
import { seoMiddleware } from "./seo";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Memory monitoring and diagnostic logging
 * Logs memory usage every 30 seconds and alerts when approaching limit
 */
function startMemoryMonitoring() {
  // Log memory usage every 30 seconds
  setInterval(() => {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.heapUsed / 1024 / 1024);
    const totalMB = Math.round(mem.heapTotal / 1024 / 1024);
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const externalMB = Math.round(mem.external / 1024 / 1024);
    const usedGB = (mem.heapUsed / 1024 / 1024 / 1024).toFixed(2);
    const totalGB = (mem.heapTotal / 1024 / 1024 / 1024).toFixed(2);
    const rssGB = (mem.rss / 1024 / 1024 / 1024).toFixed(2);
    
    console.log(`[MEMORY] Heap: ${usedMB}MB/${totalMB}MB (${usedGB}GB/${totalGB}GB) | RSS: ${rssMB}MB (${rssGB}GB) | External: ${externalMB}MB`);
    
    // Alert when heap usage exceeds 1.2GB (approaching 3.5GB limit with safety margin)
    if (mem.heapUsed > 1.2 * 1024 * 1024 * 1024) {
      console.warn(`[WARNING] Heap usage high: ${usedGB}GB / 3.5GB limit - approaching memory limit!`);
      
      // Force garbage collection if enabled (requires --expose-gc flag)
      if (global.gc) {
        console.log('[MEMORY] Running garbage collection...');
        global.gc();
        const afterGC = process.memoryUsage();
        const freedMB = Math.round((mem.heapUsed - afterGC.heapUsed) / 1024 / 1024);
        console.log(`[MEMORY] GC freed ${freedMB}MB`);
      }
    }
  }, 30000); // Log every 30 seconds
  
  console.log('[MEMORY] Memory monitoring started (logging every 30s)');
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Security headers middleware
  app.use((req, res, next) => {
    // HSTS - Force HTTPS for 1 year
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Cross-Origin-Opener-Policy
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Permissions Policy
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), unload=()');
    // Content Security Policy - Hardened configuration
    // Note: 'unsafe-inline' is still required for React's style injection and inline event handlers
    // 'unsafe-eval' has been removed since we replaced new Function() with mathjs
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // Removed 'unsafe-eval' - no longer needed
      "style-src 'self' 'unsafe-inline'",   // Required for CSS-in-JS and dynamic styles
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "media-src 'self' blob: https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",  // Allow Stripe checkout
      "object-src 'none'",                  // Prevent Flash/plugins
      "upgrade-insecure-requests",          // Force HTTPS for all resources
    ].join('; '));
    next();
  });
  
  // Stripe webhook must be registered BEFORE body parser (needs raw body)
  app.use("/api/stripe/webhook", stripeWebhook);
  
  // Stripe checkout and portal routes
  app.use("/api/stripe", stripeRoutes);
  
  // Cookie parser for OAuth state verification
  app.use(cookieParser());
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // SEO middleware for marketing pages
  app.use(seoMiddleware);
  // OAuth callback under /api/oauth/callback (legacy Manus OAuth)
  registerOAuthRoutes(app);
  // Google OAuth routes
  registerGoogleOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Start background workers
    startBackgroundWorkers();
    
    // MEMORY OPTIMIZATION: Start memory monitoring
    startMemoryMonitoring();
  });
}

/**
 * Start background workers for automation
 */
async function startBackgroundWorkers() {
  try {
    // Import workers dynamically
    const { startWebhookDeliveryWorker } = await import("../lib/webhookDelivery");
    const { startTaskExecutionWorker } = await import("../lib/taskExecutor");
    
    // Start webhook delivery worker
    startWebhookDeliveryWorker();
    
    // Start task execution worker
    startTaskExecutionWorker();
    
    console.log("[Background Workers] All workers started successfully");
  } catch (error) {
    console.error("[Background Workers] Failed to start workers:", error);
  }
}

startServer().catch(console.error);
