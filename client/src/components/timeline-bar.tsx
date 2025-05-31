import { DatabaseActivity } from '../lib/database-storage';

interface TimelineBarProps {
  activities: DatabaseActivity[];
}

export function TimelineBar({ activities }: TimelineBarProps) {
  // Create timeline from 6am to 12pm
  const hours = Array.from({ length: 7 }, (_, i) => 6 + i); // 6, 7, 8, 9, 10, 11, 12

  const getActivitiesForHour = (hour: number) => {
    return activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const activityHour = activityDate.getHours();
      const today = new Date();
      const isToday = activityDate.toDateString() === today.toDateString();
      return activityHour === hour && isToday;
    });
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12AM';
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
            <div key={hour} className="text-center flex-1">
              {formatHour(hour)}
            </div>
          ))}
        </div>

        {/* Timeline bar */}
        <div className="relative bg-gray-200 h-16 rounded-lg overflow-hidden">
          {/* Hour segments */}
          {hours.map((hour, index) => {
            const hourActivities = getActivitiesForHour(hour);
            const isCurrentHour = new Date().getHours() === hour;
            
            return (
              <div
                key={hour}
                className={`absolute top-0 h-full border-r border-gray-300 flex flex-col items-center justify-center ${
                  isCurrentHour ? 'bg-green-200' : ''
                }`}
                style={{
                  left: `${(index / hours.length) * 100}%`,
                  width: `${100 / hours.length}%`
                }}
              >
                {/* Activity emojis stacked */}
                <div className="flex flex-col items-center gap-0.5">
                  {hourActivities.map((activity, actIndex) => (
                    <div
                      key={`${activity.id}-${actIndex}`}
                      className="text-lg"
                      title={`${activity.dogs.join(', ')} - ${activity.action} at ${new Date(activity.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                    >
                      {getActivityEmoji(activity)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
            <div className="w-3 h-3 bg-green-200 border-2 border-green-300 rounded"></div>
            <span>Current Hour</span>
          </div>
        </div>
      </div>
    </div>
  );
}