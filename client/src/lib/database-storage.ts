import { Activity } from "@shared/schema";

export interface DatabaseActivity {
  id: number;
  userId: number;
  dogs: string[];
  action: 'Fed' | 'Let Out';
  timestamp: Date;
  username?: string;
}

// Simple cache for recent activities to reduce API calls
class ActivityCache {
  private cache = new Map<number, { activities: DatabaseActivity[], timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  get(userId: number): DatabaseActivity[] | null {
    const cached = this.cache.get(userId);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(userId);
      return null;
    }
    
    return cached.activities;
  }

  set(userId: number, activities: DatabaseActivity[]): void {
    this.cache.set(userId, {
      activities,
      timestamp: Date.now()
    });
  }

  invalidate(userId: number): void {
    this.cache.delete(userId);
  }
}

const activityCache = new ActivityCache();

export class DatabaseStorage {
  static async createActivity(userId: number, dogs: string[], action: 'Fed' | 'Let Out'): Promise<DatabaseActivity> {
    const response = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        dogs,
        action,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create activity');
    }

    const result = await response.json();
    
    // Invalidate cache when new activity is created
    activityCache.invalidate(userId);
    
    return {
      ...result.activity,
      timestamp: new Date(result.activity.timestamp),
    };
  }

  static async getActivitiesByUser(userId: number): Promise<DatabaseActivity[]> {
    const response = await fetch(`/api/activities/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to get activities');
    }

    const result = await response.json();
    return result.activities.map((activity: Activity) => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    }));
  }

  static async getTodayActivitiesByUser(userId: number): Promise<DatabaseActivity[]> {
    const response = await fetch(`/api/activities/${userId}/today`);
    
    if (!response.ok) {
      throw new Error('Failed to get today\'s activities');
    }

    const result = await response.json();
    return result.activities.map((activity: Activity) => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    }));
  }

  // Helper methods for compatibility with existing UI logic
  static async getDogStatusToday(userId: number, dogName: string): Promise<{ fed: boolean; letOut: boolean }> {
    const todayActivities = await this.getTodayActivitiesByUser(userId);
    
    const fed = todayActivities.some(activity => 
      activity.dogs.includes(dogName) && activity.action === 'Fed'
    );
    
    const letOut = todayActivities.some(activity => 
      activity.dogs.includes(dogName) && activity.action === 'Let Out'
    );

    return { fed, letOut };
  }

  static async getAllDogsStatusToday(userId: number): Promise<{ bothFed: boolean; bothLetOut: boolean; allComplete: boolean }> {
    const nattyStatus = await this.getDogStatusToday(userId, 'Natty');
    const murphyStatus = await this.getDogStatusToday(userId, 'Murphy');

    const bothFed = nattyStatus.fed && murphyStatus.fed;
    const bothLetOut = nattyStatus.letOut && murphyStatus.letOut;
    const allComplete = bothFed && bothLetOut;

    return { bothFed, bothLetOut, allComplete };
  }

  static async canPerformAction(userId: number, dogName: string, action: 'Fed' | 'Let Out'): Promise<boolean> {
    const todayActivities = await this.getTodayActivitiesByUser(userId);
    const now = new Date();
    const cooldownMinutes = action === 'Fed' ? 60 : 15;

    const lastActivity = todayActivities
      .filter(activity => 
        activity.dogs.includes(dogName) && 
        activity.action === action
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!lastActivity) return true;

    const timeDiff = now.getTime() - lastActivity.timestamp.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    return minutesDiff >= cooldownMinutes;
  }
}