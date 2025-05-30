import { users, activities, households, type User, type InsertUser, type RegisterUser, type Activity, type InsertActivity, type Household, type InsertHousehold } from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, and, gte, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  validateUser(email: string, password: string): Promise<User | null>;
  
  // Household methods
  createHousehold(household: InsertHousehold): Promise<Household>;
  getDefaultHousehold(): Promise<Household>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getTodayActivitiesByUser(userId: number): Promise<Activity[]>;
  getActivitiesByHousehold(householdId: number): Promise<Activity[]>;
  getTodayActivitiesByHousehold(householdId: number): Promise<Activity[]>;
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

  async createHousehold(household: InsertHousehold): Promise<Household> {
    const result = await db.insert(households).values(household).returning();
    return result[0];
  }

  async getDefaultHousehold(): Promise<Household> {
    // Check if default household exists
    let result = await db.select().from(households).where(eq(households.name, "Default Family")).limit(1);
    
    if (result.length === 0) {
      // Create default household if it doesn't exist
      result = await db.insert(households).values({
        name: "Default Family"
      }).returning();
    }
    
    return result[0];
  }

  async createUser(registerUser: RegisterUser): Promise<User> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(registerUser.password, saltRounds);
    
    // Get or create default household for new users
    const defaultHousehold = await this.getDefaultHousehold();
    
    const result = await db.insert(users).values({
      email: registerUser.email,
      username: registerUser.username,
      passwordHash,
      householdId: defaultHousehold.id,
    }).returning();
    
    return result[0];
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
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

  async getActivitiesByHousehold(householdId: number): Promise<(Activity & { username: string })[]> {
    // Get all users in the household
    const householdUsers = await db.select().from(users).where(eq(users.householdId, householdId));
    const userIds = householdUsers.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    const activitiesWithUsers = await db.select({
      id: activities.id,
      userId: activities.userId,
      dogs: activities.dogs,
      action: activities.action,
      timestamp: activities.timestamp,
      username: users.username,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(inArray(activities.userId, userIds))
    .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers;
  }

  async getTodayActivitiesByHousehold(householdId: number): Promise<(Activity & { username: string })[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all users in the household
    const householdUsers = await db.select().from(users).where(eq(users.householdId, householdId));
    const userIds = householdUsers.map(user => user.id);
    
    if (userIds.length === 0) return [];
    
    const activitiesWithUsers = await db.select({
      id: activities.id,
      userId: activities.userId,
      dogs: activities.dogs,
      action: activities.action,
      timestamp: activities.timestamp,
      username: users.username,
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .where(and(
      inArray(activities.userId, userIds),
      gte(activities.timestamp, today)
    ))
    .orderBy(desc(activities.timestamp));
    
    return activitiesWithUsers;
  }
}

export const storage = new DatabaseStorage();
