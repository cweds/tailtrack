import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormLabel } from "@/components/ui/form";
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Plus, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/queryClient";

const petTypes = [
  { value: "dog", label: "🐶    Dog", emoji: "🐶" },
  { value: "cat", label: "🐱    Cat", emoji: "🐱" },
  { value: "bird", label: "🐦    Bird", emoji: "🐦" },
  { value: "fish", label: "🐠    Fish", emoji: "🐠" },
  { value: "rabbit", label: "🐰    Rabbit", emoji: "🐰" },
  { value: "hamster", label: "🐹    Hamster", emoji: "🐹" },
  { value: "other", label: "🐾    Other", emoji: "🐾" }
];

const addPetSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(50, "Name must be less than 50 characters"),
  type: z.string().min(1, "Pet type is required")
});

interface AddPetContextType {
  openAddPetDialog: () => void;
  closeAddPetDialog: () => void;
}

const AddPetContext = createContext<AddPetContextType | null>(null);

export function useAddPet() {
  const context = useContext(AddPetContext);
  if (!context) {
    throw new Error('useAddPet must be used within an AddPetProvider');
  }
  return context;
}

interface AddPetProviderProps {
  children: ReactNode;
}

export function AddPetProvider({ children }: AddPetProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const form = useForm<z.infer<typeof addPetSchema>>({
    resolver: zodResolver(addPetSchema),
    defaultValues: {
      name: "",
      type: ""
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

  const addPetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addPetSchema> & { photoUrl?: string }) => {
      const response = await apiRequest('POST', '/api/pets', {
        name: data.name,
        petType: data.type,
        householdId: user?.householdId,
        photoUrl: data.photoUrl
      });
      return response.json();
    },
    onMutate: async (newPet) => {
      await queryClient.cancelQueries({ queryKey: ['/api/pets/household', user?.householdId] });
      
      const previousPets = queryClient.getQueryData(['/api/pets/household', user?.householdId]);
      
      const optimisticPet = {
        id: Date.now(),
        name: newPet.name,
        type: newPet.type,
        photoUrl: newPet.photoUrl || null,
        householdId: user?.householdId || 0,
        createdAt: new Date()
      };
      
      queryClient.setQueryData(['/api/pets/household', user?.householdId], (old: any) => {
        if (old?.pets) {
          return {
            ...old,
            pets: [...old.pets, optimisticPet]
          };
        }
        return { pets: [optimisticPet] };
      });
      
      return { previousPets };
    },
    onError: (err, newPet, context) => {
      queryClient.setQueryData(['/api/pets/household', user?.householdId], context?.previousPets);
      toast({
        title: "Error",
        description: "Failed to add pet. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/pets/household', user?.householdId], (old: any) => {
        if (old?.pets) {
          return {
            ...old,
            pets: old.pets.map((pet: any) => 
              pet.id === data.pet.id || pet.id === Date.now() ? data.pet : pet
            )
          };
        }
        return { pets: [data.pet] };
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/pets/household'] });
      
      toast({
        title: "Success",
        description: `${data.pet.name} has been added to your household!`,
      });
      
      form.reset();
      setSelectedFile(null);
      setPreviewUrl("");
      setIsOpen(false);
    }
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const compressed = await compressAndConvertImage(file);
      setPreviewUrl(compressed);
    }
  };

  const onSubmit = async (data: z.infer<typeof addPetSchema>) => {
    let photoUrl = undefined;
    if (selectedFile) {
      photoUrl = await compressAndConvertImage(selectedFile);
    }
    
    addPetMutation.mutate({ ...data, photoUrl });
  };

  const openAddPetDialog = () => setIsOpen(true);
  const closeAddPetDialog = () => {
    setIsOpen(false);
    form.reset();
    setSelectedFile(null);
    setPreviewUrl("");
  };

  return (
    <AddPetContext.Provider value={{ openAddPetDialog, closeAddPetDialog }}>
      {children}
      
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeAddPetDialog()}>
        <DialogContent className="max-w-sm border-2 border-gray-200 shadow-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add New Pet</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add a new pet to your household.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormFieldWrapper
                control={form.control}
                name="name"
                label="Pet Name"
                type="text"
                placeholder="Enter pet name"
              />
              <FormFieldWrapper
                control={form.control}
                name="type"
                label="Pet Type"
                type="select"
                placeholder="Select pet type"
                options={petTypes}
              />
              
              {/* Photo Upload Section */}
              <div>
                <FormLabel>Pet Photo (Optional)</FormLabel>
                <div className="mt-2">
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img 
                        src={previewUrl} 
                        alt="Pet preview" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 mx-auto"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl("");
                          }}
                          className="flex-1"
                        >
                          Remove
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('pet-photo-upload')?.click()}
                          className="flex-1"
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 cursor-pointer transition-colors"
                      onClick={() => document.getElementById('pet-photo-upload')?.click()}
                    >
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to add photo</p>
                    </div>
                  )}
                  <input
                    id="pet-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={closeAddPetDialog}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={addPetMutation.isPending}
                  className="flex-1"
                >
                  {addPetMutation.isPending ? 'Adding...' : 'Add Pet'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AddPetContext.Provider>
  );
}