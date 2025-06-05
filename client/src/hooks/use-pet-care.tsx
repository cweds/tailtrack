import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pet } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';


export type Action = 'Fed' | 'Bathroom' | 'Walked' | 'Played' | 'Groomed' | 'Medication' | 'Training' | 'Litter Box' | 'Clean Cage' | 'Clean Tank';

export interface DatabaseActivity {
  id: number;
  userId: number;
  petIds: number[];
  action: Action;
  timestamp: Date;
  username?: string;
}

export function usePetCare(username: string, userId: number, householdId: number | null) {
  const queryClient = useQueryClient();
  const [selectedPets, setSelectedPets] = useState<Set<Pet>>(new Set());
  const { toast } = useToast();

  // Fetch pets for this household
  const { data: petsData, isLoading: petsLoading, error: petsError } = useQuery({
    queryKey: ['/api/pets/household', householdId],
    queryFn: async () => {
      if (!householdId) {
        return { pets: [] };
      }
      const response = await fetch(`/api/pets/household/${householdId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch pets: ${response.status}`);
      }
      const result = await response.json();
      return result;
    },
    enabled: !!householdId,
    retry: 3,
    staleTime: 30000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    networkMode: 'always',
    refetchOnReconnect: true
  });

  const pets = petsData?.pets || [];

  // Fetch today's activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['/api/activities', userId, 'today'],
    queryFn: async () => {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!householdId) {
        const response = await fetch(`/api/activities/${userId}/today?timezone=${encodeURIComponent(userTimezone)}`);
        if (!response.ok) throw new Error('Failed to fetch activities');
        return response.json();
      } else {
        const response = await fetch(`/api/activities/household/${householdId}/today?timezone=${encodeURIComponent(userTimezone)}`);
        if (!response.ok) throw new Error('Failed to fetch household activities');
        return response.json();
      }
    },
  });

  const activities = activitiesData?.activities || [];
  const hasPreviousActivities = activitiesData?.hasPrevious || false;

  // Fetch care period activities for completion status
  const { data: carePeriodActivitiesData } = useQuery({
    queryKey: ['/api/activities', userId, 'care-period'],
    queryFn: async () => {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!householdId) {
        // For individual users, fallback to today's activities
        const response = await fetch(`/api/activities/${userId}/today?timezone=${encodeURIComponent(userTimezone)}`);
        if (!response.ok) throw new Error('Failed to fetch activities');
        return response.json();
      } else {
        const response = await fetch(`/api/activities/household/${householdId}/care-period?timezone=${encodeURIComponent(userTimezone)}`);
        if (!response.ok) throw new Error('Failed to fetch care period activities');
        return response.json();
      }
    },
  });

  const carePeriodActivities = carePeriodActivitiesData?.activities || [];

  // Calculate pet status based on care periods, not just today
  const petStatus = useMemo(() => {
    const status: Record<number, { fed: boolean; letOut: boolean }> = {};
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Determine current care period
    let carePhase: 'morning' | 'afternoon' | 'evening';
    if (currentHour >= 4 && currentHour < 12) {
      carePhase = 'morning';
    } else if (currentHour >= 16 && currentHour <= 23) {
      carePhase = 'evening';
    } else if (currentHour >= 12 && currentHour < 16) {
      carePhase = 'afternoon';
    } else {
      // Late night/early morning (12am-4am) - part of evening care period
      carePhase = 'evening';
    }
    
    pets.forEach((pet: Pet) => {
      // Use care period activities for completion status
      const petCarePeriodActivities = carePeriodActivities.filter((activity: DatabaseActivity) => 
        activity.petIds && activity.petIds.includes(pet.id)
      );
      
      // Check feeding and bathroom activities within current care period
      const relevantFeedingActivities = petCarePeriodActivities.filter((activity: DatabaseActivity) => activity.action === 'Fed');
      const relevantBathroomActivities = petCarePeriodActivities.filter((activity: DatabaseActivity) => activity.action === 'Bathroom');
      
      status[pet.id] = {
        fed: relevantFeedingActivities.length > 0,
        letOut: relevantBathroomActivities.length > 0,
      };
    });
    
    return status;
  }, [pets, carePeriodActivities]);

  // Check if action can be performed
  const canTakeAction = selectedPets.size > 0;

  // Create activity mutation
  const createActivityMutation = useMutation({
    mutationFn: async ({ petIds, action }: { petIds: number[], action: Action }) => {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          householdId,
          petIds,
          action,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create activity');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch activities
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      
      // Show success toast
      const { petIds, action } = variables;
      const selectedPetNames = pets
        .filter(pet => petIds.includes(pet.id))
        .map(pet => pet.name);
      
      const petText = selectedPetNames.length === 1 
        ? selectedPetNames[0] 
        : selectedPetNames.length === 2
        ? `${selectedPetNames[0]} and ${selectedPetNames[1]}`
        : `${selectedPetNames.length} pets`;
      
      // Create grammatically correct message
      let actionText = action;
      if (action === 'Fed') {
        actionText = selectedPetNames.length === 1 ? 'Feeding' : 'Feeding';
      } else if (action === 'Bathroom') {
        actionText = selectedPetNames.length === 1 ? 'Bathroom break' : 'Bathroom breaks';
      } else if (action === 'Walked') {
        actionText = selectedPetNames.length === 1 ? 'Walk' : 'Walks';
      } else if (action === 'Played') {
        actionText = selectedPetNames.length === 1 ? 'Playtime' : 'Playtime';
      } else if (action === 'Groomed') {
        actionText = selectedPetNames.length === 1 ? 'Grooming' : 'Grooming';
      } else if (action === 'Litter Box') {
        actionText = 'Litter box cleaning';
      } else if (action === 'Clean Cage') {
        actionText = 'Cage cleaning';
      } else if (action === 'Clean Tank') {
        actionText = 'Tank cleaning';
      }
      
      toast({
        title: "Activity logged",
        description: `${actionText} recorded for ${petText}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to log activity",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handlePetToggle = (pet: Pet) => {
    const newSelected = new Set(selectedPets);
    if (newSelected.has(pet)) {
      newSelected.delete(pet);
    } else {
      newSelected.add(pet);
    }
    setSelectedPets(newSelected);
  };

  const handleSelectAllPets = () => {
    if (selectedPets.size === pets.length) {
      setSelectedPets(new Set());
    } else {
      setSelectedPets(new Set(pets));
    }
  };

  const handleAction = async (action: Action) => {
    if (!canTakeAction) return;

    const petIds = Array.from(selectedPets).map(pet => pet.id);
    
    // Optimistic update
    const optimisticActivity: DatabaseActivity = {
      id: Date.now(),
      userId,
      petIds,
      action,
      timestamp: new Date(),
      username,
    };

    // Add optimistic activity to cache
    queryClient.setQueryData(
      ['/api/activities', userId, 'today'],
      (old: any) => ({
        activities: [optimisticActivity, ...(old?.activities || [])],
      })
    );

    try {
      await createActivityMutation.mutateAsync({ petIds, action });
    } catch (error) {
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId, 'today'] });
      // Activity creation failed, error handled by mutation
    }
  };

  const handleQuickAction = async (action: Action) => {
    if (pets.length === 0) return;

    // Quick action selects all pets
    const petIds = pets.map((pet: Pet) => pet.id);
    
    // Optimistic update
    const optimisticActivity: DatabaseActivity = {
      id: Date.now(),
      userId,
      petIds,
      action,
      timestamp: new Date(),
      username,
    };

    queryClient.setQueryData(
      ['/api/activities', userId, 'today'],
      (old: any) => ({
        activities: [optimisticActivity, ...(old?.activities || [])],
      })
    );

    try {
      await createActivityMutation.mutateAsync({ petIds, action });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ['/api/activities', userId, 'today'] });
      // Quick action failed, error handled by mutation
    }
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/pets'] });
  };

  return {
    pets,
    selectedPets,
    petStatus,
    activities,
    hasPreviousActivities,
    canTakeAction,
    isLoading: petsLoading || activitiesLoading,
    isCreatingActivity: createActivityMutation.isPending,
    handlePetToggle,
    handleSelectAllPets,
    handleAction,
    handleQuickAction,
    refresh,
  };
}