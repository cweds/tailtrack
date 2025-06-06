import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Home, Footprints, GamepadIcon, Scissors, Pill, GraduationCap, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Action } from "@/hooks/use-pet-care";
import type { Pet } from "../../../shared/schema";

interface ActionButtonsProps {
  canTakeAction: boolean;
  onAction: (action: Action) => void;
  onQuickAction: (action: Action) => void;
  selectedPets: Set<Pet>;
  refreshTrigger?: number;
  activities: any[];
}

// Define which activities are primary for each pet type
const PET_PRIMARY_ACTIVITIES = {
  dog: ['Fed', 'Bathroom'],
  cat: ['Fed', 'Litter Box'],
  bird: ['Fed', 'Clean Cage'],
  hamster: ['Fed', 'Clean Cage'],
  rabbit: ['Fed', 'Clean Cage'],
  'guinea pig': ['Fed', 'Clean Cage'],
  fish: ['Fed', 'Clean Tank'],
} as const;

// Define activity configurations
const ACTIVITY_CONFIG = {
  'Fed': { 
    icon: Heart, 
    emoji: '🍖', 
    label: 'Feed', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-red-200 hover:bg-red-300',
    petTypes: ['dog', 'cat', 'bird', 'hamster', 'rabbit', 'guinea pig', 'fish']
  },
  'Bathroom': { 
    icon: Home, 
    emoji: '🚽', 
    label: 'Bathroom Break', 
    spamThreshold: 10 * 1000,
    gradient: 'soft-blue-gradient',
    petTypes: ['dog', 'rabbit', 'guinea pig']
  },
  'Walked': { 
    icon: Footprints, 
    emoji: '🚶', 
    label: 'Walk', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-green-100 hover:bg-green-200',
    petTypes: ['dog']
  },
  'Played': { 
    icon: GamepadIcon, 
    emoji: '🎾', 
    label: 'Play', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-yellow-100 hover:bg-yellow-200',
    petTypes: ['dog', 'cat', 'bird', 'hamster', 'rabbit', 'guinea pig']
  },
  'Groomed': { 
    icon: Scissors, 
    emoji: '✂️', 
    label: 'Groom', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-purple-100 hover:bg-purple-200',
    petTypes: ['dog', 'cat', 'bird', 'rabbit', 'guinea pig']
  },
  'Medication': { 
    icon: Pill, 
    emoji: '💊', 
    label: 'Medicine', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-red-100 hover:bg-red-200',
    petTypes: ['dog', 'cat', 'bird', 'hamster', 'rabbit', 'guinea pig', 'fish']
  },
  'Training': { 
    icon: GraduationCap, 
    emoji: '🎓', 
    label: 'Train', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-blue-100 hover:bg-blue-200',
    petTypes: ['dog', 'bird']
  },
  'Litter Box': { 
    icon: Trash2, 
    emoji: '🧹', 
    label: 'Clean Litter Box', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-orange-100 hover:bg-orange-200',
    petTypes: ['cat']
  },
  'Clean Cage': { 
    icon: Trash2, 
    emoji: '🧽', 
    label: 'Clean Cage', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-orange-100 hover:bg-orange-200',
    petTypes: ['hamster', 'bird', 'rabbit', 'guinea pig']
  },
  'Clean Tank': { 
    icon: Trash2, 
    emoji: '✨', 
    label: 'Clean Tank', 
    spamThreshold: 10 * 1000,
    gradient: 'bg-orange-100 hover:bg-orange-200',
    petTypes: ['fish']
  },
} as const;

