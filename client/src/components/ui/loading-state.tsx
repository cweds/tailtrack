import { BackButton } from "./back-button";

interface LoadingStateProps {
  message?: string;
  showBackButton?: boolean;
  backHref?: string;
}

export function LoadingState({ 
  message = "Loading...", 
  showBackButton = false, 
  backHref = "/" 
}: LoadingStateProps) {
  return (
    <div className="container mx-auto p-4">
      {showBackButton && (
        <div className="mb-6">
          <BackButton href={backHref} />
        </div>
      )}
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-pulse text-gray-600">{message}</div>
        </div>
      </div>
    </div>
  );
}