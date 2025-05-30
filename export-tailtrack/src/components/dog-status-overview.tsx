import { DogCareStorage } from "@/lib/dog-care-storage";
import { cn } from "@/lib/utils";
import nattyImage from "@assets/image0.png";
import murphyImage from "@assets/image1.png";

export function DogStatusOverview() {
  const nattyStatus = DogCareStorage.getDogStatusToday('Natty');
  const murphyStatus = DogCareStorage.getDogStatusToday('Murphy');

  const DogStatusCard = ({ 
    name, 
    avatar, 
    fed, 
    letOut 
  }: { 
    name: string; 
    avatar: string; 
    fed: boolean; 
    letOut: boolean; 
  }) => (
    <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img 
          src={avatar} 
          alt={name}
          className="w-8 h-8 rounded-full object-cover"
        />
        <span className="font-medium text-gray-800">{name}</span>
      </div>
      <div className="flex gap-2">
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
          fed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-400"
        )}>
          🍖
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
          avatar={nattyImage} 
          fed={nattyStatus.fed} 
          letOut={nattyStatus.letOut} 
        />
        <DogStatusCard 
          name="Murphy" 
          avatar={murphyImage} 
          fed={murphyStatus.fed} 
          letOut={murphyStatus.letOut} 
        />
      </div>
    </div>
  );
}