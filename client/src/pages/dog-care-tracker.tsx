import { useDogCare, USERS, DOGS } from "@/hooks/use-dog-care";
import { StatusBanner } from "@/components/status-banner";
import { UserSelector } from "@/components/user-selector";
import { DogSelector } from "@/components/dog-selector";
import { ActionButtons } from "@/components/action-buttons";
import { ActivityLog } from "@/components/activity-log";

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
    getStatusToday,
  } = useDogCare();

  const { bothFed, bothLetOut, allComplete } = getStatusToday();

  return (
    <div className="app-container">
      {/* Header */}
      <header className="warm-gradient text-white p-4 text-center">
        <h1 className="text-2xl font-bold">🐕 Dog Care Tracker</h1>
        <p className="text-orange-100 text-sm mt-1">Keep Natty & Murphy happy!</p>
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
        />

        {/* Action Buttons */}
        <ActionButtons
          canTakeAction={canTakeAction}
          onAction={handleAction}
        />

        {/* Activity Log */}
        <ActivityLog activities={activities} />
      </div>

      {/* Footer Spacing */}
      <div className="h-8"></div>
    </div>
  );
}
