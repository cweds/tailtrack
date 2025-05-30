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
    bgClass = "soft-blue-gradient";
  } else {
    // Determine what's missing for each dog
    const nattyNeedsFed = !nattyStatus.fed;
    const nattyNeedsOut = !nattyStatus.letOut;
    const murphyNeedsFed = !murphyStatus.fed;
    const murphyNeedsOut = !murphyStatus.letOut;
    
    const timeContext = isEvening ? "evening" : "morning";
    
    // Check if both dogs are completely cared for individually
    const nattyComplete = nattyStatus.fed && nattyStatus.letOut;
    const murphyComplete = murphyStatus.fed && murphyStatus.letOut;
    
    if (!nattyComplete && !murphyComplete) {
      message = `Both dogs still need care this ${timeContext}.`;
    } else if (!nattyComplete) {
      message = `Natty still needs care this ${timeContext}.`;
    } else if (!murphyComplete) {
      message = `Murphy still needs care this ${timeContext}.`;
    } else {
      message = `Dogs need care this ${timeContext}.`;
    }
    
    emoji = "⚠️";
    bgClass = "golden-tan-gradient";
  }

  return (
    <div className={cn(
      "mx-4 mt-4 p-4 rounded-xl text-center font-medium paw-shadow text-gray-800",
      bgClass
    )}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
}
