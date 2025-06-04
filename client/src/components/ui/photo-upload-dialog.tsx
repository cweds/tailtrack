import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface PhotoUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onUpload: (photoUrl: string) => void;
  isUploading?: boolean;
}

export function PhotoUploadDialog({ 
  isOpen, 
  onClose, 
  title, 
  description = "Choose a photo from your phone or camera.",
  onUpload,
  isUploading = false
}: PhotoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

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

  const handleUpload = async () => {
    if (selectedFile) {
      const photoUrl = await compressAndConvertImage(selectedFile);
      onUpload(photoUrl);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? 'Updating...' : 'Update Photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}