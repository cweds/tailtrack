import { DogCareStorage } from "@/lib/dog-care-storage";
import { cn } from "@/lib/utils";

export function DogStatusOverview() {
  const nattyStatus = DogCareStorage.getDogStatusToday('Natty');
  const murphyStatus = DogCareStorage.getDogStatusToday('Murphy');

  const DogStatusCard = ({ 
    name, 
    emoji, 
    fed, 
    letOut 
  }: { 
    name: string; 
    emoji: string; 
    fed: boolean; 
    letOut: boolean; 
  }) => (
    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <span className="font-medium text-gray-800">{name}</span>
      </div>
      <div className="flex gap-2">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
          fed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
        )}>
          ✅
        </div>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
          letOut ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
        )}>
          🚪
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
      <h3 className="text-sm font-medium text-orange-800 mb-3 text-center">Today's Status at a Glance</h3>
      <div className="space-y-2">
        <DogStatusCard 
          name="Natty" 
          emoji="🩶" 
          fed={nattyStatus.fed} 
          letOut={nattyStatus.letOut} 
        />
        <DogStatusCard 
          name="Murphy" 
          emoji="🐕‍🦺" 
          fed={murphyStatus.fed} 
          letOut={murphyStatus.letOut} 
        />
      </div>
    </div>
  );
}