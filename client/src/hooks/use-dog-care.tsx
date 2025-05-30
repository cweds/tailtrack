import { useState, useEffect } from "react";
import { DogCareStorage, type DogActivity } from "@/lib/dog-care-storage";
import { useToast } from "@/hooks/use-toast";

export const USERS = ['Chase', 'Becca', 'Megan'] as const;
export const DOGS = ['Natty', 'Murphy'] as const;

export type User = typeof USERS[number];
export type Dog = typeof DOGS[number];
export type Action = 'Fed' | 'Let Out';

export function useDogCare() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDogs, setSelectedDogs] = useState<Set<Dog>>(new Set());
  const [activities, setActivities] = useState<DogActivity[]>([]);
  const { toast } = useToast();

  // Load activities on mount
  useEffect(() => {
    setActivities(DogCareStorage.getActivities());
  }, []);

  const canTakeAction = selectedUser && selectedDogs.size > 0;

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleDogToggle = (dog: Dog) => {
    const newSelectedDogs = new Set(selectedDogs);
    if (newSelectedDogs.has(dog)) {
      newSelectedDogs.delete(dog);
    } else {
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
    
    DogCareStorage.addActivity({
      dogs: dogsArray,
      action,
      user: selectedUser!,
      timestamp: new Date().toISOString(),
    });

    // Refresh activities
    setActivities(DogCareStorage.getActivities());

    // Show success toast
    const dogsText = dogsArray.length === 2 ? 'both dogs' : dogsArray[0];
    const emoji = action === 'Fed' ? '✅' : '🚪';
    
    toast({
      title: `${emoji} ${action} ${dogsText}!`,
      description: `Logged by ${selectedUser}`,
      duration: 3000,
    });
  };

  const getStatusToday = () => {
    return DogCareStorage.getAllDogsStatusToday();
  };

  return {
    selectedUser,
    selectedDogs,
    activities,
    canTakeAction,
    handleUserSelect,
    handleDogToggle,
    handleSelectBothDogs,
    handleAction,
    getStatusToday,
  };
}
