import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { DatabaseActivity } from "@/lib/database-storage";
import { useAuth } from "@/contexts/auth-context";

interface ActivityLogProps {
  activities: DatabaseActivity[];
}

function formatTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return timestamp.toLocaleDateString();
}

function formatFullTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString();
}

export function ActivityLog({ activities }: ActivityLogProps) {
  const [showAllDays, setShowAllDays] = useState(false);
  
  // Separate today's activities from previous days
  const today = new Date().toDateString();
  const todayActivities = activities.filter(activity => 
    new Date(activity.timestamp).toDateString() === today
  );
  const previousActivities = activities.filter(activity => 
    new Date(activity.timestamp).toDateString() !== today
  );

  const displayActivities = showAllDays ? activities : todayActivities;

  if (activities.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          📋 Today's Activity
        </h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🐾</div>
          <p>No activities yet. Start caring for your pups!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        📋 {showAllDays ? 'All Activity' : 'Today\'s Activity'}
      </h3>
      
      {displayActivities.length === 0 && !showAllDays ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🐾</div>
          <p>No activities today yet. Start caring for your pups!</p>
        </div>
      ) : (
        <ScrollArea className="max-h-80">
          <div className="space-y-3">
            {displayActivities.map((activity) => {
              const actionEmoji = activity.action === 'Fed' ? '🍖' : '🚪';
              const dogsList = activity.dogs.length > 1 ? activity.dogs.join(' & ') : activity.dogs[0];
              const timeAgo = formatTime(activity.timestamp);

              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                  title={formatFullTimestamp(activity.timestamp)}
                >
                  <div className="flex-1">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <span className="mr-2">{actionEmoji}</span>
                      {dogsList}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      by {activity.user} • {timeAgo}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
      
      {/* Show expand/collapse button only if there are previous activities */}
      {previousActivities.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllDays(!showAllDays)}
            className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            {showAllDays ? 'Show Today Only' : `More Activity (${previousActivities.length} previous)`}
          </Button>
        </div>
      )}
    </div>
  );
}
