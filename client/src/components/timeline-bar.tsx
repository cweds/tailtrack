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
        {/* Timeline blocks */}
        <div className="grid grid-cols-7 gap-1">
          {hours.map(hour => {
            const hourActivities = getActivitiesForHour(hour);
            const isCurrentHour = new Date().getHours() === hour;
            const fedActivity = hourActivities.find(a => a.action === 'Fed');
            const letOutActivity = hourActivities.find(a => a.action === 'Let Out');
            
            return (
              <div
                key={hour}
                className={`relative p-2 rounded-lg border-2 h-20 flex flex-col items-center justify-center ${
                  isCurrentHour 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {/* Hour label */}
                <div className="text-xs font-medium text-gray-600 mb-1">
                  {formatHour(hour)}
                </div>
                
                {/* Activity emojis stacked */}
                <div className="flex flex-col items-center gap-1">
                  {fedActivity && (
                    <div 
                      className="text-lg"
                      title={`${fedActivity.dogs.join(', ')} - Fed at ${new Date(fedActivity.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                    >
                      🍽️
                    </div>
                  )}
                  {letOutActivity && (
                    <div 
                      className="text-lg"
                      title={`${letOutActivity.dogs.join(', ')} - Let Out at ${new Date(letOutActivity.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                    >
                      🚪
                    </div>
                  )}
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