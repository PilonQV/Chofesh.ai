import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

// ============================================================
// Simple in-memory rate limiter (no external dependencies)
// Limits each IP to maxRequests per windowMs milliseconds.
// ============================================================
function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  // Periodically clean up expired entries to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of hits.entries()) {
      if (now > data.resetAt) hits.delete(ip);
    }
  }, windowMs);

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const now = Date.now();
    const entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > maxRequests) {
      res.status(429).set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000))).send("Too Many Requests");
      return;
    }
    return next();
  };
}

// 300 requests per minute per IP for static asset serving
const staticRateLimiter = createRateLimiter(300, 60_000);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", staticRateLimiter, async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Sitemap route with Cloudflare-optimized caching
  app.get("/sitemap.xml", staticRateLimiter, (req, res) => {
    const sitemapPath = path.resolve(distPath, "sitemap.xml");

    // Set Cloudflare-optimized cache headers
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=600"); // Cache for 10 minutes
    res.setHeader("CDN-Cache-Control", "public, max-age=600"); // Cloudflare respects this
    res.setHeader("Vary", "Accept-Encoding");

    // Send the sitemap file
    res.sendFile(sitemapPath);
  });

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", staticRateLimiter, (req, res) => {
    // Read the HTML file
    const htmlPath = path.resolve(distPath, "index.html");
    let html = fs.readFileSync(htmlPath, "utf-8");

    // Apply SEO content inline
    const { applySeoToHtml } = require('./seo.js');
    html = applySeoToHtml(req.path, html);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  });
}
