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
      <path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 7c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm8 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-9 5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm10 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-5 3c2.2 0 4-1.8 4-4v-1c0-.6-.4-1-1-1s-1 .4-1 1v1c0 1.1-.9 2-2 2s-2-.9-2-2v-1c0-.6-.4-1-1-1s-1 .4-1 1v1c0 2.2 1.8 4 4 4z"/>
    </svg>
  );
}