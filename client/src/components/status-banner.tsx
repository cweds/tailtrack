import { cn } from "@/lib/utils";

interface StatusBannerProps {
  bothFed: boolean;
  bothLetOut: boolean;
  allComplete: boolean;
}

export function StatusBanner({ bothFed, bothLetOut, allComplete }: StatusBannerProps) {
  let message: string;
  let emoji: string;
  let bgClass: string;

  if (allComplete) {
    message = "Both dogs have been fed and let out — you're crushing it!";
    emoji = "🎉";
    bgClass = "success-gradient";
  } else if (bothFed && !bothLetOut) {
    message = "Both dogs have been fed!";
    emoji = "✅";
    bgClass = "success-gradient";
  } else if (!bothFed && bothLetOut) {
    message = "Both dogs have been let out!";
    emoji = "🚪";
    bgClass = "info-gradient";
  } else {
    message = "Still missing care for one or both pups…";
    emoji = "👀";
    bgClass = "warm-gradient";
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
