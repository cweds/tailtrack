import { Button } from "@/components/ui/button";
import type { Action, Dog } from "@/hooks/use-dog-care";
import { DogCareStorage } from "@/lib/dog-care-storage";

interface ActionButtonsProps {
  canTakeAction: boolean;
  onAction: (action: Action) => void;
  onQuickAction: (action: Action) => void;
  selectedDogs: Set<Dog>;
}

export function ActionButtons({ canTakeAction, onAction, onQuickAction, selectedDogs }: ActionButtonsProps) {
  // Only show buttons when dogs are selected
  if (selectedDogs.size === 0) {
    return null;
  }

  const selectedDogsArray = Array.from(selectedDogs);
  const isBothDogs = selectedDogsArray.length === 2;
  const dogText = isBothDogs ? "Both" : selectedDogsArray[0];
  
  // Check if any selected dog is on cooldown for each action
  const canFeed = selectedDogsArray.every(dog => DogCareStorage.canPerformAction(dog, 'Fed'));
  const canLetOut = selectedDogsArray.every(dog => DogCareStorage.canPerformAction(dog, 'Let Out'));

  return (
    <div className="space-y-3">
      <Button
        onClick={() => onAction('Fed')}
        disabled={!canFeed}
        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🍖</span>
          <span>Fed {dogText}</span>
        </span>
      </Button>
      
      <Button
        onClick={() => onAction('Let Out')}
        disabled={!canLetOut}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🚪</span>
          <span>Let {dogText} Out</span>
        </span>
      </Button>
    </div>
  );
}
