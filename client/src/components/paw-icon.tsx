interface PawIconProps {
  className?: string;
  size?: number;
}

export function PawIcon({ className = "", size = 16 }: PawIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
    >
      {/* Main paw pad - larger oval at bottom */}
      <ellipse cx="50" cy="70" rx="18" ry="15" />
      
      {/* Top left toe */}
      <ellipse cx="35" cy="35" rx="7" ry="10" transform="rotate(-15 35 35)" />
      
      {/* Top middle toe */}
      <ellipse cx="50" cy="25" rx="7" ry="12" />
      
      {/* Top right toe */}
      <ellipse cx="65" cy="35" rx="7" ry="10" transform="rotate(15 65 35)" />
      
      {/* Left side toe */}
      <ellipse cx="25" cy="50" rx="6" ry="9" transform="rotate(-30 25 50)" />
    </svg>
  );
}