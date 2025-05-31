import { DatabaseActivity } from '../lib/database-storage';

interface TimelineBarProps {
  activities: DatabaseActivity[];
}

export function TimelineBar({ activities }: TimelineBarProps) {
  // Create 12-hour timeline from 6am to 6pm
  const hours = Array.from({ length: 13 }, (_, i) => 6 + i); // 6, 7, 8, ..., 18

  const getActivitiesForHour = (hour: number) => {
    return activities.filter(activity => {
      const activityHour = new Date(activity.timestamp).getHours();
      return activityHour === hour;
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 12) return '12PM';
    if (hour < 12) return `${hour}AM`;
    return `${hour - 12}PM`;
  };

  const getActivityEmoji = (activity: DatabaseActivity) => {
    if (activity.action === 'Fed') return '🍽️';
    if (activity.action === 'Let Out') return '🚪';
    return '';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Today's Timeline</h3>
      
      {/* Timeline container */}
      <div className="relative">
        {/* Hour labels */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          {hours.map(hour => (
            <div key={hour} className="text-center" style={{ width: '7.69%' }}>
              {hour === 6 || hour === 12 || hour === 18 ? formatHour(hour) : ''}
            </div>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="relative bg-gray-200 h-12 rounded-lg overflow-hidden">
          {/* Hour segments */}
          {hours.slice(0, -1).map((hour, index) => {
            const hourActivities = getActivitiesForHour(hour);
            const isCurrentHour = new Date().getHours() === hour;
            
            return (
              <div
                key={hour}
                className={`absolute top-0 h-full border-r border-gray-300 flex items-center justify-center ${
                  isCurrentHour ? 'bg-blue-100' : ''
                }`}
                style={{
                  left: `${(index / 12) * 100}%`,
                  width: `${100 / 12}%`
                }}
              >
                {/* Activity emojis */}
                <div className="flex flex-col items-center justify-center h-full">
                  {hourActivities.map((activity, actIndex) => (
                    <div
                      key={`${activity.id}-${actIndex}`}
                      className="text-sm"
                      title={`${activity.dogs.join(', ')} - ${activity.action} at ${new Date(activity.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                    >
                      {getActivityEmoji(activity)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Current time indicator */}
          {(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Only show indicator if current time is within 6am-6pm range
            if (currentHour >= 6 && currentHour < 18) {
              const hoursSince6am = currentHour - 6;
              const minuteProgress = currentMinute / 60;
              const totalProgress = (hoursSince6am + minuteProgress) / 12;
              
              return (
                <div
                  className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
                  style={{
                    left: `${totalProgress * 100}%`
                  }}
                >
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <span>🍽️</span>
            <span>Fed</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚪</span>
            <span>Let Out</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Now</span>
          </div>
        </div>
      </div>
    </div>
  );
}