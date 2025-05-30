import { useDogCare, DOGS } from "@/hooks/use-dog-care";
import { useAuth } from "@/contexts/auth-context";
import { StatusBanner } from "@/components/status-banner";
import { DogSelector } from "@/components/dog-selector";
import { ActionButtons } from "@/components/action-buttons";
import { ActivityLog } from "@/components/activity-log";
import { Button } from "@/components/ui/button";

export default function DogCareTracker() {
  const { user, logout } = useAuth();
  const {
    selectedDogs,
    activities,
    canTakeAction,
    handleDogToggle,
    handleSelectBothDogs,
    handleAction,
    handleQuickAction,
    getStatusToday,
    handleClearData,
  } = useDogCare(user?.username || "");

  const { bothFed, bothLetOut, allComplete } = getStatusToday();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="warm-gradient text-white p-4 text-center">
        <h1 className="text-2xl font-bold">🐕 Dog Care Tracker</h1>
        <p className="text-orange-100 text-sm mt-1">Keep Natty & Murphy happy!</p>
      </header>

      {/* User Info Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-700">
          Welcome back, <span className="font-medium text-gray-900">{user?.username}</span>!
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Status Banner */}
      <StatusBanner 
        bothFed={bothFed} 
        bothLetOut={bothLetOut} 
        allComplete={allComplete} 
      />

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Dog Selection */}
        <DogSelector
          selectedDogs={selectedDogs}
          onDogToggle={handleDogToggle}
          onSelectBothDogs={handleSelectBothDogs}
          dogs={DOGS}
        />

        {/* Action Buttons */}
        <ActionButtons
          canTakeAction={canTakeAction}
          onAction={handleAction}
          onQuickAction={handleQuickAction}
          selectedDogs={selectedDogs}
        />

        {/* Activity Log */}
        <ActivityLog activities={activities} />
      </div>

      {/* Footer Spacing */}
      <div className="h-8"></div>
    </div>
  );
}
