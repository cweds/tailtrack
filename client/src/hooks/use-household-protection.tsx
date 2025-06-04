import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

// Pages that require household membership
const HOUSEHOLD_PROTECTED_ROUTES = [
  '/pets'
];

export function useHouseholdProtection() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If user doesn't have a household and is on a protected route
    if (user && !user.householdId && HOUSEHOLD_PROTECTED_ROUTES.includes(location)) {
      setLocation('/');
    }
  }, [user, location, setLocation]);
}