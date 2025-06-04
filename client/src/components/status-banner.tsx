import { cn } from "@/lib/utils";
import { Pet } from "@shared/schema";

interface StatusBannerProps {
  allFed: boolean;
  allLetOut: boolean;
  allComplete: boolean;
  pets: Pet[];
  petStatuses: Record<number, { fed: boolean; letOut: boolean }>;
}

export function StatusBanner({ allFed, allLetOut, allComplete, pets, petStatuses }: StatusBannerProps) {
  // Don't show status banner if no pets are loaded
  if (pets.length === 0) {
    return null;
  }

  // Get current time in user's local timezone
  const now = new Date();
  const currentHour = now.getHours();
  
  // Hide banner during late night rest period (12am-3:59am)
  if (currentHour >= 0 && currentHour < 4) {
    return null;
  }
  
  // Determine care period and time context
  let carePhase: 'morning' | 'afternoon' | 'evening';
  let timeContext: string;
  
  if (currentHour >= 4 && currentHour < 12) {
    carePhase = 'morning';
    timeContext = "morning";
  } else if (currentHour >= 16 && currentHour <= 23) {
    carePhase = 'evening';
    timeContext = "evening";
  } else if (currentHour >= 12 && currentHour < 16) {
    carePhase = 'afternoon';
    timeContext = "afternoon";
  } else {
    // Late night/early morning (12am-4am) - consider it part of evening care
    carePhase = 'evening';
    timeContext = "evening";
  }

  // Define daily care requirements for each pet type
  const getDailyCareRequirements = (petType: string | null) => {
    if (!petType) return { feedingsPerDay: 1, bathroomBreaksPerDay: 0 };
    
    switch (petType.toLowerCase()) {
      case 'dog':
        return { feedingsPerDay: 2, bathroomBreaksPerDay: 2 }; // Morning & evening
      case 'cat':
        return { feedingsPerDay: 2, bathroomBreaksPerDay: 0 }; // Morning & evening, cats use litter boxes
      default:
        return { feedingsPerDay: 1, bathroomBreaksPerDay: 0 }; // Once daily for other pets
    }
  };

  // Calculate completion based on realistic daily care needs
  const calculatePetCompletion = () => {
    // We need to check activities within the current care period
    // For morning period (4am-12pm) and evening period (4pm-11:59pm + 12am-4am)
    
    const completionResults = pets.map(pet => {
      const requirements = getDailyCareRequirements(pet.petType);
      const petStatus = petStatuses[pet.id];
      
      let needsFeed = false;
      let needsBathroom = false;
      
      if (requirements.feedingsPerDay === 1) {
        // Single daily feeding - check if fed at all today
        needsFeed = !petStatus?.fed;
      } else if (requirements.feedingsPerDay === 2) {
        // Two feedings per day - check based on current care phase
        if (carePhase === 'morning') {
          // Morning: need morning feeding
          needsFeed = !petStatus?.fed;
        } else if (carePhase === 'evening') {
          // Evening: need evening feeding (separate from morning)
          // For now, we'll use the existing petStatus but this should ideally track morning vs evening separately
          needsFeed = !petStatus?.fed;
        } else {
          // Afternoon: maintain current status from morning period
          needsFeed = !petStatus?.fed;
        }
      }
      
      if (requirements.bathroomBreaksPerDay > 0) {
        // Always check current status regardless of time period
        needsBathroom = !petStatus?.letOut;
      }
      
      return {
        pet,
        isComplete: !needsFeed && !needsBathroom,
        needsFeed,
        needsBathroom,
        requirements
      };
    });

    const allComplete = completionResults.every(result => result.isComplete);
    const incompletePets = completionResults.filter(result => !result.isComplete);
    
    return { allComplete, incompletePets, completionResults };
  };

  const { allComplete: petSpecificComplete, incompletePets } = calculatePetCompletion();
  
  let message: string;
  let emoji: string;
  let bgClass: string;

  if (petSpecificComplete) {
    const petWord = pets.length === 1 ? "pet" : "pets";
    message = `All ${petWord} have had their essential ${timeContext} care — you're doing great!`;
    emoji = "🎉";
    bgClass = "pup-green-gradient";
  } else {
    const petWord = pets.length === 1 ? "pet" : "pets";
    
    // Generate specific messages based on what each pet needs
    if (incompletePets.length === 1) {
      const pet = incompletePets[0].pet;
      const needs = [];
      if (incompletePets[0].needsFeed) needs.push("feeding");
      if (incompletePets[0].needsBathroom) needs.push("bathroom break");
      
      if (needs.length === 1) {
        message = `${pet.name} still needs ${timeContext} ${needs[0]}.`;
      } else {
        message = `${pet.name} still needs ${timeContext} ${needs.join(" and ")}.`;
      }
    } else if (incompletePets.length === pets.length) {
      // All pets need care
      const allNeedFeed = incompletePets.every(p => p.needsFeed);
      const allNeedBathroom = incompletePets.every(p => p.needsBathroom);
      
      if (allNeedFeed && allNeedBathroom) {
        message = `Your ${petWord} still need to be fed and let out this ${timeContext}.`;
      } else if (allNeedFeed) {
        message = `Your ${petWord} still need to be fed this ${timeContext}.`;
      } else {
        message = `Some ${petWord} still need ${timeContext} care.`;
      }
    } else {
      // Some pets need care
      message = `Some ${petWord} still need ${timeContext} care.`;
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
        <span className="text-2xl leading-none" style={{ marginTop: '-2px' }}>{emoji}</span>
        <span className="font-semibold">{message}</span>
      </div>
    </div>
  );
}
