import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Share2, Users, Home, LogOut, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "@/components/ui/back-button";
import { getDisplayName } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { Household, SafeUser } from "@shared/schema";

interface HouseholdData {
  household: Household & { creatorUsername?: string };
}

interface MembersData {
  members: SafeUser[];
}

interface CreateHouseholdFormProps {
  userId: number;
}

function JoinHouseholdForm({ userId }: CreateHouseholdFormProps) {
  const [inviteCode, setInviteCode] = useState("");
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  // Auto-fill invite code from URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlInviteCode = urlParams.get('invite');
    if (urlInviteCode) {
      setInviteCode(urlInviteCode);
    }
  }, []);

  const joinHouseholdMutation = useMutation({
    mutationFn: async ({ inviteCode, userId }: { inviteCode: string; userId: number }) => {
      return await apiRequest("POST", "/api/households/join", { inviteCode, userId });
    },
    onSuccess: async () => {
      toast({
        title: "Joined household",
        description: "You have successfully joined the household.",
      });
      
      // Refresh user data in auth context
      await refreshUser();
      
      // Invalidate all user-related queries
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/households`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message === "Invalid invite code" ? "Invalid invite code. Please check and try again." : "Failed to join household. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      joinHouseholdMutation.mutate({ inviteCode: inviteCode.trim(), userId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-2">
        <Label htmlFor="inviteCode">Invite Code</Label>
        <Input
          id="inviteCode"
          type="text"
          placeholder="Enter invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full text-center"
        disabled={joinHouseholdMutation.isPending || !inviteCode.trim()}
      >
        {joinHouseholdMutation.isPending ? "Joining..." : "Join Household"}
      </Button>
    </form>
  );
}

function CreateHouseholdForm({ userId }: CreateHouseholdFormProps) {
  const [householdName, setHouseholdName] = useState("");
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const createHouseholdMutation = useMutation({
    mutationFn: async ({ name, userId }: { name: string; userId: number }) => {
      return await apiRequest("POST", "/api/households/create", { name, userId });
    },
    onSuccess: async () => {
      toast({
        title: "Household created",
        description: "Your new household has been created successfully.",
      });
      
      // Refresh user data in auth context
      await refreshUser();
      
      // Invalidate all user-related queries
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/households`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create household. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (householdName.trim()) {
      createHouseholdMutation.mutate({ name: householdName.trim(), userId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-2">
        <Label htmlFor="householdName">Household Name</Label>
        <Input
          id="householdName"
          type="text"
          placeholder="Enter household name"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full text-center"
        disabled={createHouseholdMutation.isPending || !householdName.trim()}
      >
        {createHouseholdMutation.isPending ? "Creating..." : "Create Household"}
      </Button>
    </form>
  );
}

export default function HouseholdManagement() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [, setLocation] = useLocation();



  const removeMemberMutation = useMutation({
    mutationFn: async ({ householdId, userIdToRemove, requesterId }: { householdId: number; userIdToRemove: number; requesterId: number }) => {
      return await apiRequest("POST", "/api/households/remove-member", { householdId, userIdToRemove, requesterId });
    },
    onSuccess: async () => {
      toast({
        title: "Member removed",
        description: "The member has been successfully removed from the household.",
      });
      
      // Invalidate household members query to refresh the list
      await queryClient.invalidateQueries({ queryKey: [`/api/households/${user?.householdId}/members`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message === "Only the household creator can remove members" ? "Only the household creator can remove members." : "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check for invite code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteCode = urlParams.get('invite');
    if (inviteCode && !user?.householdId) {
      setActiveTab("join");
      // Auto-fill the invite code if found in URL
      const inviteInput = document.getElementById('inviteCode') as HTMLInputElement;
      if (inviteInput) {
        inviteInput.value = inviteCode;
      }
    }
  }, [user?.householdId]);

  const leaveHouseholdMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("POST", "/api/households/leave", { userId });
    },
    onSuccess: async () => {
      toast({
        title: "Left household",
        description: "You have successfully left the household.",
      });
      
      // Refresh user data in auth context
      await refreshUser();
      
      // Invalidate all user-related queries
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/households`] });
      
      // Redirect to main page after leaving household
      setLocation('/');
    },
    onError: (error) => {
      // Household leave failed, error handled by UI toast
      toast({
        title: "Error",
        description: `Failed to leave household: ${error?.message || 'Please try again.'}`,
        variant: "destructive",
      });
    },
  });

  const handleLeaveHousehold = () => {
    if (user) {
      leaveHouseholdMutation.mutate(user.id);
    }
  };

  const { data: householdData, isLoading: householdLoading } = useQuery<HouseholdData>({
    queryKey: [`/api/households/${user?.householdId}`],
    enabled: !!user?.householdId,
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<MembersData>({
    queryKey: [`/api/households/${user?.householdId}/members`],
    enabled: !!user?.householdId,
  });

  const copyInviteCode = async () => {
    if (householdData?.household?.inviteCode) {
      await navigator.clipboard.writeText(householdData.household.inviteCode);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
    }
  };

  const shareInviteLink = async () => {
    if (householdData?.household?.inviteCode) {
      const inviteUrl = `${window.location.origin}?invite=${householdData.household.inviteCode}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Join ${householdData.household.name} on TailTrack`,
            text: `Join our household to help track our pets together!`,
            url: inviteUrl,
          });
        } catch (error) {
          // Fallback to clipboard if sharing fails
          await navigator.clipboard.writeText(inviteUrl);
          toast({
            title: "Copied!",
            description: "Invite link copied to clipboard",
          });
        }
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        toast({
          title: "Copied!",
          description: "Invite link copied to clipboard",
        });
      }
    }
  };

  if (!user?.householdId) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <BackButton href="/" className="mb-4" />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Join or Create Household
            </CardTitle>
            <CardDescription>
              You're not part of a household yet. Join an existing one with an invite code or create a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "create" | "join")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="join">Join Household</TabsTrigger>
                  <TabsTrigger value="create">Create Household</TabsTrigger>
                </TabsList>
                <TabsContent value="join" className="mt-6">
                  <JoinHouseholdForm userId={user.id} />
                </TabsContent>
                <TabsContent value="create" className="mt-6">
                  <CreateHouseholdForm userId={user.id} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (householdLoading || membersLoading) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const household = householdData?.household;
  const members = membersData?.members || [];



  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        {/* Back button only for users with household access */}
        {user?.householdId && <BackButton className="mb-4" />}
        
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Household Management</h1>
        </div>
      </div>

      {/* Household Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{household?.name}</span>
            <Badge variant="secondary">{members.length} member{members.length !== 1 ? 's' : ''}</Badge>
          </CardTitle>
          <CardDescription>
            Created on {household?.createdAt ? new Date(household.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Invite Code</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-100 rounded-md font-mono text-sm">
                {household?.inviteCode}
              </code>
              <Button variant="outline" size="sm" onClick={copyInviteCode}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button onClick={shareInviteLink} className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Share Invite Link
          </Button>
        </CardContent>
      </Card>

      {/* Household Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Household Members
          </CardTitle>
          <CardDescription>
            People who can track and care for your pets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member, index) => (
              <div key={member.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{getDisplayName(member)}</p>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.id === user.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                    {household?.creatorId === user?.id && member.id !== user.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            disabled={removeMemberMutation.isPending}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-sm rounded-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {getDisplayName(member)} from this household? They will no longer be able to track pets.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                if (user?.householdId) {
                                  removeMemberMutation.mutate({ 
                                    householdId: user.householdId, 
                                    userIdToRemove: member.id, 
                                    requesterId: user.id 
                                  });
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Remove Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
                {index < members.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leave Household */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <LogOut className="h-5 w-5" />
            Leave Household
          </CardTitle>
          <CardDescription>
            Remove yourself from this household. You'll need to join or create another household to continue tracking pets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                disabled={leaveHouseholdMutation.isPending}
              >
                {leaveHouseholdMutation.isPending ? "Leaving..." : "Leave Household"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm rounded-lg">
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Household</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave this household? You won't be able to track pets until you join or create another household.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveHousehold} className="bg-red-600 hover:bg-red-700 text-white">
                  Leave Household
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Invite Household Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Option 1:</strong> Share the invite code above with other household members</p>
            <p><strong>Option 2:</strong> Send them the invite link using the share button</p>
            <p><strong>Option 3:</strong> Have them enter the invite code when creating a new account</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> New users can join your household by entering your invite code during registration. All household members can track and see pet care activities together.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}