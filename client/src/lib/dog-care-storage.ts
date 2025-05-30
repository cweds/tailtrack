export interface DogActivity {
  id: string;
  dogs: string[];
  action: 'Fed' | 'Let Out';
  user: string;
  timestamp: string;
}

export interface DogCareData {
  activities: DogActivity[];
}

const STORAGE_KEY = 'dog-care-tracker';

export class DogCareStorage {
  static getData(): DogCareData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading dog care data:', error);
    }
    return { activities: [] };
  }

  static saveData(data: DogCareData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving dog care data:', error);
    }
  }

  static addActivity(activity: Omit<DogActivity, 'id'>): void {
    const data = this.getData();
    const newActivity: DogActivity = {
      ...activity,
      id: Date.now().toString(),
    };
    data.activities.unshift(newActivity);
    this.saveData(data);
  }

  static getActivities(): DogActivity[] {
    return this.getData().activities;
  }

  static getTodayActivities(): DogActivity[] {
    const activities = this.getActivities();
    const today = new Date().toDateString();
    return activities.filter(activity => 
      new Date(activity.timestamp).toDateString() === today
    );
  }

  static getDogStatusToday(dogName: string): { fed: boolean; letOut: boolean } {
    const todayActivities = this.getTodayActivities();
    const currentHour = new Date().getHours();
    const isEvening = currentHour >= 16; // 4 PM and later
    
    // Filter activities based on morning/evening context
    const contextActivities = todayActivities.filter(activity => {
      const activityHour = new Date(activity.timestamp).getHours();
      const activityIsEvening = activityHour >= 16;
      return isEvening ? activityIsEvening : !activityIsEvening;
    });
    
    const fed = contextActivities.some(activity => 
      activity.dogs.includes(dogName) && activity.action === 'Fed'
    );
    
    const letOut = contextActivities.some(activity => 
      activity.dogs.includes(dogName) && activity.action === 'Let Out'
    );

    return { fed, letOut };
  }

  static getAllDogsStatusToday(): { bothFed: boolean; bothLetOut: boolean; allComplete: boolean } {
    const nattyStatus = this.getDogStatusToday('Natty');
    const murphyStatus = this.getDogStatusToday('Murphy');
    
    const bothFed = nattyStatus.fed && murphyStatus.fed;
    const bothLetOut = nattyStatus.letOut && murphyStatus.letOut;
    const allComplete = bothFed && bothLetOut;

    return { bothFed, bothLetOut, allComplete };
  }

  static canPerformAction(dogName: string, action: 'Fed' | 'Let Out'): boolean {
    const activities = this.getActivities();
    const now = new Date();
    
    // Get the cooldown period based on action
    const cooldownMinutes = action === 'Fed' ? 60 : 15;
    const cooldownMs = cooldownMinutes * 60 * 1000;
    
    // Find the most recent activity for this dog and action
    const lastActivity = activities.find(activity => 
      activity.dogs.includes(dogName) && 
      activity.action === action &&
      now.getTime() - new Date(activity.timestamp).getTime() < cooldownMs
    );
    
    return !lastActivity;
  }

  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing dog care data:', error);
    }
  }
}
