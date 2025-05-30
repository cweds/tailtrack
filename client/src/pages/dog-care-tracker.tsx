import { useState, useEffect } from "react";
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
    isLoading,
    handleDogToggle,
    handleSelectBothDogs,
    handleAction,
    handleQuickAction,
    getStatusToday,
  } = useDogCare(user?.username || "");

  const [statusToday, setStatusToday] = useState({ 
    bothFed: false, 
    bothLetOut: false, 
    allComplete: false,
    nattyFed: false,
    nattyLetOut: false,
    murphyFed: false,
    murphyLetOut: false
  });

  useEffect(() => {
    const loadStatus = async () => {
      const status = await getStatusToday();
      setStatusToday(status);
    };
    
    if (user?.id) {
      loadStatus();
    }
  }, [user?.id, activities]); // Reload when activities change

  return (
    <div className="app-container">
      {/* Header */}
      <header className="pup-pink-gradient p-4 text-center select-none">
        <h1 className="text-2xl font-bold text-gray-800 select-none">🐾 TailTrack 🐾</h1>
        <p className="text-gray-700 text-sm mt-1 select-none">Caring for your pet, made simple.</p>
      </header>

      {/* User Info Bar */}
      <div className="golden-tan-gradient border-b border-amber-200 px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-800">
          Welcome back, <span className="font-medium text-gray-900">{user?.username}</span>! 🦴
        </span>
        <button
          onClick={logout}
          className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors playful-bounce"
        >
          Sign Out
        </button>
      </div>

      {/* Status Banner */}
      <StatusBanner 
        bothFed={statusToday.bothFed} 
        bothLetOut={statusToday.bothLetOut} 
        allComplete={statusToday.allComplete}
        nattyFed={statusToday.nattyFed}
        nattyLetOut={statusToday.nattyLetOut}
        murphyFed={statusToday.murphyFed}
        murphyLetOut={statusToday.murphyLetOut}
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
