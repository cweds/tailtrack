import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { DatabaseActivity } from "@/hooks/use-pet-care";
import { useAuth } from "@/contexts/auth-context";
import { getDisplayName } from "@/lib/utils";
import type { Pet } from "../../../shared/schema";

interface ActivityLogProps {
  activities: DatabaseActivity[];
  pets: Pet[];
  hasPreviousActivities?: boolean;
}

function formatTime(timestamp: Date | string): string {
  const now = new Date();
  const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
  
  // Get dates without time for proper day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const activityDay = new Date(timestampDate.getFullYear(), timestampDate.getMonth(), timestampDate.getDate());
  
  const diffMs = now.getTime() - timestampDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  // Calculate day difference based on calendar days, not 24-hour periods
  const dayDifference = Math.floor((today.getTime() - activityDay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  
  // If it's the same calendar day, show hours for recent activities
  if (dayDifference === 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  
  // For previous days, show date and time
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  // Include year if it's not current year
  if (timestampDate.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  
  return timestampDate.toLocaleDateString('en-US', options);
}

function formatFullTimestamp(timestamp: Date | string): string {
  const timestampDate = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return timestampDate.toLocaleString();
}

export function ActivityLog({ activities, pets, hasPreviousActivities = false }: ActivityLogProps) {
  const { user } = useAuth();
  const [showAllDays, setShowAllDays] = useState(false);
  const { toast } = useToast();

  // Lazy load all activities when "View More Days" is clicked
  const { data: allActivitiesData, isLoading: isLoadingAllActivities } = useQuery({
    queryKey: ['/api/activities/household', user?.householdId, 'all'],
    queryFn: async () => {
      if (!user?.householdId) {
        const response = await fetch(`/api/activities/${user?.id}`);
        if (!response.ok) throw new Error('Failed to fetch all activities');
        return response.json();
      } else {
        const response = await fetch(`/api/activities/household/${user?.householdId}`);
        if (!response.ok) throw new Error('Failed to fetch all household activities');
        return response.json();
      }
    },
    enabled: showAllDays, // Only fetch when showAllDays is true
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: number) => {
      return await apiRequest("DELETE", `/api/activities/${activityId}`, { userId: user?.id });
    },
    onSuccess: () => {
      toast({
        title: "Activity deleted",
        description: "The activity has been removed.",
      });
      // Invalidate activities queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Use all activities when showAllDays is true, otherwise use today's activities
  // Show today's activities while loading all activities to prevent white screen
  const displayActivities = showAllDays ? 
    (isLoadingAllActivities ? activities : (allActivitiesData?.activities || [])) : 
    activities;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        📋 {showAllDays ? 'All Activity' : 'Today\'s Activity'}
      </h3>
      
      {activities.length === 0 && !showAllDays ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🐾</div>
          <p>No activities recorded yet today.</p>
        </div>
      ) : displayActivities.length === 0 && showAllDays ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🐾</div>
          <p>No activities found.</p>
        </div>
      ) : displayActivities.length > 0 ? (
        <ScrollArea className="h-80 w-full">
          <div className="space-y-3">
            {displayActivities.map((activity: DatabaseActivity) => {
              const getActionEmoji = (action: string) => {
                switch(action) {
                  case 'Fed': return '🍖';
                  case 'Bathroom': return '🚽';
                  case 'Walked': return '🚶';
                  case 'Played': return '🎾';
                  case 'Groomed': return '✂️';
                  case 'Medication': return '💊';
                  case 'Training': return '🎓';
                  case 'Litter Box': return '🧹';
                  case 'Clean Cage': return '🧽';
                  case 'Clean Tank': return '✨';
                  default: return '🐾';
                }
              };
              const actionEmoji = getActionEmoji(activity.action);
              
              // Get pet names for this activity
              const activityPets = pets?.filter(pet => activity.petIds?.includes(pet.id)) || [];
              
              // Handle cases where some or all pets are removed
              let petsList = '';
              if (activityPets.length === activity.petIds?.length) {
                // All pets still exist
                petsList = activityPets.map(pet => pet.name).join(' & ');
              } else if (activityPets.length > 0) {
                // Some pets exist, some removed
                const existingNames = activityPets.map(pet => pet.name).join(' & ');
                const removedCount = (activity.petIds?.length || 0) - activityPets.length;
                petsList = `${existingNames} & ${removedCount} removed pet${removedCount > 1 ? 's' : ''}`;
              } else {
                // All pets removed
                const removedCount = activity.petIds?.length || 0;
                petsList = `${removedCount} removed pet${removedCount > 1 ? 's' : ''}`;
              }
              
              const timeAgo = formatTime(activity.timestamp);

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  title={formatFullTimestamp(activity.timestamp)}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl mt-0.5">{actionEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900">
                        <span className="font-medium">{activity.action}</span>
                        <span className="text-gray-600 mx-2">•</span>
                        <span className="text-gray-700 break-words">{petsList}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{getDisplayName({ username: activity.username || 'Unknown user' } as any)}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  {activity.userId === user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteActivityMutation.mutate(activity.id)}
                      disabled={deleteActivityMutation.isPending}
                      className="ml-2 p-1 h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : null}
      
      {/* Show expand/collapse button only if there are previous activities */}
      {hasPreviousActivities && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllDays(!showAllDays)}
            disabled={isLoadingAllActivities}
            className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            {isLoadingAllActivities ? 'Loading...' : (showAllDays ? 'Show Today Only' : 'View More')}
          </Button>
        </div>
      )}
    </div>
  );
}