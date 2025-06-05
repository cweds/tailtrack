import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { registerUserSchema, loginUserSchema, insertActivitySchema, insertPetSchema, forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { randomBytes } from "crypto";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "./email";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), app: "TailTrack" });
  });

  // Debug endpoint removed for production security

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists (only check email, not username/display name)
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }
      
      let householdId: number | null = null;
      
      // Handle household logic based on user choice
      let joiningExistingHousehold = false;
      
      if (userData.inviteCode) {
        // User has an invite code - join existing household
        const household = await storage.getHouseholdByInviteCode(userData.inviteCode);
        if (!household) {
          return res.status(400).json({ error: "Invalid invite code" });
        }
        householdId = household.id;
        joiningExistingHousehold = true;
      } else if (userData.householdChoice === 'join' && !userData.inviteCode) {
        return res.status(400).json({ error: "Invite code required to join a household" });
      } else if (userData.householdChoice === 'create' || !userData.householdChoice) {
        // For creating new household, we'll do it after user creation
        // Set householdId to null for now
        householdId = null;
      }
      
      // Create user first (without household assignment for joiners)
      const userToCreate = {
        ...userData,
        householdId: joiningExistingHousehold ? null : householdId
      };
      
      const user = await storage.createUser(userToCreate);
      
      // Handle post-creation household logic
      if (joiningExistingHousehold && householdId) {
        // User is joining existing household - use joinHousehold to set timestamp
        await storage.joinHousehold(user.id, householdId);
        user.householdId = householdId;
      } else if (userData.householdChoice === 'create' || (!userData.householdChoice && !userData.inviteCode)) {
        // User is creating new household
        const defaultHouseholdName = `${userData.username}'s Household`;
        const newHousehold = await storage.createHouseholdWithoutCreator(defaultHouseholdName);
        // Update user with the new household ID and set them as creator
        await storage.joinHousehold(user.id, newHousehold.id);
        await storage.updateHouseholdCreator(newHousehold.id, user.id);
        user.householdId = newHousehold.id;
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
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
      res.status(400).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }
      
      await storage.updateUserUsername(userId, username);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update user" });
    }
  });

  // Household routes
  app.get("/api/households/:householdId", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const household = await storage.getHousehold(householdId);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      res.json({ household });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get household" });
    }
  });

  app.get("/api/households/:householdId/members", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const members = await storage.getHouseholdMembers(householdId);
      res.json({ members });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get household members" });
    }
  });

  // Activity routes
  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.json({ activity });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Invalid activity data" });
    }
  });

  app.get("/api/activities/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activities = await storage.getActivitiesByUser(userId);
      res.json({ activities });
    } catch (error) {
      // Error logging removed for production security
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
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get household activities" });
    }
  });

  // Today's household activities endpoint - must come after the general household route
  app.get("/api/activities/household/:householdId/today", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const timezone = req.query.timezone as string || 'UTC';
      const activities = await storage.getHouseholdTodayActivities(householdId, timezone);
      const hasPrevious = await storage.hasHouseholdPreviousActivities(householdId);
      res.json({ activities, hasPrevious });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get household activities" });
    }
  });

  app.get("/api/activities/household/:householdId/care-period", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const timezone = req.query.timezone as string || 'UTC';
      const activities = await storage.getHouseholdCurrentCarePeriodActivities(householdId, timezone);
      res.json({ activities });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get care period activities" });
    }
  });

  app.get("/api/activities/:userId/today", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activities = await storage.getTodayActivitiesByUser(userId);
      res.json({ activities });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get today's activities" });
    }
  });

  app.patch("/api/activities/:activityId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      const { userId, timestamp, notes } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Get the activity to verify ownership
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // Only allow users to update their own activities
      if (activity.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this activity" });
      }

      const updates: any = {};
      if (timestamp !== undefined) {
        updates.timestamp = new Date(timestamp);
      }
      if (notes !== undefined) {
        updates.notes = notes;
      }

      const updatedActivity = await storage.updateActivity(activityId, updates);
      res.json({ activity: updatedActivity });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:activityId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.activityId);
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }

      // Get the activity to verify ownership
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }

      // Only allow users to delete their own activities
      if (activity.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to delete this activity" });
      }

      await storage.deleteActivity(activityId);
      res.json({ success: true });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to delete activity" });
    }
  });

  // Pet management routes
  app.post("/api/pets", async (req, res) => {
    try {
      const petData = insertPetSchema.parse(req.body);
      const pet = await storage.createPet(petData);
      res.json({ pet });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to create pet" });
    }
  });

  app.get("/api/pets/household/:householdId", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      const pets = await storage.getHouseholdPets(householdId);
      res.json({ pets });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get pets" });
    }
  });

  app.get("/api/pets/:petId", async (req, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const pet = await storage.getPet(petId);
      if (!pet) {
        return res.status(404).json({ error: "Pet not found" });
      }
      res.json({ pet });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get pet" });
    }
  });

  app.patch("/api/pets/:petId", async (req, res) => {
    try {
      const petId = parseInt(req.params.petId);
      const updates = insertPetSchema.partial().parse(req.body);
      const pet = await storage.updatePet(petId, updates);
      res.json({ pet });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to update pet" });
    }
  });

  app.delete("/api/pets/:petId", async (req, res) => {
    try {
      const petId = parseInt(req.params.petId);
      await storage.deletePet(petId);
      res.json({ success: true });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to delete pet" });
    }
  });

  // Household management routes
  app.get("/api/households/:householdId", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      if (isNaN(householdId)) {
        return res.status(400).json({ error: "Invalid household ID" });
      }
      
      const household = await storage.getHousehold(householdId);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      
      // Get creator username if creator exists
      let creatorUsername = undefined;
      if (household.creatorId) {
        const creator = await storage.getUser(household.creatorId);
        creatorUsername = creator?.username;
      }
      
      res.json({ 
        household: {
          ...household,
          creatorUsername
        }
      });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get household" });
    }
  });

  app.get("/api/households/:householdId/members", async (req, res) => {
    try {
      const householdId = parseInt(req.params.householdId);
      if (isNaN(householdId)) {
        return res.status(400).json({ error: "Invalid household ID" });
      }
      
      const members = await storage.getHouseholdMembers(householdId);
      res.json({ members });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to get household members" });
    }
  });

  app.post("/api/households/leave", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID required" });
      }
      
      // Get user to check if they are the household creator
      const user = await storage.getUser(userId);
      if (!user || !user.householdId) {
        return res.status(400).json({ error: "User not in a household" });
      }
      
      const household = await storage.getHousehold(user.householdId);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      
      // If user is the creator and there are other members, transfer creator role
      if (household.creatorId === userId) {
        const members = await storage.getHouseholdMembers(user.householdId);
        const otherMembers = members.filter(member => member.id !== userId);
        
        if (otherMembers.length > 0) {
          // Transfer creator role to the member who joined the household earliest
          const newCreator = otherMembers.sort((a, b) => {
            // Handle null householdJoinedAt (legacy users) by treating them as earliest
            if (!a.householdJoinedAt && !b.householdJoinedAt) return a.id - b.id;
            if (!a.householdJoinedAt) return -1;
            if (!b.householdJoinedAt) return 1;
            return new Date(a.householdJoinedAt).getTime() - new Date(b.householdJoinedAt).getTime();
          })[0];
          await storage.updateHouseholdCreator(user.householdId, newCreator.id);
        }
      }
      
      // Remove user from household
      await storage.removeUserFromHousehold(userId);
      res.json({ success: true });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to leave household" });
    }
  });

  app.post("/api/households/create", async (req, res) => {
    try {
      const { name, userId } = req.body;
      if (!name || !userId) {
        return res.status(400).json({ error: "Name and user ID required" });
      }
      
      // Create new household and assign user to it
      const household = await storage.createHouseholdAndAssignUser(name, userId);
      res.json({ household });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to create household" });
    }
  });

  app.post("/api/households/join", async (req, res) => {
    try {
      const { inviteCode, userId } = req.body;
      if (!inviteCode || !userId) {
        return res.status(400).json({ error: "Invite code and user ID required" });
      }
      
      // Find household by invite code
      const household = await storage.getHouseholdByInviteCode(inviteCode);
      if (!household) {
        return res.status(404).json({ error: "Invalid invite code" });
      }
      
      // Join the household (this will automatically leave current household if any)
      await storage.joinHousehold(userId, household.id);
      res.json({ household });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to join household" });
    }
  });

  app.post("/api/households/remove-member", async (req, res) => {
    try {
      const { householdId, userIdToRemove, requesterId } = req.body;
      if (!householdId || !userIdToRemove || !requesterId) {
        return res.status(400).json({ error: "Household ID, user ID to remove, and requester ID required" });
      }
      
      // Get the household to check if requester is the creator
      const household = await storage.getHousehold(householdId);
      if (!household) {
        return res.status(404).json({ error: "Household not found" });
      }
      
      // Check if requester is the household creator
      const requester = await storage.getUser(requesterId);
      if (!requester || requester.householdId !== householdId) {
        return res.status(403).json({ error: "Only household members can remove others" });
      }
      
      // Only the household creator can remove members
      if (household.creatorId && household.creatorId !== requesterId) {
        return res.status(403).json({ error: "Only the household creator can remove members" });
      }
      // Remove the user from the household
      await storage.removeUserFromHousehold(userIdToRemove);
      res.json({ success: true });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to remove member" });
    }
  });

  // Password recovery routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      // Debug logging removed for production security
      
      const { email } = forgotPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist (security best practice)
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      
      // Generate secure reset token
      const resetToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save token to database
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // Send email
      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (!emailSent) {
        // Error logging removed for production security
        return res.status(500).json({ error: "Failed to send reset email" });
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      // Error logging removed for production security
      if (error instanceof Error) {
        // Error logging removed for production security
      }
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      
      // Validate token
      const tokenData = await storage.validatePasswordResetToken(token);
      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update password
      await storage.updateUserPassword(tokenData.userId, passwordHash);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      // Error logging removed for production security
      res.status(400).json({ error: "Failed to reset password" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
