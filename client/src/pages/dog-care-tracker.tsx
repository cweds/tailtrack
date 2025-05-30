import { useDogCare, DOGS } from "@/hooks/use-dog-care";
import { useAuth } from "@/contexts/auth-context";
import { StatusBanner } from "@/components/status-banner";
import { DogSelector } from "@/components/dog-selector";
import { ActionButtons } from "@/components/action-buttons";
import { ActivityLog } from "@/components/activity-log";
import { Button } from "@/components/ui/button";
import { DogCareStorage } from "@/lib/dog-care-storage";

export default function DogCareTracker() {
  const {
    selectedUser,
    selectedDogs,
    activities,
    canTakeAction,
    handleUserSelect,
    handleDogToggle,
    handleSelectBothDogs,
    handleAction,
    handleQuickAction,
    getStatusToday,
    handleClearData,
  } = useDogCare();

  const { bothFed, bothLetOut, allComplete } = getStatusToday();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="warm-gradient text-white p-4 text-center relative">
        <h1 className="text-2xl font-bold">🐕 Dog Care Tracker</h1>
        <p className="text-orange-100 text-sm mt-1">Keep Natty & Murphy happy!</p>
        <button
          onClick={handleClearData}
          className="absolute top-4 right-4 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white transition-colors"
        >
          Clear Data
        </button>
      </header>

      {/* Status Banner */}
      <StatusBanner 
        bothFed={bothFed} 
        bothLetOut={bothLetOut} 
        allComplete={allComplete} 
      />

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* User Selection */}
        <UserSelector
          selectedUser={selectedUser}
          onUserSelect={handleUserSelect}
          users={USERS}
        />

        {/* Dog Selection */}
        <DogSelector
          selectedDogs={selectedDogs}
          onDogToggle={handleDogToggle}
          onSelectBothDogs={handleSelectBothDogs}
          dogs={DOGS}
          selectedUser={selectedUser}
        />

        {/* Action Buttons */}
        <ActionButtons
          canTakeAction={canTakeAction}
          onAction={handleAction}
          onQuickAction={handleQuickAction}
          selectedUser={selectedUser}
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
