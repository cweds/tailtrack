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
    message = isEvening
      ? "Still need evening care for one or both pups…"
      : "Still need morning care for one or both pups…";
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