export function ActionButtons({ canTakeAction, onAction, onQuickAction, selectedPets, refreshTrigger, activities }: ActionButtonsProps) {
  const { user } = useAuth();
  const [showMoreActivities, setShowMoreActivities] = useState(false);
  const { toast } = useToast();

  const selectedPetsArray = Array.from(selectedPets || []);
  
  // Get relevant activities and determine primary actions based on pet types
  const getActivityInfo = () => {
    if (selectedPetsArray.length === 0) return { primaryActions: [], secondaryActions: [] };
    
    const selectedPetTypes = selectedPetsArray.map(pet => pet.petType?.toLowerCase() || '');
    const uniquePetTypes = Array.from(new Set(selectedPetTypes));
    
    // Filter activities that are relevant to selected pets
    const relevantActivities = Object.entries(ACTIVITY_CONFIG).filter(([actionKey, config]) => {
      // Fed is always available for any pet type
      if (actionKey === 'Fed') return true;
      // Other activities only available if pet type is explicitly supported
      return selectedPetTypes.some(petType => config.petTypes.includes(petType));
    });
    
    // Determine primary activities
    let primaryActivityNames: string[] = [];
    
    if (uniquePetTypes.length > 1) {
      // Multiple pet types: only Feed is primary
      primaryActivityNames = ['Fed'];
    } else if (uniquePetTypes.length === 1) {
      // Single pet type: use its specific primary activities
      const petType = uniquePetTypes[0] as keyof typeof PET_PRIMARY_ACTIVITIES;
      primaryActivityNames = [...(PET_PRIMARY_ACTIVITIES[petType] || ['Fed'])];
    }
    
    // Split into primary and secondary
    const primaryActions = relevantActivities.filter(([actionKey]) => 
      primaryActivityNames.includes(actionKey)
    );
    
    const secondaryActions = relevantActivities.filter(([actionKey]) => 
      !primaryActivityNames.includes(actionKey)
    );
    
    return { primaryActions, secondaryActions };
  };
  
  const { primaryActions, secondaryActions } = getActivityInfo();
  
  // Reset "More Activities" when pets are deselected
  useEffect(() => {
    if (selectedPetsArray.length === 0) {
      setShowMoreActivities(false);
    }
  }, [selectedPetsArray.length]);

  // Handle action with spam protection
  const handleActionWithSpamCheck = (action: Action) => {
    if (!user?.id || selectedPetsArray.length === 0) return;

    const now = new Date();
    const config = ACTIVITY_CONFIG[action];
    
    // Check if this action was done too recently (spam protection)
    const recentActivity = activities
      .filter(activity => 
        activity.userId === user.id &&
        selectedPetsArray.some(pet => activity.petIds?.includes(pet.id)) &&
        activity.action === action
      )
      .sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const bTime = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return bTime.getTime() - aTime.getTime();
      })[0];

    if (recentActivity && config) {
      const lastActivityTime = recentActivity.timestamp instanceof Date ? 
        recentActivity.timestamp : new Date(recentActivity.timestamp);
      const timeDiff = now.getTime() - lastActivityTime.getTime();
      
      if (timeDiff < config.spamThreshold) {
        const remainingSeconds = Math.ceil((config.spamThreshold - timeDiff) / 1000);
        toast({
          title: "Please wait",
          description: `You can ${config.label.toLowerCase()} again in ${remainingSeconds} seconds.`,
          variant: "destructive",
        });
        return;
      }
    }

    // If not spam, proceed with the action
    onAction(action);
  };

  const renderActionButton = (actionKey: string, config: typeof ACTIVITY_CONFIG[keyof typeof ACTIVITY_CONFIG]) => {
    const action = actionKey as Action;

    return (
      <div key={action} className="relative">
        <Button
          onClick={() => handleActionWithSpamCheck(action)}
          disabled={!canTakeAction}
          className={`
            w-full
            ${config.gradient} 
            disabled:bg-gray-300 disabled:cursor-not-allowed 
            text-gray-800 font-medium 
            py-4 px-6
            rounded-xl paw-shadow playful-bounce 
            disabled:transform-none disabled:filter-none disabled:shadow-none 
            h-auto
          `}
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">{config.emoji}</span>
            <span>{config.label}</span>
          </span>
        </Button>
      </div>
    );
  };

  // Don't show activities if no pets are selected
  if (selectedPetsArray.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="space-y-4">
        {primaryActions.map(([actionKey, config]) => 
          renderActionButton(actionKey, config)
        )}
      </div>
      
      {/* More Activities Toggle */}
      {secondaryActions.length > 0 && (
        <div>
          <Button
            variant="outline"
            onClick={() => setShowMoreActivities(!showMoreActivities)}
            className="w-full py-3 text-gray-600 border-gray-200 hover:bg-gray-50"
          >
            <span className="flex items-center justify-center gap-2">
              <span>More Activities</span>
              {showMoreActivities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </Button>
          
          {showMoreActivities && (
            <div className="mt-4 space-y-3">
              {secondaryActions.map(([actionKey, config]) => 
                renderActionButton(actionKey, config)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}