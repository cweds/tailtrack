import { ScrollArea } from "@/components/ui/scroll-area";
import type { DogActivity } from "@/lib/dog-care-storage";

interface ActivityLogProps {
  activities: DogActivity[];
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

export function ActivityLog({ activities }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          📋 Recent Activity
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
        📋 Recent Activity
      </h3>
      <ScrollArea className="max-h-80">
        <div className="space-y-3">
          {activities.map((activity) => {
            const actionEmoji = activity.action === 'Fed' ? '✅' : '🚪';
            const dogsList = activity.dogs.length > 1 ? activity.dogs.join(' & ') : activity.dogs[0];
            const timeAgo = formatTime(activity.timestamp);

            return (
              <div
                key={activity.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
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
    </div>
  );
}
