import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { Action, Dog } from "@/hooks/use-dog-care";
import { DatabaseStorage } from "@/lib/database-storage";
import { useAuth } from "@/contexts/auth-context";

interface ActionButtonsProps {
  canTakeAction: boolean;
  onAction: (action: Action) => void;
  onQuickAction: (action: Action) => void;
  selectedDogs: Set<Dog>;
}

export function ActionButtons({ canTakeAction, onAction, onQuickAction, selectedDogs }: ActionButtonsProps) {
  const { user } = useAuth();
  const [canFeed, setCanFeed] = useState(false);
  const [canLetOut, setCanLetOut] = useState(false);

  const selectedDogsArray = Array.from(selectedDogs);
  const isBothDogs = selectedDogsArray.length === 2;
  const dogText = isBothDogs ? "Both" : selectedDogsArray[0];
  
  // Check cooldowns when selection changes
  useEffect(() => {
    const checkCooldowns = async () => {
      if (!user?.id || selectedDogsArray.length === 0) return;
      
      try {
        const feedChecks = await Promise.all(
          selectedDogsArray.map(dog => DatabaseStorage.canPerformAction(user.id, dog, 'Fed'))
        );
        const letOutChecks = await Promise.all(
          selectedDogsArray.map(dog => DatabaseStorage.canPerformAction(user.id, dog, 'Let Out'))
        );
        
        setCanFeed(feedChecks.every(can => can));
        setCanLetOut(letOutChecks.every(can => can));
      } catch (error) {
        console.error('Error checking cooldowns:', error);
        setCanFeed(true);
        setCanLetOut(true);
      }
    };

    if (selectedDogsArray.length > 0) {
      checkCooldowns();
    } else {
      setCanFeed(false);
      setCanLetOut(false);
    }
  }, [user?.id, selectedDogsArray.join(',')]);

  // Only show buttons when dogs are selected
  if (selectedDogs.size === 0) {
    return null;
  }

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
