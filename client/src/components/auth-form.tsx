import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginUserSchema, registerUserSchema, forgotPasswordSchema, type LoginUser, type RegisterUser, type ForgotPassword } from "@shared/schema";

import { useToast } from "@/hooks/use-toast";

interface AuthFormProps {
  onAuthSuccess: (user: any) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [householdChoice, setHouseholdChoice] = useState<'create' | 'join'>('create');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [activeTab, setActiveTab] = useState("login");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { toast } = useToast();

  // Check for invite code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const invite = urlParams.get('invite');
    if (invite) {
      setInviteCode(invite);
      setHouseholdChoice('join'); // Automatically switch to join mode
      setActiveTab("register"); // Switch to registration tab for invite links
    }
  }, []);

  // Update theme color for login screen
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#FEF7E7'); // Cream color to match login background
    }

    // Cleanup: restore original theme color when component unmounts
    return () => {
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#FFD5DC'); // Pink color for main app
      }
    };
  }, []);

  const loginForm = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });



  const handleForgotPassword = async (data: ForgotPassword) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to send reset email");
      }
      
      setEmailSent(true);
      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions",
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Failed to send reset email",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (data: LoginUser) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Login failed");
      }
      
      toast({
        title: `Welcome back, ${result.user.username}!`,
        duration: 2000,
      });
      
      onAuthSuccess(result.user);
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterUser) => {
    setIsLoading(true);
    try {
      // Include household choice and invite code in registration data
      const finalInviteCode = inviteCode || (householdChoice === 'join' ? joinInviteCode : undefined);
      const registrationData = {
        ...data,
        householdChoice: finalInviteCode ? 'join' : householdChoice,
        inviteCode: finalInviteCode
      };
      


      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Registration failed");
      }
      
      toast({
        title: `Welcome, ${result.user.username}!`,
        duration: 2000,
      });
      
      onAuthSuccess(result.user);
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show forgot password form if activated
  if (showForgotPassword) {
    if (emailSent) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4" style={{ 
          minHeight: '100dvh'
        }}>
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Check Your Email</CardTitle>
              <CardDescription className="text-gray-600">
                We've sent password reset instructions to your email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">
                  <p>Didn't receive the email? Check your spam folder or try again.</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowForgotPassword(false);
                      setEmailSent(false);
                    }}
                    className="flex-1"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4" style={{ 
        minHeight: '100dvh'
      }}>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg shadow-md border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#FFC0CB' }}>
                <img src="/icon-192.png" alt="TailTrack" className="w-10 h-10 rounded-md" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">Forgot Password</CardTitle>
            </div>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4" style={{ 
      minHeight: '100dvh'
    }}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg shadow-md border-2 border-white flex items-center justify-center" style={{ backgroundColor: '#FFC0CB' }}>
              <img src="/icon-192.png" alt="TailTrack" className="w-10 h-10 rounded-md" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">TailTrack</CardTitle>
          </div>
          <CardDescription>
            Caring for your pet, made simple.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </Form>
              

            </TabsContent>
            
            <TabsContent value="register">
              {inviteCode && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    You're joining an existing household! Complete registration to join.
                  </p>
                </div>
              )}
              
              {!inviteCode && (
                <div className="mb-4">
                  <Label className="text-sm font-medium text-gray-700">Household Setup</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="create"
                        name="householdChoice"
                        value="create"
                        checked={householdChoice === 'create'}
                        onChange={(e) => setHouseholdChoice(e.target.value as 'create' | 'join')}
                        className="w-4 h-4 text-pink-600"
                      />
                      <label htmlFor="create" className="text-sm text-gray-700">
                        Create a new household for my pets
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="join"
                        name="householdChoice"
                        value="join"
                        checked={householdChoice === 'join'}
                        onChange={(e) => setHouseholdChoice(e.target.value as 'create' | 'join')}
                        className="w-4 h-4 text-pink-600"
                      />
                      <label htmlFor="join" className="text-sm text-gray-700">
                        Join an existing household
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="At least 6 characters"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {!inviteCode && householdChoice === 'join' && (
                    <div>
                      <Label htmlFor="joinInviteCode" className="text-sm font-medium text-gray-700">
                        Household Invite Code
                      </Label>
                      <Input
                        id="joinInviteCode"
                        type="text"
                        placeholder="Enter 6-character invite code"
                        value={joinInviteCode}
                        onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                        className="mt-1"
                        maxLength={6}
                      />
                      {joinInviteCode.length > 0 && joinInviteCode.length < 6 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Invite codes are 6 characters long
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading || (!inviteCode && householdChoice === 'join' && joinInviteCode.length !== 6)}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}