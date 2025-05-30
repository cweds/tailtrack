import { useState, useEffect } from "react";
import { DatabaseStorage, type DatabaseActivity } from "@/lib/database-storage";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

export const DOGS = ['Natty', 'Murphy'] as const;

export type Dog = typeof DOGS[number];
export type Action = 'Fed' | 'Let Out';

export function useDogCare(username: string) {
  const { user } = useAuth();
  const [selectedDogs, setSelectedDogs] = useState<Set<Dog>>(new Set());
  const [activities, setActivities] = useState<DatabaseActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load activities on mount
  useEffect(() => {
    if (user?.id) {
      loadActivities();
    }
  }, [user?.id]);

  const loadActivities = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const todayActivities = await DatabaseStorage.getTodayActivitiesByUser(user.id);
      setActivities(todayActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast({
        title: "Error loading activities",
        description: "Could not load activity history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canTakeAction = selectedDogs.size > 0;

  const handleDogToggle = (dog: Dog) => {
    const newSelectedDogs = new Set(selectedDogs);
    if (newSelectedDogs.has(dog)) {
      newSelectedDogs.delete(dog);
    } else {
      // Only allow selecting one dog at a time via individual buttons
      // Clear previous selection and add the new one
      newSelectedDogs.clear();
      newSelectedDogs.add(dog);
    }
    setSelectedDogs(newSelectedDogs);
  };

  const handleSelectBothDogs = () => {
    if (selectedDogs.size === 2) {
      setSelectedDogs(new Set());
    } else {
      setSelectedDogs(new Set(DOGS));
    }
  };

  const handleAction = async (action: Action) => {
    if (!canTakeAction || !user?.id) return;

    const dogsArray = Array.from(selectedDogs);
    
    try {
      // Check cooldowns for all selected dogs
      const cooldownChecks = await Promise.all(
        dogsArray.map(dog => DatabaseStorage.canPerformAction(user.id, dog, action))
      );
      
      const canPerformAction = cooldownChecks.every(can => can);
      
      if (!canPerformAction) {
        const cooldownMinutes = action === 'Fed' ? 60 : 15;
        toast({
          title: `⏰ Cooldown active`,
          description: `${action === 'Fed' ? 'Feeding' : 'Letting out'} is on cooldown for ${cooldownMinutes} minutes`,
          variant: "destructive",
        });
        return;
      }
      
      await DatabaseStorage.createActivity(user.id, dogsArray, action);

      // Refresh activities
      await loadActivities();

      // Show success toast
      const dogsText = dogsArray.length === 2 ? 'both dogs' : dogsArray[0];
      const emoji = action === 'Fed' ? '🍖' : '🚪';
      
      toast({
        title: `${emoji} ${action} ${dogsText}!`,
        description: `Logged by ${username}`,
        duration: 3000,
      });

      // Clear selection after action
      setSelectedDogs(new Set());
    } catch (error) {
      console.error('Failed to create activity:', error);
      toast({
        title: "Error saving activity",
        description: "Could not save the activity",
        variant: "destructive",
      });
    }
  };

  const handleQuickAction = async (action: Action) => {
    if (!user?.id) return;
    
    try {
      // Quick actions always apply to both dogs
      await DatabaseStorage.createActivity(user.id, ['Natty', 'Murphy'], action);

      // Refresh activities
      await loadActivities();

      // Show success toast
      const emoji = action === 'Fed' ? '🍖' : '🚪';
      
      toast({
        title: `${emoji} ${action} both dogs!`,
        description: `Logged by ${username}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to create quick action:', error);
      toast({
        title: "Error saving activity",
        description: "Could not save the activity",
        variant: "destructive",
      });
    }
  };

  const getStatusToday = async () => {
    if (!user?.id) return { bothFed: false, bothLetOut: false, allComplete: false };
    
    try {
      return await DatabaseStorage.getAllDogsStatusToday(user.id);
    } catch (error) {
      console.error('Failed to get status:', error);
      return { bothFed: false, bothLetOut: false, allComplete: false };
    }
  };

  return {
    selectedDogs,
    activities,
    canTakeAction,
    isLoading,
    handleDogToggle,
    handleSelectBothDogs,
    handleAction,
    handleQuickAction,
    getStatusToday,
  };
}
