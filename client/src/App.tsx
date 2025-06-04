import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AddPetProvider } from "@/contexts/add-pet-context";
import { AuthForm } from "@/components/auth-form";
import Dashboard from "@/pages/dashboard";
import PetsManagement from "@/pages/pets-management";
import HouseholdManagement from "@/pages/household-management";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";
import { useHouseholdProtection } from "@/hooks/use-household-protection";
import { useThemeColor } from "@/hooks/use-theme-color";

function Router() {
  useHouseholdProtection();
  useThemeColor();
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pets" component={PetsManagement} />
      <Route path="/household" component={HouseholdManagement} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  const { login } = useAuth();
  
  return (
    <Switch>
      <Route path="/reset-password" component={ResetPassword} />
      <Route component={() => <AuthForm onAuthSuccess={login} />} />
    </Switch>
  );
}

function AppContent() {
  const { user, login, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <PublicRouter />;
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AddPetProvider>
          <AppContent />
          <Toaster />
        </AddPetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
