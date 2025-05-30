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
  const [canFeed, setCanFeed] = useState(true);  // Optimistic - assume available until proven otherwise
  const [canLetOut, setCanLetOut] = useState(true);  // Optimistic - assume available until proven otherwise
  const [isChecking, setIsChecking] = useState(false);

  const selectedDogsArray = Array.from(selectedDogs);
  const isBothDogs = selectedDogsArray.length === 2;
  const dogText = isBothDogs ? "Both" : selectedDogsArray[0];
  
  // Check cooldowns when selection changes - but debounce it
  useEffect(() => {
    if (!user?.id || selectedDogsArray.length === 0) {
      setCanFeed(false);
      setCanLetOut(false);
      return;
    }

    // Start optimistic - assume buttons are available
    setCanFeed(true);
    setCanLetOut(true);
    setIsChecking(true);
    
    // Use a timeout to debounce rapid selection changes
    const timeout = setTimeout(async () => {
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
        // On error, keep buttons enabled rather than blocking user
        setCanFeed(true);
        setCanLetOut(true);
      } finally {
        setIsChecking(false);
      }
    }, 50); // Reduced to 50ms for faster response

    return () => clearTimeout(timeout);
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
        className="w-full pup-pink-gradient hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium py-4 px-6 rounded-xl paw-shadow playful-bounce disabled:hover:scale-100 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🍖</span>
          <span>Fed {dogText}</span>
        </span>
      </Button>
      
      <Button
        onClick={() => onAction('Let Out')}
        disabled={!canLetOut}
        className="w-full soft-blue-gradient hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium py-4 px-6 rounded-xl paw-shadow playful-bounce disabled:hover:scale-100 h-auto"
      >
        <span className="flex items-center justify-center gap-2">
          <span className="text-lg">🚪</span>
          <span>Let {dogText} Out</span>
        </span>
      </Button>
    </div>
  );
}
