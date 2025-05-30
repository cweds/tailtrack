import { cn } from "@/lib/utils";

interface StatusBannerProps {
  bothFed: boolean;
  bothLetOut: boolean;
  allComplete: boolean;
  nattyFed: boolean;
  nattyLetOut: boolean;
  murphyFed: boolean;
  murphyLetOut: boolean;
}

export function StatusBanner({ bothFed, bothLetOut, allComplete, nattyFed, nattyLetOut, murphyFed, murphyLetOut }: StatusBannerProps) {
  const currentHour = new Date().getHours();
  const isEvening = currentHour >= 16; // 4 PM and later
  
  let message: string;
  let emoji: string;
  let bgClass: string;

  if (allComplete) {
    message = isEvening 
      ? "Both dogs have been fed and let out for the evening — you're crushing it!"
      : "Both dogs have been fed and let out this morning — you're crushing it!";
    emoji = "🎉";
    bgClass = "pup-green-gradient";
  } else {
    const timeContext = isEvening ? "evening" : "morning";
    
    // Check individual dog completion status
    const nattyComplete = nattyFed && nattyLetOut;
    const murphyComplete = murphyFed && murphyLetOut;
    
    if (!nattyComplete && !murphyComplete) {
      // Check what both dogs need - only use specific messages if BOTH dogs need the SAME thing
      const bothNeedFeeding = !nattyFed && !murphyFed;
      const bothNeedLetOut = !nattyLetOut && !murphyLetOut;
      const nattyNeedsFeeding = !nattyFed;
      const nattyNeedsLetOut = !nattyLetOut;
      const murphyNeedsFeeding = !murphyFed;
      const murphyNeedsLetOut = !murphyLetOut;
      
      // Only show specific action if both dogs need exactly the same thing AND nothing else
      if (bothNeedFeeding && nattyLetOut && murphyLetOut) {
        // Both dogs have been let out, both need feeding
        message = `Both dogs still need to be fed this ${timeContext}.`;
      } else if (bothNeedLetOut && nattyFed && murphyFed) {
        // Both dogs have been fed, both need letting out
        message = `Both dogs still need to be let out this ${timeContext}.`;
      } else {
        // Mixed scenarios - use general message
        message = `Both dogs still need care this ${timeContext}.`;
      }
    } else if (!nattyComplete && murphyComplete) {
      // Only Natty needs care
      if (!nattyFed && !nattyLetOut) {
        message = `Natty still needs care this ${timeContext}.`;
      } else if (!nattyFed) {
        message = `Natty still needs to be fed this ${timeContext}.`;
      } else {
        message = `Natty still needs to be let out this ${timeContext}.`;
      }
    } else if (nattyComplete && !murphyComplete) {
      // Only Murphy needs care
      if (!murphyFed && !murphyLetOut) {
        message = `Murphy still needs care this ${timeContext}.`;
      } else if (!murphyFed) {
        message = `Murphy still needs to be fed this ${timeContext}.`;
      } else {
        message = `Murphy still needs to be let out this ${timeContext}.`;
      }
    } else {
      message = `Dogs need care this ${timeContext}.`;
    }
    
    emoji = "⚠️";
    bgClass = "";
  }

  return (
    <div 
      className={cn(
        "mx-4 mt-4 p-4 rounded-xl text-center font-medium paw-shadow text-gray-800",
        bgClass
      )}
      style={
        !allComplete ? {
          backgroundColor: '#e5e7eb',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: '#6b7280'
        } : undefined
      }
    >
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
}
