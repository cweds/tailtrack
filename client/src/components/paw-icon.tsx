interface PawIconProps {
  className?: string;
  size?: number;
}

export function PawIcon({ className = "", size = 16 }: PawIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Main paw pad */}
      <ellipse cx="12" cy="16" rx="4" ry="3" />
      
      {/* Top left toe pad */}
      <ellipse cx="8" cy="10" rx="1.5" ry="2" />
      
      {/* Top center toe pad */}
      <ellipse cx="12" cy="8" rx="1.5" ry="2.5" />
      
      {/* Top right toe pad */}
      <ellipse cx="16" cy="10" rx="1.5" ry="2" />
      
      {/* Far left toe pad */}
      <ellipse cx="6" cy="12.5" rx="1.2" ry="1.8" />
      
      {/* Far right toe pad */}
      <ellipse cx="18" cy="12.5" rx="1.2" ry="1.8" />
    </svg>
  );
}