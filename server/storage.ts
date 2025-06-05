import { users, activities, households, pets, passwordResetTokens, type User, type SafeUser, type InsertUser, type RegisterUser, type Activity, type InsertActivity, type Household, type InsertHousehold, type Pet, type InsertPet, type PasswordResetToken } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

// Lazy-load database connection to ensure environment variables are loaded
let db: ReturnType<typeof drizzle>;
let sql: ReturnType<typeof postgres>;

function initializeDatabase() {
  if (db) return db;
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    const availableVars = Object.keys(process.env).filter(key => key.includes('DATABASE')).join(', ');
    throw new Error(`DATABASE_URL environment variable is required. Available: ${availableVars}`);
  }
  
  // Log which database we're connecting to for safety
  // Database connection initialized
  
  sql = postgres(databaseUrl);
  db = drizzle(sql);
  return db;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  updateUserUsername(userId: number, username: string): Promise<void>;
  
  // Household methods
  createHousehold(household: InsertHousehold): Promise<Household>;
  getHousehold(householdId: number): Promise<Household | undefined>;
  getHouseholdByInviteCode(inviteCode: string): Promise<Household | undefined>;
  getHouseholdMembers(householdId: number): Promise<SafeUser[]>;
  removeUserFromHousehold(userId: number): Promise<void>;
  joinHousehold(userId: number, householdId: number): Promise<void>;
  createHouseholdAndAssignUser(name: string, userId: number): Promise<Household>;
  updateHouseholdCreator(householdId: number, newCreatorId: number): Promise<void>;
  
  // Pet methods
  createPet(pet: InsertPet): Promise<Pet>;
  getHouseholdPets(householdId: number): Promise<Pet[]>;
  getPet(petId: number): Promise<Pet | undefined>;
  updatePet(petId: number, updates: Partial<InsertPet>): Promise<Pet>;
  deletePet(petId: number): Promise<void>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivity(activityId: number): Promise<Activity | undefined>;
  updateActivity(activityId: number, updates: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(activityId: number): Promise<void>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getTodayActivitiesByUser(userId: number): Promise<Activity[]>;
  getHouseholdAllActivities(householdId: number): Promise<(Activity & { username: string })[]>;
  getHouseholdTodayActivities(householdId: number, timezone?: string): Promise<(Activity & { username: string })[]>;
  getHouseholdCurrentCarePeriodActivities(householdId: number, timezone?: string): Promise<(Activity & { username: string })[]>;
  hasHouseholdPreviousActivities(householdId: number): Promise<boolean>;
  
  // Password reset methods
  createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  validatePasswordResetToken(token: string): Promise<{ userId: number } | null>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: number, passwordHash: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(registerUser: RegisterUser): Promise<User> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(registerUser.password, saltRounds);
    
    let householdId: number | null = null;
    
    // If user is joining existing household via invite code
    if (registerUser.inviteCode) {
      const household = await this.getHouseholdByInviteCode(registerUser.inviteCode);
      if (household) {
        householdId = household.id;
      }
    } 
    
    // Create user with the name they provided
    const database = initializeDatabase();
    const result = await database.insert(users).values({
      email: registerUser.email,
      username: registerUser.username,
      passwordHash,
      householdId,
    }).returning();
    
    const newUser = result[0];
    
    // If user is creating a new household, create it now with the user as creator
    if (!householdId) {
      const householdName = registerUser.householdName || `${registerUser.username}'s Household`;
      const newHousehold = await this.createHousehold({
        name: householdName,
        inviteCode: nanoid(8),
      });
      
      // Update user with the new household ID
      const updatedResult = await database.update(users)
        .set({ householdId: newHousehold.id })
        .where(eq(users.id, newUser.id))
        .returning();
      
      return updatedResult[0];
    }
    
    return newUser;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  async updateUserUsername(userId: number, username: string): Promise<void> {
    const database = initializeDatabase();
    // Updating user username
    const result = await database.update(users).set({ username }).where(eq(users.id, userId)).returning();
    // Update completed
  }

  async createHousehold(household: InsertHousehold): Promise<Household> {
    const database = initializeDatabase();
    const [newHousehold] = await database.insert(households).values(household).returning();
    return newHousehold;
  }

  async createHouseholdWithoutCreator(name: string): Promise<Household> {
    const database = initializeDatabase();
    // Generate a new invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Create the household without a creator
    const [household] = await database.insert(households).values({
      name,
      inviteCode,
      creatorId: null,
    }).returning();
    
    return household;
  }

  async getHousehold(householdId: number): Promise<Household | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(households).where(eq(households.id, householdId)).limit(1);
    return result[0];
  }

  async getHouseholdByInviteCode(inviteCode: string): Promise<Household | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(households).where(eq(households.inviteCode, inviteCode)).limit(1);
    return result[0];
  }

  async getHouseholdMembers(householdId: number): Promise<SafeUser[]> {
    const database = initializeDatabase();
    const result = await database.select().from(users).where(eq(users.householdId, householdId)).orderBy(users.createdAt);
    return result.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async removeUserFromHousehold(userId: number): Promise<void> {
    const database = initializeDatabase();
    await database.update(users).set({ 
      householdId: null,
      householdJoinedAt: null
    }).where(eq(users.id, userId));
  }

  async joinHousehold(userId: number, householdId: number): Promise<void> {
    const database = initializeDatabase();
    await database.update(users).set({ 
      householdId,
      householdJoinedAt: new Date()
    }).where(eq(users.id, userId));
  }

  async createHouseholdAndAssignUser(name: string, userId: number): Promise<Household> {
    const database = initializeDatabase();
    // Generate a new invite code
    const inviteCode = Math.random().toString(36).substring(2, 10);
    
    // Create the household
    const [household] = await database.insert(households).values({
      name,
      inviteCode,
      creatorId: userId,
    }).returning();
    
    // Assign user to the new household
    await database.update(users).set({ 
      householdId: household.id,
      householdJoinedAt: new Date()
    }).where(eq(users.id, userId));
    
    return household;
  }

  async updateHouseholdCreator(householdId: number, newCreatorId: number): Promise<void> {
    const database = initializeDatabase();
    await database.update(households).set({ creatorId: newCreatorId }).where(eq(households.id, householdId));
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    const database = initializeDatabase();
    const [newPet] = await database.insert(pets).values(pet).returning();
    return newPet;
  }

  async getHouseholdPets(householdId: number): Promise<Pet[]> {
    const database = initializeDatabase();
    return await database.select().from(pets).where(eq(pets.householdId, householdId));
  }

  async getPet(petId: number): Promise<Pet | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(pets).where(eq(pets.id, petId)).limit(1);
    return result[0];
  }

  async updatePet(petId: number, updates: Partial<InsertPet>): Promise<Pet> {
    const database = initializeDatabase();
    const [updatedPet] = await database.update(pets).set(updates).where(eq(pets.id, petId)).returning();
    return updatedPet;
  }

  async deletePet(petId: number): Promise<void> {
    const database = initializeDatabase();
    // Simply delete the pet - activities are preserved for historical tracking
    // Even if a pet ID in an activity becomes invalid, the activity record remains
    // as a historical record of what happened
    await database.delete(pets).where(eq(pets.id, petId));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const database = initializeDatabase();
    // Get the user's household ID to associate the activity with the household
    const user = await this.getUser(activity.userId);
    
    if (!user?.householdId) {
      throw new Error('User must be part of a household to create activities');
    }
    
    const activityWithHousehold = {
      ...activity,
      householdId: user.householdId,
    };
    
    const [newActivity] = await database.insert(activities).values(activityWithHousehold).returning();
    return newActivity;
  }

  async getActivity(activityId: number): Promise<Activity | undefined> {
    const database = initializeDatabase();
    const result = await database.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    return result[0];
  }

  async updateActivity(activityId: number, updates: Partial<InsertActivity>): Promise<Activity> {
    const database = initializeDatabase();
    const [updatedActivity] = await database.update(activities)
      .set(updates)
      .where(eq(activities.id, activityId))
      .returning();
    return updatedActivity;
  }

  async deleteActivity(activityId: number): Promise<void> {
    const database = initializeDatabase();
    await database.delete(activities).where(eq(activities.id, activityId));
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    const database = initializeDatabase();
    return await database.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.timestamp));
  }

  async getTodayActivitiesByUser(userId: number): Promise<Activity[]> {
    const database = initializeDatabase();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    
    return await database.select().from(activities)
      .where(and(
        eq(activities.userId, userId),
        gte(activities.timestamp, startOfDay),
        lt(activities.timestamp, endOfDay)
      ))
      .orderBy(desc(activities.timestamp));
  }

  async getHouseholdAllActivities(householdId: number): Promise<(Activity & { username: string })[]> {
    const database = initializeDatabase();
    const activitiesWithUsers = await database
      .select({
        id: activities.id,
        userId: activities.userId,
        householdId: activities.householdId,
        petIds: activities.petIds,
        action: activities.action,
        timestamp: activities.timestamp,
        notes: activities.notes,
        username: users.username,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.householdId, householdId))
      .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      householdId: activity.householdId,
      petIds: activity.petIds,
      action: activity.action,
      timestamp: activity.timestamp,
      username: activity.username || 'Unknown User'
    }));
  }

  async getHouseholdTodayActivities(householdId: number, timezone: string = 'UTC'): Promise<(Activity & { username: string })[]> {
    const database = initializeDatabase();
    // Get activities from the last 72 hours to ensure we capture activities across timezone differences
    const threeDaysAgo = new Date(Date.now() - (72 * 60 * 60 * 1000));
    
    const activitiesWithUsers = await database
      .select({
        id: activities.id,
        userId: activities.userId,
        householdId: activities.householdId,
        petIds: activities.petIds,
        action: activities.action,
        timestamp: activities.timestamp,
        username: users.username,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(and(
        eq(activities.householdId, householdId),
        gte(activities.timestamp, threeDaysAgo)
      ))
      .orderBy(desc(activities.timestamp));
    
    // Calculate today's date range in the user's timezone
    const now = new Date();
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const startOfToday = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
    const endOfToday = new Date(startOfToday.getTime() + (24 * 60 * 60 * 1000));
    
    // Convert back to UTC for comparison with stored timestamps
    const startOfTodayUTC = new Date(startOfToday.getTime() - startOfToday.getTimezoneOffset() * 60 * 1000);
    const endOfTodayUTC = new Date(endOfToday.getTime() - endOfToday.getTimezoneOffset() * 60 * 1000);
    
    const todayActivities = activitiesWithUsers.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const activityInUserTz = new Date(activityDate.toLocaleString("en-US", { timeZone: timezone }));
      const userTodayStart = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate());
      const userTodayEnd = new Date(userTodayStart.getTime() + (24 * 60 * 60 * 1000));
      
      return activityInUserTz >= userTodayStart && activityInUserTz < userTodayEnd;
    });
    
    return todayActivities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      householdId: activity.householdId,
      petIds: activity.petIds,
      action: activity.action,
      timestamp: activity.timestamp,
      username: activity.username || 'Unknown User'
    }));
  }

  async getHouseholdCurrentCarePeriodActivities(householdId: number, timezone: string = 'UTC'): Promise<(Activity & { username: string })[]> {
    const database = initializeDatabase();
    const now = new Date();
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    let carePeriodStart: Date;
    
    // Care periods: Morning (4am-12pm), Evening (4pm-12am), Late night rest (12am-3:59am - hidden banner)
    const currentHour = userNow.getHours();
    
    if (currentHour >= 4 && currentHour < 12) {
      // Morning period: 4am-12pm
      carePeriodStart = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate(), 4, 0, 0);
    } else if (currentHour >= 16 || currentHour < 4) {
      // Evening/night period: 4pm-4am next day
      if (currentHour >= 16) {
        // After 4pm today
        carePeriodStart = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate(), 16, 0, 0);
      } else {
        // Before 4am today (continuation of yesterday's evening)
        const yesterday = new Date(userNow.getTime() - 24 * 60 * 60 * 1000);
        carePeriodStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 16, 0, 0);
      }
    } else {
      // Rest period: 12pm-4pm, show activities from morning period
      carePeriodStart = new Date(userNow.getFullYear(), userNow.getMonth(), userNow.getDate(), 4, 0, 0);
    }
    
    // Convert care period start to UTC for database comparison
    const carePeriodStartUTC = new Date(carePeriodStart.toLocaleString("en-US", { timeZone: "UTC" }));
    
    const activitiesWithUsers = await database
      .select({
        id: activities.id,
        userId: activities.userId,
        householdId: activities.householdId,
        petIds: activities.petIds,
        action: activities.action,
        timestamp: activities.timestamp,
        username: users.username,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(and(
        eq(activities.householdId, householdId),
        gte(activities.timestamp, carePeriodStartUTC)
      ))
      .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      householdId: activity.householdId,
      petIds: activity.petIds,
      action: activity.action,
      timestamp: activity.timestamp,
      username: activity.username || 'Unknown User'
    }));
  }

  async hasHouseholdPreviousActivities(householdId: number): Promise<boolean> {
    const database = initializeDatabase();
    // Get start of today - simplified approach
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if any activities exist before today
    const result = await database.select({ id: activities.id })
      .from(activities)
      .where(and(
        eq(activities.householdId, householdId),
        lt(activities.timestamp, startOfToday)
      ))
      .limit(1);
    
    return result.length > 0;
  }

  async createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    const database = initializeDatabase();
    await database.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });
  }

  async validatePasswordResetToken(token: string): Promise<{ userId: number } | null> {
    const database = initializeDatabase();
    const result = await database.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gte(passwordResetTokens.expiresAt, new Date())
      ))
      .limit(1);
    
    if (result.length === 0) return null;
    
    return { userId: result[0].userId };
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    const database = initializeDatabase();
    await database.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    const database = initializeDatabase();
    await database.update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();