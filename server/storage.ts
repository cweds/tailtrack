import { users, activities, households, type User, type InsertUser, type RegisterUser, type Activity, type InsertActivity, type Household, type InsertHousehold } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, and, gte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Household methods
  createHousehold(household: InsertHousehold): Promise<Household>;
  getHouseholdByInviteCode(inviteCode: string): Promise<Household | undefined>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getTodayActivitiesByUser(userId: number): Promise<Activity[]>;
  getHouseholdTodayActivities(householdId: number): Promise<(Activity & { username: string })[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
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
    // If user is creating a new household
    else if (registerUser.householdName) {
      const newHousehold = await this.createHousehold({
        name: registerUser.householdName,
        inviteCode: nanoid(8),
      });
      householdId = newHousehold.id;
    }
    
    const result = await db.insert(users).values({
      email: registerUser.email,
      username: registerUser.username,
      passwordHash,
      householdId,
    }).returning();
    
    return result[0];
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  async createHousehold(household: InsertHousehold): Promise<Household> {
    const [newHousehold] = await db.insert(households).values(household).returning();
    return newHousehold;
  }

  async getHouseholdByInviteCode(inviteCode: string): Promise<Household | undefined> {
    const result = await db.select().from(households).where(eq(households.inviteCode, inviteCode)).limit(1);
    return result[0];
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    // Get the user's household ID to associate the activity with the household
    const user = await this.getUser(activity.userId);
    
    const result = await db.insert(activities).values({
      userId: activity.userId,
      dogs: activity.dogs,
      action: activity.action,
      householdId: user?.householdId || 1 // Default to household 1 if no household
    }).returning();
    
    return result[0];
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.timestamp));
  }

  async getTodayActivitiesByUser(userId: number): Promise<Activity[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db.select().from(activities)
      .where(and(
        eq(activities.userId, userId),
        gte(activities.timestamp, today)
      ))
      .orderBy(desc(activities.timestamp));
  }

  async getHouseholdTodayActivities(householdId: number): Promise<(Activity & { username: string })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activitiesWithUsers = await db.select({
      id: activities.id,
      userId: activities.userId,
      householdId: activities.householdId,
      dogs: activities.dogs,
      action: activities.action,
      timestamp: activities.timestamp,
      username: users.username,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(and(
      eq(activities.householdId, householdId),
      gte(activities.timestamp, today)
    ))
    .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers;
  }
}

export const storage = new DatabaseStorage();