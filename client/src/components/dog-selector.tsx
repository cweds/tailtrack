import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dog } from "@/hooks/use-dog-care";
import nattyImage from "@assets/image0.png";
import murphyImage from "@assets/image1.png";

interface DogSelectorProps {
  selectedDogs: Set<Dog>;
  onDogToggle: (dog: Dog) => void;
  onSelectBothDogs: () => void;
  dogs: readonly Dog[];
}

export function DogSelector({ selectedDogs, onDogToggle, onSelectBothDogs, dogs }: DogSelectorProps) {
  const dogAvatars: Record<Dog, string> = {
    Natty: nattyImage,
    Murphy: murphyImage,
  };

  return (
    <div className="bg-white p-4 rounded-xl paw-shadow border border-pink-200">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        🐶 Which pup(s) need care?
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {dogs.map((dog) => (
          <Button
            key={dog}
            onClick={() => onDogToggle(dog)}
            variant="outline"
            className={cn(
              "p-3 rounded-lg border-2 transition-all duration-200 text-center flex-col h-auto playful-bounce",
              selectedDogs.has(dog)
                ? "border-pink-300 text-gray-800"
                : "border-amber-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50"
            )}
            style={selectedDogs.has(dog) ? {
              background: 'linear-gradient(135deg, #FFD5DC 0%, #FFC0CB 100%)'
            } : {
              background: '#ffffff'
            }}
          >
            <div className="mb-1">
              <img 
                src={dogAvatars[dog]} 
                alt={dog}
                className={cn(
                  "w-12 h-12 rounded-full object-cover mx-auto",
                  selectedDogs.has(dog) ? "border-2 border-white" : ""
                )}
              />
            </div>
            <div className="font-medium text-sm">{dog}</div>
          </Button>
        ))}
      </div>
      <div
        onClick={onSelectBothDogs}
        className="w-full mt-3 p-2 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer select-none text-center playful-bounce hover:scale-105 active:scale-95"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          userSelect: 'none',
          backgroundColor: selectedDogs.size === 2 ? '#fef3c7' : '#ffffff',
          borderColor: selectedDogs.size === 2 ? '#f59e0b' : '#ec4899',
          color: selectedDogs.size === 2 ? '#374151' : '#ec4899',
          backgroundImage: selectedDogs.size === 2 ? 'linear-gradient(to right, #fef3c7, #fed7aa)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (selectedDogs.size === 2) {
            e.currentTarget.style.opacity = '0.9';
          } else {
            e.currentTarget.style.backgroundColor = '#fdf2f8';
            e.currentTarget.style.borderColor = '#f472b6';
          }
        }}
        onMouseLeave={(e) => {
          if (selectedDogs.size === 2) {
            e.currentTarget.style.opacity = '1';
          } else {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#ec4899';
          }
        }}
      >
        {selectedDogs.size === 2 ? "Deselect All" : "Select Both Dogs"}
      </div>
    </div>
  );
}
