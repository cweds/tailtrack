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
    setActivities(DogCareStorage.getActivities());
  }, []);

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

  const handleAction = (action: Action) => {
    if (!canTakeAction) return;

    const dogsArray = Array.from(selectedDogs);
    
    // Check cooldowns for all selected dogs
    const canPerformAction = dogsArray.every(dog => DogCareStorage.canPerformAction(dog, action));
    
    if (!canPerformAction) {
      const cooldownMinutes = action === 'Fed' ? 60 : 15;
      toast({
        title: `⏰ Cooldown active`,
        description: `${action === 'Fed' ? 'Feeding' : 'Letting out'} is on cooldown for ${cooldownMinutes} minutes`,
        variant: "destructive",
      });
      return;
    }
    
    DogCareStorage.addActivity({
      dogs: dogsArray,
      action,
      user: username,
      timestamp: new Date().toISOString(),
    });

    // Refresh activities
    setActivities(DogCareStorage.getActivities());

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
  };

  const handleQuickAction = (action: Action) => {
    // Quick actions always apply to both dogs
    DogCareStorage.addActivity({
      dogs: ['Natty', 'Murphy'],
      action,
      user: username,
      timestamp: new Date().toISOString(),
    });

    // Refresh activities
    setActivities(DogCareStorage.getActivities());

    // Show success toast
    const emoji = action === 'Fed' ? '🍖' : '🚪';
    
    toast({
      title: `${emoji} ${action} both dogs!`,
      description: `Logged by ${username}`,
      duration: 3000,
    });
  };

  const getStatusToday = () => {
    return DogCareStorage.getAllDogsStatusToday();
  };

  const handleClearData = () => {
    DogCareStorage.clearAllData();
    setActivities([]);
    toast({
      title: "Data cleared",
      description: "All activity data has been reset",
      duration: 2000,
    });
  };

  return {
    selectedDogs,
    activities,
    canTakeAction,
    handleDogToggle,
    handleSelectBothDogs,
    handleAction,
    handleQuickAction,
    getStatusToday,
    handleClearData,
  };
}
