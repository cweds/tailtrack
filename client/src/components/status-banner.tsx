import { cn } from "@/lib/utils";

interface StatusBannerProps {
  bothFed: boolean;
  bothLetOut: boolean;
  allComplete: boolean;
}

export function StatusBanner({ bothFed, bothLetOut, allComplete }: StatusBannerProps) {
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
    
    if (!bothFed && !bothLetOut) {
      message = `Both dogs still need care this ${timeContext}.`;
    } else if (!bothFed) {
      message = `Dogs still need to be fed this ${timeContext}.`;
    } else if (!bothLetOut) {
      message = `Dogs still need to be let out this ${timeContext}.`;
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
