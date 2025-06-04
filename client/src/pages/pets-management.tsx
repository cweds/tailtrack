import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Camera } from "lucide-react";
import { useAddPet } from "@/contexts/add-pet-context";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";
import { BackButton } from "@/components/ui/back-button";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { PetAvatar } from "@/components/ui/pet-avatar";
import type { Pet } from "@/../../shared/schema";

export default function PetsManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { openAddPetDialog } = useAddPet();
  const [selectedPetForPhoto, setSelectedPetForPhoto] = useState<Pet | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const updatePhotoMutation = useMutation({
    mutationFn: async ({ petId, photoUrl }: { petId: number; photoUrl: string }) => {
      const response = await apiRequest('PATCH', `/api/pets/${petId}`, { photoUrl });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets/household', user?.householdId] });
      setSelectedPetForPhoto(null);
      setSelectedFile(null);
      setPreviewUrl("");
      toast({
        title: "Success",
        description: "Pet photo updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pet photo. Please try again.",
        variant: "destructive",
      });
    }
  });

  const compressAndConvertImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const { data: petsResponse, isLoading } = useQuery<{pets: Pet[]}>({
    queryKey: ['/api/pets/household', user?.householdId],
    queryFn: () => fetch(`/api/pets/household/${user?.householdId}`).then(res => res.json()),
    enabled: !!user?.householdId
  });
  
  const pets = petsResponse?.pets || [];

  const deletePetMutation = useMutation({
    mutationFn: async (petId: number) => {
      const response = await apiRequest('DELETE', `/api/pets/${petId}`);
      return response.json();
    },
    onMutate: async (petId) => {
      await queryClient.cancelQueries({ queryKey: ['/api/pets/household', user?.householdId] });
      
      const previousPets = queryClient.getQueryData(['/api/pets/household', user?.householdId]);
      
      queryClient.setQueryData(['/api/pets/household', user?.householdId], (old: any) => {
        if (old?.pets) {
          return {
            ...old,
            pets: old.pets.filter((pet: Pet) => pet.id !== petId)
          };
        }
        return old;
      });
      
      return { previousPets };
    },
    onError: (err, petId, context) => {
      queryClient.setQueryData(['/api/pets/household', user?.householdId], context?.previousPets);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pets/household', user?.householdId] });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Pet removed successfully",
      });
    }
  });

  const getPetPhoto = (pet: Pet) => {
    return pet.photoUrl || undefined;
  };

  if (isLoading) {
    return <LoadingState message="Loading pets..." showBackButton={true} />;
  }

  // If user has no household, show message to join or create one
  if (!user?.householdId) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <BackButton className="mb-4" />
          <h1 className="text-3xl font-bold">Manage Your Pets</h1>
        </div>
        
        <EmptyState
          title="No household found"
          description="You need to join or create a household before you can add pets"
          actionText="Go to Household Management"
          onAction={() => window.location.href = '/household'}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <BackButton className="mb-4" />
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Your Pets</h1>
          
          {pets.length > 0 && (
            <Button onClick={openAddPetDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pet
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.map((pet: Pet) => (
          <Card key={pet.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-3">
                  <PetAvatar 
                    pet={pet}
                    showEditButton={true}
                    onEdit={() => setSelectedPetForPhoto(pet)}
                  />
                  <div>
                    <div className="font-semibold text-lg">{pet.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{pet.petType}</div>
                  </div>
                </CardTitle>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {pet.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently remove {pet.name} from your household.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deletePetMutation.mutate(pet.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        disabled={deletePetMutation.isPending}
                      >
                        {deletePetMutation.isPending ? 'Removing...' : 'Remove'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-gray-500">
                  Added {new Date(pet.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {pets.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              title="No pets yet"
              description="Add your first pet to start tracking their care"
              actionText="Add Your First Pet"
              onAction={openAddPetDialog}
            />
          </div>
        )}
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={!!selectedPetForPhoto} onOpenChange={(open) => !open && setSelectedPetForPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Photo for {selectedPetForPhoto?.name}</DialogTitle>
            <DialogDescription>
              Choose a photo from your phone or camera to set as your pet's profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Choose Photo</label>
              <div className="border-2 border-blue-300 bg-blue-50 rounded-lg p-6 text-center hover:bg-blue-100 hover:border-blue-400 transition-all cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label 
                  htmlFor="photo-upload" 
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Camera className="w-10 h-10 text-blue-500 mb-3" />
                  <span className="text-sm font-semibold text-blue-700">Choose a photo</span>
                  <span className="text-xs text-blue-600 mt-1">Click to select from your device</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select a photo from your device. JPG, PNG, and other image formats are supported.
              </p>
            </div>

            {previewUrl && (
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img 
                  src={previewUrl} 
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-gray-200"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedPetForPhoto(null);
                  setSelectedFile(null);
                  setPreviewUrl("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={async () => {
                  if (selectedFile && selectedPetForPhoto) {
                    const photoUrl = await compressAndConvertImage(selectedFile);
                    updatePhotoMutation.mutate({ 
                      petId: selectedPetForPhoto.id, 
                      photoUrl 
                    });
                  }
                }}
                disabled={!selectedFile || updatePhotoMutation.isPending}
                className="flex-1"
              >
                {updatePhotoMutation.isPending ? 'Updating...' : 'Update Photo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}