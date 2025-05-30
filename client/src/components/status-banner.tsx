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
  } else {
    // Determine what's missing for each dog
    const nattyNeedsFed = !nattyStatus.fed;
    const nattyNeedsOut = !nattyStatus.letOut;
    const murphyNeedsFed = !murphyStatus.fed;
    const murphyNeedsOut = !murphyStatus.letOut;
    
    const timeContext = isEvening ? "evening" : "morning";
    
    // Check if both dogs need the same things
    const bothNeedFed = nattyNeedsFed && murphyNeedsFed;
    const bothNeedOut = nattyNeedsOut && murphyNeedsOut;
    const bothNeedBoth = (nattyNeedsFed && nattyNeedsOut) && (murphyNeedsFed && murphyNeedsOut);
    
    if (bothNeedBoth) {
      message = `Both Natty and Murphy need to be fed and let out for ${timeContext}.`;
    } else if (bothNeedFed && bothNeedOut) {
      message = `Both Natty and Murphy need to be fed and let out for ${timeContext}.`;
    } else if (bothNeedFed) {
      message = `Both Natty and Murphy need to be fed for ${timeContext}.`;
    } else if (bothNeedOut) {
      message = `Both Natty and Murphy need to be let out for ${timeContext}.`;
    } else {
      // Individual dog needs
      let warnings = [];
      
      if (nattyNeedsFed && nattyNeedsOut) {
        warnings.push("Natty needs to be fed and let out");
      } else if (nattyNeedsFed) {
        warnings.push("Natty needs to be fed");
      } else if (nattyNeedsOut) {
        warnings.push("Natty needs to be let out");
      }
      
      if (murphyNeedsFed && murphyNeedsOut) {
        warnings.push("Murphy needs to be fed and let out");
      } else if (murphyNeedsFed) {
        warnings.push("Murphy needs to be fed");
      } else if (murphyNeedsOut) {
        warnings.push("Murphy needs to be let out");
      }
      
      message = `${warnings.join(" and ")} for ${timeContext}.`;
    }
    
    emoji = "⚠️";
    bgClass = "bg-gradient-to-r from-slate-600 to-gray-600";
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
