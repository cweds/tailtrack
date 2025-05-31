import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, insertActivitySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }
      
      const user = await storage.createUser(userData);
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error(`Registration error: ${error}`);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginData = loginUserSchema.parse(req.body);
      
      const user = await storage.validateUser(loginData.email, loginData.password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error(`Login error: ${error}`);
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  // User route
  app.get("/api/users/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { passwordHash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error(`Get user error: ${error}`);
      res.status(400).json({ error: "Failed to get user" });
    }
  });

  // Activity routes
  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.json({ activity });
    } catch (error) {
      console.error(`Create activity error: ${error}`);
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.get("/api/activities/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activities = await storage.getActivitiesByUser(userId);
      res.json({ activities });
    } catch (error) {
      console.error(`Get activities error: ${error}`);
      res.status(400).json({ error: "Failed to get activities" });
    }
  });

  // All household activities endpoint
  app.get("/api/activities/household/:householdId", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const activities = await storage.getHouseholdAllActivities(householdId);
      res.json({ activities });
    } catch (error) {
      console.error(`Get all household activities error: ${error}`);
      res.status(400).json({ error: "Failed to get household activities" });
    }
  });

  // Today's household activities endpoint - must come after the general household route
  app.get("/api/activities/household/:householdId/today", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const activities = await storage.getHouseholdTodayActivities(householdId);
      res.json({ activities });
    } catch (error) {
      console.error(`Get household activities error: ${error}`);
      res.status(400).json({ error: "Failed to get household activities" });
    }
  });

  app.get("/api/activities/:userId/today", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activities = await storage.getTodayActivitiesByUser(userId);
      res.json({ activities });
    } catch (error) {
      console.error(`Get today activities error: ${error}`);
      res.status(400).json({ error: "Failed to get today's activities" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
