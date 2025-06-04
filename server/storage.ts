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
  console.log(`🔗 Connecting to database`);
  
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
  deleteActivity(activityId: number): Promise<void>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getTodayActivitiesByUser(userId: number): Promise<Activity[]>;
  getHouseholdAllActivities(householdId: number): Promise<(Activity & { username: string })[]>;
  getHouseholdTodayActivities(householdId: number): Promise<(Activity & { username: string })[]>;
  getHouseholdCurrentCarePeriodActivities(householdId: number): Promise<(Activity & { username: string })[]>;
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
    console.log(`Updating user ${userId} username to: ${username}`);
    const result = await database.update(users).set({ username }).where(eq(users.id, userId)).returning();
    console.log(`Update result:`, result);
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
    const result = await database.select().from(households).where(eq(households.inviteCode, inviteCode)).limit(1);
    return result[0];
  }

  async getHouseholdMembers(householdId: number): Promise<SafeUser[]> {
    const result = await database.select().from(users).where(eq(users.householdId, householdId)).orderBy(users.createdAt);
    return result.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async removeUserFromHousehold(userId: number): Promise<void> {
    await database.update(users).set({ 
      householdId: null,
      householdJoinedAt: null
    }).where(eq(users.id, userId));
  }

  async joinHousehold(userId: number, householdId: number): Promise<void> {
    await database.update(users).set({ 
      householdId,
      householdJoinedAt: new Date()
    }).where(eq(users.id, userId));
  }

  async createHouseholdAndAssignUser(name: string, userId: number): Promise<Household> {
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
    await database.update(households).set({ creatorId: newCreatorId }).where(eq(households.id, householdId));
  }

  async createPet(pet: InsertPet): Promise<Pet> {
    const [newPet] = await database.insert(pets).values(pet).returning();
    return newPet;
  }

  async getHouseholdPets(householdId: number): Promise<Pet[]> {
    const result = await database.select().from(pets).where(eq(pets.householdId, householdId)).orderBy(pets.createdAt);
    return result;
  }

  async getPet(petId: number): Promise<Pet | undefined> {
    const result = await database.select().from(pets).where(eq(pets.id, petId)).limit(1);
    return result[0];
  }

  async updatePet(petId: number, updates: Partial<InsertPet>): Promise<Pet> {
    const [updatedPet] = await database.update(pets).set(updates).where(eq(pets.id, petId)).returning();
    return updatedPet;
  }

  async deletePet(petId: number): Promise<void> {
    // Simply delete the pet - activities are preserved for historical tracking
    // Even if a pet ID in an activity becomes invalid, the activity record remains
    // as a historical record of what happened
    await database.delete(pets).where(eq(pets.id, petId));
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    // Get the user's household ID to associate the activity with the household
    const user = await this.getUser(activity.userId);
    
    const result = await database.insert(activities).values({
      userId: activity.userId,
      petIds: activity.petIds,
      action: activity.action,
      householdId: user?.householdId // Don't default to household 1 if no household
    }).returning();
    
    return result[0];
  }

  async getActivity(activityId: number): Promise<Activity | undefined> {
    const result = await database.select().from(activities).where(eq(activities.id, activityId)).limit(1);
    return result[0];
  }

  async deleteActivity(activityId: number): Promise<void> {
    await database.delete(activities).where(eq(activities.id, activityId));
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await database.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.timestamp));
  }

  async getTodayActivitiesByUser(userId: number): Promise<Activity[]> {
    // Get start of today in Eastern time
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const startOfToday = new Date(easternTime);
    startOfToday.setHours(0, 0, 0, 0);
    
    // Convert back to UTC for database query
    const startOfTodayUTC = new Date(startOfToday.getTime() - (easternTime.getTimezoneOffset() * 60000));
    
    return await database.select().from(activities)
      .where(and(
        eq(activities.userId, userId),
        gte(activities.timestamp, startOfTodayUTC)
      ))
      .orderBy(desc(activities.timestamp));
  }

  async getHouseholdAllActivities(householdId: number): Promise<(Activity & { username: string })[]> {
    const activitiesWithUsers = await database.select({
      id: activities.id,
      userId: activities.userId,
      householdId: activities.householdId,
      petIds: activities.petIds,
      action: activities.action,
      timestamp: activities.timestamp,
      username: users.username,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(eq(activities.householdId, householdId))
    .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers;
  }

  async getHouseholdTodayActivities(householdId: number): Promise<(Activity & { username: string })[]> {
    // Get start of today in Eastern time
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const startOfToday = new Date(easternTime);
    startOfToday.setHours(0, 0, 0, 0);
    
    // Convert back to UTC for database query
    const startOfTodayUTC = new Date(startOfToday.getTime() - (easternTime.getTimezoneOffset() * 60000));
    
    const activitiesWithUsers = await database.select({
      id: activities.id,
      userId: activities.userId,
      householdId: activities.householdId,
      petIds: activities.petIds,
      action: activities.action,
      timestamp: activities.timestamp,
      username: users.username,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(and(
      eq(activities.householdId, householdId),
      gte(activities.timestamp, startOfTodayUTC)
    ))
    .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers;
  }

  async getHouseholdCurrentCarePeriodActivities(householdId: number): Promise<(Activity & { username: string })[]> {
    const now = new Date();
    const currentHour = now.getHours();
    
    // For completion status, we need to check both current period and previous evening if in morning
    // This handles the case where dogs were fed yesterday evening and we're now in morning
    let carePeriodStart: Date;
    
    if (currentHour >= 4 && currentHour < 12) {
      // Morning period: Include previous evening period (yesterday 4pm) for completion tracking
      carePeriodStart = new Date(now);
      carePeriodStart.setDate(carePeriodStart.getDate() - 1);
      carePeriodStart.setHours(16, 0, 0, 0);
    } else if (currentHour >= 16 && currentHour <= 23) {
      // Evening period: Include from this morning (today 4am) 
      carePeriodStart = new Date(now);
      carePeriodStart.setHours(4, 0, 0, 0);
    } else if (currentHour >= 0 && currentHour < 4) {
      // Late night (part of previous evening): Include from yesterday morning
      carePeriodStart = new Date(now);
      carePeriodStart.setDate(carePeriodStart.getDate() - 1);
      carePeriodStart.setHours(4, 0, 0, 0);
    } else {
      // Afternoon (12pm-4pm): Include from this morning
      carePeriodStart = new Date(now);
      carePeriodStart.setHours(4, 0, 0, 0);
    }
    
    const activitiesWithUsers = await database.select({
      id: activities.id,
      userId: activities.userId,
      householdId: activities.householdId,
      petIds: activities.petIds,
      action: activities.action,
      timestamp: activities.timestamp,
      username: users.username,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(and(
      eq(activities.householdId, householdId),
      gte(activities.timestamp, carePeriodStart)
    ))
    .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers;
  }

  async hasHouseholdPreviousActivities(householdId: number): Promise<boolean> {
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
    await database.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false,
    });
  }

  async validatePasswordResetToken(token: string): Promise<{ userId: number } | null> {
    const result = await db
      .select({
        userId: passwordResetTokens.userId,
      })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gte(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();