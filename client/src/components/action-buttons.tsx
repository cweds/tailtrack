import { Button } from "@/components/ui/button";
import type { Action } from "@/hooks/use-dog-care";

interface ActionButtonsProps {
  canTakeAction: boolean;
  onAction: (action: Action) => void;
}

export function ActionButtons({ canTakeAction, onAction }: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      <Button
        onClick={() => onAction('Fed')}
        disabled={!canTakeAction}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">✅</span>
          <span>Fed Selected Dog(s)</span>
        </span>
      </Button>
      
      <Button
        onClick={() => onAction('Let Out')}
        disabled={!canTakeAction}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🚪</span>
          <span>Let Out Selected Dog(s)</span>
        </span>
      </Button>
    </div>
  );
}
