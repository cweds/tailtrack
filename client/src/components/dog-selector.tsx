import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dog, User } from "@/hooks/use-dog-care";
import nattyImage from "@assets/image0.png";
import murphyImage from "@assets/image1.png";

interface DogSelectorProps {
  selectedDogs: Set<Dog>;
  onDogToggle: (dog: Dog) => void;
  onSelectBothDogs: () => void;
  dogs: readonly Dog[];
  selectedUser: User | null;
}

export function DogSelector({ selectedDogs, onDogToggle, onSelectBothDogs, dogs, selectedUser }: DogSelectorProps) {
  const dogAvatars: Record<Dog, string> = {
    Natty: nattyImage,
    Murphy: murphyImage,
  };

  const handleDogClick = (dog: Dog) => {
    if (!selectedUser) {
      return; // Do nothing if no user selected
    }
    onDogToggle(dog);
  };

  const handleSelectBothClick = () => {
    if (!selectedUser) {
      return; // Do nothing if no user selected
    }
    onSelectBothDogs();
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        🐶 Which pup(s) need care?
      </label>
      
      {!selectedUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-center">
          <p className="text-sm text-amber-700">
            👆 Please select who is doing the care first
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        {dogs.map((dog) => (
          <Button
            key={dog}
            onClick={() => handleDogClick(dog)}
            variant="outline"
            disabled={!selectedUser}
            className={cn(
              "p-3 rounded-lg border-2 transition-all duration-200 text-center flex-col h-auto",
              !selectedUser
                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                : selectedDogs.has(dog)
                ? "border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                : "border-gray-200 text-gray-700 hover:border-orange-500 hover:bg-orange-50"
            )}
          >
            <div className="mb-1">
              <img 
                src={dogAvatars[dog]} 
                alt={dog}
                className="w-12 h-12 rounded-full object-cover mx-auto"
              />
            </div>
            <div className="font-medium text-sm">{dog}</div>
          </Button>
        ))}
      </div>
      <Button
        onClick={handleSelectBothClick}
        variant="outline"
        disabled={!selectedUser}
        className={cn(
          "w-full mt-3 p-2 text-sm font-medium rounded-lg transition-all duration-200",
          !selectedUser
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : selectedDogs.size === 2
            ? "text-white bg-orange-500 border-orange-500 hover:bg-orange-600"
            : "text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white"
        )}
      >
        {selectedDogs.size === 2 ? "Deselect All" : "Select Both Dogs"}
      </Button>
    </div>
  );
}
