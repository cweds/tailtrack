import { useState, useEffect, useRef } from "react";
import { usePetCare } from "@/hooks/use-pet-care";
import { useAuth } from "@/contexts/auth-context";
import { StatusBanner } from "@/components/status-banner";
import { DogSelector } from "@/components/dog-selector";
import { ActionButtons } from "@/components/action-buttons";
import { ActivityLog } from "@/components/activity-log";
import { getDisplayName } from "@/lib/utils";
import { Settings, ChevronDown, LogOut, Wrench, Users } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    pets,
    selectedPets,
    petStatus,
    activities,
    hasPreviousActivities,
    canTakeAction,
    isLoading,
    handlePetToggle,
    handleSelectAllPets,
    handleAction,
    handleQuickAction,
    refresh,
  } = usePetCare(user?.username || "", user?.id || 0, user?.householdId || null);

  // Pull-to-refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Settings dropdown state
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate status instantly using activities data
  const statusToday = (() => {
    if (!user?.id || pets.length === 0) return {
      allFed: false, 
      allLetOut: false, 
      allComplete: false,
      petStatuses: {}
    };

    const allFed = pets.every((pet: any) => petStatus[pet.id]?.fed);
    const allLetOut = pets.every((pet: any) => petStatus[pet.id]?.letOut);
    const allComplete = allFed && allLetOut;

    return {
      allFed,
      allLetOut,
      allComplete,
      petStatuses: petStatus
    };
  })();

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0) {
      e.preventDefault();
      setPullDistance(Math.min(diff * 0.5, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    
    isDragging.current = false;

    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60);
      
      try {
        await refresh();
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        // Refresh failed, handled silently
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div 
      className="app-container"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center text-gray-800 text-sm font-medium"
          style={{ 
            height: `${pullDistance}px`,
            transform: `translateY(-${pullDistance}px)`,
            background: '#FFD5DC',
            zIndex: 50
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Refreshing...</span>
            </div>
          ) : pullDistance > 60 ? (
            <span>Release to refresh</span>
          ) : (
            <span>Pull to refresh</span>
          )}
        </div>
      )}

      {/* Header */}
      <header 
        className="header-static p-4 text-center"
        style={{ 
          background: '#FFD5DC',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-lg shadow-md border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#FFC0CB' }}>
            <img src="/icon-192.png" alt="TailTrack" className="w-10 h-10 rounded-md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">TailTrack</h1>
        </div>
        <p className="text-gray-700 text-sm mt-1">Caring for your pet, made simple.</p>
      </header>

      {/* User Info Bar */}
      <div className="golden-tan-gradient border-b border-orange-200 px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-800">
          {(() => {
            if (!user) return "Welcome! 🦴";
            
            // Check if user was created recently (within last 5 minutes) to determine if they're new
            const userCreated = new Date(user.createdAt);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            const isNewUser = userCreated > fiveMinutesAgo;
            
            const displayName = getDisplayName(user);
            
            return isNewUser 
              ? `Welcome, ${displayName}! 🦴`
              : `Welcome back, ${displayName}! 🦴`;
          })()}
        </span>
        
        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors playful-bounce"
          >
            <Settings className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>
          
          {showSettingsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <Link href="/pets">
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  onClick={() => setShowSettingsDropdown(false)}
                >
                  <Wrench className="w-4 h-4" />
                  Manage Pets
                </button>
              </Link>
              <Link href="/household">
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  onClick={() => setShowSettingsDropdown(false)}
                >
                  <Users className="w-4 h-4" />
                  Household
                </button>
              </Link>
              <button
                onClick={() => {
                  setShowSettingsDropdown(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isLoading ? (
        <div className="mx-4 mt-4 p-4 rounded-xl text-center font-medium paw-shadow" 
             style={{
               backgroundColor: '#e5e7eb',
               borderWidth: '2px',
               borderStyle: 'solid',
               borderColor: '#6b7280'
             }}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-gray-400 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-400 rounded w-64 animate-pulse"></div>
          </div>
        </div>
      ) : (
        <StatusBanner 
          allFed={statusToday.allFed} 
          allLetOut={statusToday.allLetOut} 
          allComplete={statusToday.allComplete}
          pets={pets}
          petStatuses={statusToday.petStatuses}
        />
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* Pet Selection */}
        <DogSelector
          selectedDogs={selectedPets}
          onDogToggle={handlePetToggle}
          onSelectBothDogs={handleSelectAllPets}
          dogs={pets}
          isLoading={isLoading}
          hasHousehold={!!user?.householdId}
        />

        {/* Action Buttons - only show if there are pets */}
        {pets.length > 0 && (
          <ActionButtons
            canTakeAction={canTakeAction}
            onAction={handleAction}
            onQuickAction={handleQuickAction}
            selectedPets={selectedPets}
            activities={activities}
          />
        )}

        {/* Activity Log - only show if there are pets */}
        {pets.length > 0 && <ActivityLog activities={activities} pets={pets} hasPreviousActivities={hasPreviousActivities} />}
      </div>

      {/* Footer Spacing */}
      <div className="h-8"></div>
    </div>
  );
}