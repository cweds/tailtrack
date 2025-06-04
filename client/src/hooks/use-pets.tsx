import { useQuery } from '@tanstack/react-query';
import { Pet } from '@shared/schema';

export function usePets(householdId: number | null) {
  return useQuery({
    queryKey: ['/api/pets/household', householdId],
    queryFn: async () => {
      if (!householdId) return { pets: [] };
      const response = await fetch(`/api/pets/household/${householdId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pets');
      }
      return response.json() as Promise<{ pets: Pet[] }>;
    },
    enabled: !!householdId,
  });
}