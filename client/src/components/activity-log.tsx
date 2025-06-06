import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { X, Edit3, Eye, Save, FileText, Calendar } from "lucide-react";
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingNoteId, setViewingNoteId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{
    timestamp: string;
    notes: string;
  }>({ timestamp: '', notes: '' });

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

  const updateActivityMutation = useMutation({
    mutationFn: async ({ activityId, timestamp, notes }: { activityId: number; timestamp?: string; notes?: string }) => {
      return await apiRequest("PATCH", `/api/activities/${activityId}`, { 
        userId: user?.id,
        timestamp,
        notes 
      });
    },
    onSuccess: () => {
      toast({
        title: "Activity updated",
        description: "Changes have been saved.",
      });
      setEditingId(null);
      // Invalidate activities queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update activity. Please try again.",
        variant: "destructive",
      });
    },
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

  // Helper functions for editing
  const startEditing = (activity: DatabaseActivity) => {
    const timestamp = activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp);
    setEditFormData({
      timestamp: timestamp.toISOString().slice(0, 16), // Format for datetime-local input
      notes: activity.notes || ''
    });
    setEditingId(activity.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({ timestamp: '', notes: '' });
  };

  const saveChanges = () => {
    if (editingId) {
      updateActivityMutation.mutate({
        activityId: editingId,
        timestamp: editFormData.timestamp,
        notes: editFormData.notes
      });
    }
  };

  const toggleNoteView = (activityId: number) => {
    setViewingNoteId(viewingNoteId === activityId ? null : activityId);
  };
  
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
              
              // Helper function to format pet names with proper comma and ampersand usage
              const formatPetNames = (names: string[]) => {
                if (names.length === 0) return '';
                if (names.length === 1) return names[0];
                if (names.length === 2) return `${names[0]} & ${names[1]}`;
                // For 3+ pets: "Bonnie, Murphy & Vixen"
                const allButLast = names.slice(0, -1).join(', ');
                const last = names[names.length - 1];
                return `${allButLast} & ${last}`;
              };

              // Handle cases where some or all pets are removed
              let petsList = '';
              if (activityPets.length === activity.petIds?.length) {
                // All pets still exist
                const petNames = activityPets.map(pet => pet.name);
                petsList = formatPetNames(petNames);
              } else if (activityPets.length > 0) {
                // Some pets exist, some removed
                const existingNames = activityPets.map(pet => pet.name);
                const formattedExisting = formatPetNames(existingNames);
                const removedCount = (activity.petIds?.length || 0) - activityPets.length;
                petsList = `${formattedExisting} & ${removedCount} removed pet${removedCount > 1 ? 's' : ''}`;
              } else {
                // All pets removed
                const removedCount = activity.petIds?.length || 0;
                petsList = `${removedCount} removed pet${removedCount > 1 ? 's' : ''}`;
              }
              
              const timeAgo = formatTime(activity.timestamp);

              const isOwner = user?.id === activity.userId;
              const hasNote = activity.notes && activity.notes.trim().length > 0;
              const isEditing = editingId === activity.id;
              const isViewingNote = viewingNoteId === activity.id;

              return (
                <div key={activity.id}>
                  <div
                    className={`flex items-center justify-between pl-3 pr-1 py-3 rounded-lg border ${
                      hasNote ? 'border-l-4 border-l-blue-500 border-gray-100 bg-gray-50' : 'border-gray-100 bg-gray-50'
                    }`}
                    title={formatFullTimestamp(activity.timestamp)}
                  >
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <span className="text-2xl mt-0.5">{actionEmoji}</span>
                        {hasNote && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 mb-1">
                          <span className="font-medium">{activity.action}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1 break-words font-medium">
                          {petsList}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 italic">
                          <span>{getDisplayName({ username: activity.username || 'Unknown user' } as any)}</span>
                          <span>•</span>
                          <span>{timeAgo}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {isOwner ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(activity)}
                            className="text-blue-600 text-xs px-1.5 py-1 rounded hover:bg-blue-50 flex items-center justify-center"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteActivityMutation.mutate(activity.id)}
                            disabled={deleteActivityMutation.isPending}
                            className="text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50 flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : hasNote ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingNoteId(activity.id)}
                          className="text-blue-600 text-xs px-1.5 py-1 rounded hover:bg-blue-50 flex items-center justify-center"
                        >
                          View
                        </Button>
                      ) : null}
                    </div>
                  </div>




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

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-50 rounded-lg p-6 w-full max-w-md mx-auto my-auto shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Edit Activity</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Time:</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={editFormData.timestamp}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, timestamp: e.target.value }))}
                    className="flex items-center justify-center w-full text-sm border-2 rounded-lg pl-10 pr-10 py-3 border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 cursor-pointer shadow-sm font-medium [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden"
                    style={{ fontSize: '16px' }}
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Note:</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="block w-full text-sm border rounded-lg px-3 py-2 h-20 resize-none border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Add details about this activity..."
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  className="text-gray-600 px-4 py-2 rounded-lg border-gray-300 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={updateActivityMutation.isPending}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {viewingNoteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-50 rounded-lg p-6 w-full max-w-md mx-auto my-auto shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800">Activity Note</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewingNoteId(null)}
                className="text-gray-400 hover:text-gray-600 p-0 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {(() => {
              const viewingActivity = displayActivities.find(a => a.id === viewingNoteId);
              if (!viewingActivity) return null;
              
              const activityPets = pets?.filter(pet => viewingActivity.petIds?.includes(pet.id)) || [];
              const formatPetNames = (names: string[]) => {
                if (names.length === 0) return '';
                if (names.length === 1) return names[0];
                if (names.length === 2) return `${names[0]} & ${names[1]}`;
                const allButLast = names.slice(0, -1).join(', ');
                const last = names[names.length - 1];
                return `${allButLast} & ${last}`;
              };
              const petNames = activityPets.map(pet => pet.name);
              const petsList = formatPetNames(petNames);
              
              return (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{viewingActivity.action}</span>
                      <span className="mx-2">•</span>
                      <span>{petsList}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      By {getDisplayName({ username: viewingActivity.username || 'Unknown user' } as any)} • {formatTime(viewingActivity.timestamp)}
                    </div>
                    <div className="bg-blue-50 rounded p-3 text-sm text-gray-700">
                      {viewingActivity.notes}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}