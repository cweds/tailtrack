import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pet } from "@shared/schema";

// Map pet types to their corresponding emojis
const PET_TYPE_EMOJIS: Record<string, string> = {
  dog: "🐶",
  cat: "🐱", 
  bird: "🐦",
  fish: "🐠",
  rabbit: "🐰",
  hamster: "🐹",
  "guinea pig": "🐹", // Using hamster emoji for guinea pig
  other: "🐾"
};

interface PetAvatarProps {
  pet: Pet;
  size?: "sm" | "md" | "lg";
  showEditButton?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function PetAvatar({ 
  pet, 
  size = "md", 
  showEditButton = false, 
  onEdit,
  className = ""
}: PetAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16"
  };

  const buttonSizeClasses = {
    sm: "w-4 h-4 -bottom-0.5 -right-0.5",
    md: "w-6 h-6 -bottom-1 -right-1",
    lg: "w-8 h-8 -bottom-1 -right-1"
  };

  const iconSizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  // Get the emoji for this pet type, fallback to generic pet emoji
  const petEmoji = PET_TYPE_EMOJIS[pet.petType?.toLowerCase() || ""] || "🐾";
  const hasCustomPhoto = !!pet.photoUrl;

  return (
    <div 
      className={cn(
        "relative cursor-pointer group",
        className
      )}
      onClick={onEdit}
      title={showEditButton ? "Change photo" : undefined}
    >
      {hasCustomPhoto ? (
        <img 
          src={pet.photoUrl!}
          alt={pet.name}
          className={cn(
            sizeClasses[size],
            "rounded-full object-cover border-2 border-gray-200 transition-opacity",
            showEditButton && "group-hover:opacity-75"
          )}
        />
      ) : (
        <div 
          className={cn(
            sizeClasses[size],
            "rounded-full border-2 border-gray-200 transition-opacity flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100",
            showEditButton && "group-hover:opacity-75"
          )}
          style={{ 
            fontSize: size === "sm" ? "18px" : size === "md" ? "20px" : "28px",
            lineHeight: "1"
          }}
        >
          {petEmoji}
        </div>
      )}
      
      {showEditButton && (
        <>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded-full">
            <Camera className={cn(iconSizeClasses[size], "text-white drop-shadow-lg")} />
          </div>
          <button 
            onClick={onEdit}
            className={cn(
              buttonSizeClasses[size],
              "absolute bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
            )}
            title="Change photo"
          >
            <Camera className={iconSizeClasses[size]} />
          </button>
        </>
      )}
    </div>
  );
}