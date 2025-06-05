import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Helper function to safely log response metadata without exposing sensitive data
function getSafeResponseInfo(response: any, path: string): string | null {
  if (!response || typeof response !== 'object') return null;
  
  // For authentication endpoints, only log success/failure
  if (path.includes('/login') || path.includes('/register') || path.includes('/reset')) {
    return response.error ? 'error' : 'success';
  }
  
  // For data endpoints, only log count/type information
  if (response.activities) {
    return `${response.activities.length} activities`;
  }
  if (response.pets) {
    return `${response.pets.length} pets`;
  }
  if (response.members) {
    return `${response.members.length} members`;
  }
  
  // For simple success responses
  if (response.success) {
    return 'success';
  }
  
  // For error responses, only log that an error occurred
  if (response.error) {
    return 'error';
  }
  
  return null;
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Only log safe response metadata, never full response content
      if (capturedJsonResponse) {
        const responseInfo = getSafeResponseInfo(capturedJsonResponse, path);
        if (responseInfo) {
          logLine += ` :: ${responseInfo}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Load dotenv conditionally to avoid production build issues
  if (process.env.NODE_ENV !== 'production') {
    try {
      // Use eval to avoid TypeScript module resolution
      const dotenvModule = await eval('import("dotenv")');
      dotenvModule.config();
    } catch (error) {
      // dotenv not available in production build, environment variables should be set directly
      // Using environment variables directly
    }
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Provide secure, user-friendly error messages
    let message = "Something went wrong. Please try again.";
    
    if (status === 400) {
      message = "Invalid request. Please check your input and try again.";
    } else if (status === 401) {
      message = "Please log in to continue.";
    } else if (status === 403) {
      message = "You don't have permission to access this resource.";
    } else if (status === 404) {
      message = "The requested resource was not found.";
    } else if (status === 429) {
      message = "Too many requests. Please wait a moment and try again.";
    }

    res.status(status).json({ error: message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on the specified port (default 5000 for Replit, 3000 for local)
  // this serves both the API and the client.
  const port = Number(process.env.PORT) || (process.env.REPL_ID ? 5000 : 3000);
  server.listen(port as number, "0.0.0.0", () => {
    log(`serving on port ${port}`);
    // Server started successfully
  });
})();
