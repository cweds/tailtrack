import { cn } from "@/lib/utils";
import { DogCareStorage } from "@/lib/dog-care-storage";

interface StatusBannerProps {
  bothFed: boolean;
  bothLetOut: boolean;
  allComplete: boolean;
}

export function StatusBanner({ bothFed, bothLetOut, allComplete }: StatusBannerProps) {
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 16; // 4 PM and later
  
  // Get individual dog statuses
  const nattyStatus = DogCareStorage.getDogStatusToday('Natty');
  const murphyStatus = DogCareStorage.getDogStatusToday('Murphy');
  
  let message: string;
  let emoji: string;
  let bgClass: string;

  if (allComplete) {
    message = isEvening 
      ? "Both dogs have been fed and let out for the evening — you're crushing it!"
      : "Both dogs have been fed and let out this morning — you're crushing it!";
    emoji = "🎉";
    bgClass = "success-gradient";
  } else if (bothFed && !bothLetOut) {
    message = isEvening
      ? "Both dogs have been fed for the evening!"
      : "Both dogs have been fed this morning!";
    emoji = "✅";
    bgClass = "success-gradient";
  } else if (!bothFed && bothLetOut) {
    message = isEvening
      ? "Both dogs have been let out for the evening!"
      : "Both dogs have been let out this morning!";
    emoji = "🚪";
    bgClass = "info-gradient";
  } else {
    // Determine which dogs need care
    const nattyComplete = nattyStatus.fed && nattyStatus.letOut;
    const murphyComplete = murphyStatus.fed && murphyStatus.letOut;
    
    let dogsNeedingCare: string;
    if (!nattyComplete && !murphyComplete) {
      dogsNeedingCare = "both pups";
    } else if (!nattyComplete) {
      dogsNeedingCare = "Natty";
    } else {
      dogsNeedingCare = "Murphy";
    }
    
    message = isEvening
      ? `Still need evening care for ${dogsNeedingCare}…`
      : `Still need morning care for ${dogsNeedingCare}…`;
    emoji = "👀";
    bgClass = "bg-gradient-to-r from-slate-500 to-gray-500";
  }

  return (
    <div className={cn(
      "mx-4 mt-4 p-4 rounded-xl text-center font-medium shadow-lg text-white",
      bgClass
    )}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
}
