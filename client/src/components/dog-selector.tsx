import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pet } from "@shared/schema";
import { Grid3X3, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAddPet } from "@/contexts/add-pet-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PetAvatar } from "@/components/ui/pet-avatar";

interface DogSelectorProps {
  selectedDogs: Set<Pet>;
  onDogToggle: (pet: Pet) => void;
  onSelectBothDogs: () => void;
  dogs: Pet[];
  isLoading?: boolean;
  hasHousehold?: boolean;
}

export function DogSelector({ selectedDogs, onDogToggle, onSelectBothDogs, dogs, isLoading = false, hasHousehold = true }: DogSelectorProps) {
  const { openAddPetDialog } = useAddPet();
  
  // Layout preference state with localStorage persistence
  const [layoutType, setLayoutType] = useState<'grid' | 'scroll'>(() => {
    const saved = localStorage.getItem('petLayoutPreference');
    return (saved === 'grid' || saved === 'scroll') ? saved : 'grid';
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-xl paw-shadow border border-pink-200">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            🐾 Loading pets...
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-3 rounded-lg border-2 border-gray-200 h-24 bg-gray-50 animate-pulse"
            />
          ))}
        </div>
        <div className="w-full mt-3 p-2 text-sm font-medium rounded-lg border-2 border-gray-200 text-center bg-gray-50 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  // Show empty state when no pets are available
  if (dogs.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl paw-shadow border border-pink-200">
        <EmptyState
          title="No pets yet"
          description={hasHousehold ? "Add your first pet to start tracking their care" : "Join or create a household first"}
          actionText={hasHousehold ? "Add Pet" : "Go to Household"}
          onAction={hasHousehold ? openAddPetDialog : () => window.location.href = '/household'}
          className="py-8"
        />
      </div>
    );
  }

  // Save preference when changed
  const handleLayoutChange = (newLayout: 'grid' | 'scroll') => {
    setLayoutType(newLayout);
    localStorage.setItem('petLayoutPreference', newLayout);
  };



  // Dynamic emoji based on pet composition
  const getContextualEmoji = (): string => {
    if (dogs.length === 0) return '🐾';
    
    const petTypes = dogs.map(pet => pet.petType);
    const uniqueTypes = Array.from(new Set(petTypes));
    
    if (uniqueTypes.length === 1) {
      // All pets are the same type
      const singleType = uniqueTypes[0];
      if (singleType === 'dog') return '🐶';
      if (singleType === 'cat') return '🐱';
      // For other animals, use paws
      return '🐾';
    } else {
      // Mixed pet types
      return '🐾';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl paw-shadow border border-orange-200">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700">
          {getContextualEmoji()} {dogs.length === 1 ? "Which pet needs care?" : "Which pets need care?"}
        </label>
        
        {/* Layout Toggle - only show if more than 3 pets */}
        {dogs.length > 3 && (
          <div className="flex rounded-lg border border-orange-200 overflow-hidden bg-white">
            <button
              onClick={() => handleLayoutChange('grid')}
              className={`
                px-2 py-1.5 transition-all duration-200
                ${layoutType === 'grid' 
                  ? 'pup-pink-gradient text-gray-800 border-r border-orange-300' 
                  : 'bg-white text-gray-600 hover:bg-orange-50 border-r border-orange-200'
                }
              `}
              title="Grid Layout"
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => handleLayoutChange('scroll')}
              className={`
                px-2 py-1.5 transition-all duration-200
                ${layoutType === 'scroll' 
                  ? 'pup-pink-gradient text-gray-800' 
                  : 'bg-white text-gray-600 hover:bg-orange-50'
                }
              `}
              title="Scroll Layout"
            >
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
      
      {/* Grid Layout */}
      {layoutType === 'grid' && (
        <div className={`
          grid gap-3
          ${dogs.length <= 2 ? 'grid-cols-2' : ''}
          ${dogs.length === 3 ? 'grid-cols-3' : ''}
          ${dogs.length >= 4 ? 'grid-cols-2' : ''}
        `}>
          {dogs.map((pet) => (
            <Button
              key={pet.id}
              onClick={() => onDogToggle(pet)}
              variant="outline"
              className={cn(
                "p-3 rounded-lg border-2 transition-all duration-200 text-center flex-col h-auto mobile-touch-button relative",
                selectedDogs.has(pet)
                  ? "border-amber-600 golden-tan-gradient text-gray-800"
                  : "border-amber-200 text-gray-700 golden-tan-gradient"
              )}
            >
              {/* Selected checkmark - positioned inside card to avoid cutoff */}
              {selectedDogs.has(pet) && (
                <div className="absolute top-1 right-1 bg-amber-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}

              <div className="mb-1">
                <PetAvatar 
                  pet={pet} 
                  size="md" 
                  className="mx-auto"
                  isSelected={selectedDogs.has(pet)}
                  backgroundColor={selectedDogs.has(pet) ? "#F5E8D3" : "#F5E8D3"}
                />
              </div>
              <div className="font-medium text-sm">{pet.name}</div>
            </Button>
          ))}
        </div>
      )}

      {/* Scroll Layout */}
      {layoutType === 'scroll' && (
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {dogs.map((pet) => (
            <div
              key={pet.id}
              onClick={() => onDogToggle(pet)}
              className={cn(
                "rounded-lg border-2 transition-all duration-200 cursor-pointer mobile-touch-button flex-shrink-0 flex flex-col items-center justify-center relative",
                selectedDogs.has(pet)
                  ? "border-amber-600 golden-tan-gradient text-gray-800"
                  : "border-amber-200 text-gray-700 golden-tan-gradient"
              )}
              style={{ 
                width: '80px', 
                height: '80px', 
                padding: '8px'
              }}
            >
              {/* Selected checkmark - positioned inside card to avoid cutoff */}
              {selectedDogs.has(pet) && (
                <div className="absolute top-1 right-1 bg-amber-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}

              <PetAvatar 
                pet={pet} 
                size="sm" 
                isSelected={selectedDogs.has(pet)}
                backgroundColor={selectedDogs.has(pet) ? "#F5E8D3" : "#F5E8D3"}
              />
              <div 
                className="font-medium text-center" 
                style={{ 
                  fontSize: '10px', 
                  lineHeight: '12px', 
                  marginTop: '4px',
                  width: '64px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {pet.name}
              </div>
            </div>
          ))}
        </div>
      )}
      <div
        onClick={onSelectBothDogs}
        className={cn(
          "w-full mt-3 p-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer select-none text-center",
          selectedDogs.size === dogs.length
            ? "bg-gray-100 border-gray-300 text-gray-700"
            : "bg-white border-pink-300 text-pink-600"
        )}
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
      >
{selectedDogs.size === dogs.length ? "Deselect All" : dogs.length === 1 ? "Select Pet" : dogs.length === 2 ? "Select Both Pets" : `Select All ${dogs.length} Pets`}
      </div>
    </div>
  );
}
