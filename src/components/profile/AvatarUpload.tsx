
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from "@/components/ui/use-toast";

interface AvatarUploadProps {
  initialImage?: string | null;
  onImageChange: (newImage: string | null) => void;
  fullName?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  initialImage, 
  onImageChange,
  fullName = ''
}) => {
  const { t } = useLanguage();
  const [previewImage, setPreviewImage] = useState<string | null>(initialImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('error'),
        description: t('imageTooLarge') || 'Image too large. Maximum size is 5MB.',
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewImage(result);
      onImageChange(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      toast({
        title: t('error'),
        description: t('errorReadingImage') || 'Error reading image.',
        variant: "destructive"
      });
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // Get initials from full name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col items-center">
      <Avatar className="h-24 w-24 relative">
        {previewImage ? (
          <AvatarImage src={previewImage} alt={fullName} className="object-cover" />
        ) : null}
        <AvatarFallback className="text-xl bg-primary/10 text-primary">
          {getInitials(fullName)}
        </AvatarFallback>
        
        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-full">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}
      </Avatar>
      
      <div className="mt-4 text-center">
        <Label 
          htmlFor="profile-picture" 
          className="cursor-pointer inline-flex items-center text-sm text-primary hover:text-primary/80"
        >
          <Camera className="h-4 w-4 mr-2" />
          {previewImage ? t('changePhoto') : t('addPhoto')}
        </Label>
        <Input 
          id="profile-picture" 
          type="file" 
          accept="image/*" 
          className="sr-only" 
          onChange={handleFileChange}
          disabled={isUploading}
        />
        
        {previewImage && (
          <Button 
            variant="ghost" 
            size="sm"
            className="text-destructive hover:text-destructive/80 text-xs mt-1"
            onClick={() => {
              setPreviewImage(null);
              onImageChange(null);
            }}
          >
            {t('removePhoto')}
          </Button>
        )}
      </div>
    </div>
  );
};
