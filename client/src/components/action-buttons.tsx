import { Button } from "@/components/ui/button";
import type { Action } from "@/hooks/use-dog-care";

interface ActionButtonsProps {
  canTakeAction: boolean;
  onAction: (action: Action) => void;
  onQuickAction: (action: Action) => void;
  selectedUser: string | null;
}

export function ActionButtons({ canTakeAction, onAction, onQuickAction, selectedUser }: ActionButtonsProps) {
  const canQuickAction = selectedUser !== null;

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons for Both Dogs */}
      <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
        <h3 className="text-sm font-medium text-amber-800 mb-3 text-center">Quick Actions (Both Dogs)</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => onQuickAction('Fed')}
            disabled={!canQuickAction}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-all duration-200 h-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-1">
              <span>✅</span>
              <span>Fed Both</span>
            </span>
          </Button>
          
          <Button
            onClick={() => onQuickAction('Let Out')}
            disabled={!canQuickAction}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-all duration-200 h-auto text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-1">
              <span>🚪</span>
              <span>Let Out Both</span>
            </span>
          </Button>
        </div>
      </div>

      {/* Individual Action Buttons */}
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
    </div>
  );
}
