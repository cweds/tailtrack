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
    
    const fed = todayActivities.some(activity => 
      activity.dogs.includes(dogName) && activity.action === 'Fed'
    );
    
    const letOut = todayActivities.some(activity => 
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

  static clearAllData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing dog care data:', error);
    }
  }
}
