import { Button } from "@/components/ui/button";
import type { Action, User, Dog } from "@/hooks/use-dog-care";

interface ActionButtonsProps {
  canTakeAction: boolean;
  onAction: (action: Action) => void;
  onQuickAction: (action: Action) => void;
  selectedUser: User | null;
  selectedDogs: Set<Dog>;
}

export function ActionButtons({ canTakeAction, onAction, onQuickAction, selectedUser, selectedDogs }: ActionButtonsProps) {
  // Only show buttons when dogs are selected and user is selected
  if (!selectedUser || selectedDogs.size === 0) {
    return null;
  }

  const selectedDogsArray = Array.from(selectedDogs);
  const isBothDogs = selectedDogsArray.length === 2;
  const dogText = isBothDogs ? "Both" : selectedDogsArray[0];

  return (
    <div className="space-y-3">
      <Button
        onClick={() => onAction('Fed')}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🍖</span>
          <span>Fed {dogText}</span>
        </span>
      </Button>
      
      <Button
        onClick={() => onAction('Let Out')}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🚪</span>
          <span>Let {dogText} Out</span>
        </span>
      </Button>
    </div>
  );
}
