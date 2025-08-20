
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { AvatarUpload } from './AvatarUpload';
import { Phone, UserPlus, AlertTriangle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface CreateProfileFormProps {
  user: {
    nationalNumber: string;
    fullName: string;
  } | null;
  onProfileCreated: () => void;
}

const CreateProfileForm: React.FC<CreateProfileFormProps> = ({ user, onProfileCreated }) => {
  const { t } = useLanguage();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);

  const handleCreateProfile = async () => {
    if (!user) return;
    
    setCreatingProfile(true);
    
    try {
      // Generate a temporary password hash for the new profile
      const tempPassword = Math.random().toString(36).substring(2, 15);
      
      // Create minimal user profile with required password_hash field
      const { error } = await supabase
        .from('users')
        .insert({
          national_number: user.nationalNumber,
          full_name: user.fullName,
          phone_number: phoneNumber || '',
          profile_picture: profilePicture,
          profile_completed: false,
          password_hash: tempPassword // Adding the required password_hash field
        });
        
      if (error) {
        console.error('Error creating profile:', error);
        toast({
          title: t('Error'),
          description: t('Error Creating Profile'),
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: t('Success'),
        description: t('Profile Created Successfully'),
      });
      
      onProfileCreated();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('Error'),
        description: t('Something Went Wrong'),
        variant: "destructive"
      });
    } finally {
      setCreatingProfile(false);
    }
  };

  return (
    <div className="text-center py-6">
      <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
      <p className="text-lg font-medium">{t('Profile Not Found') || 'Profile Not Found'}</p>
      <p className="text-muted-foreground mt-1 mb-6">
        {t('Profile Not Found Description') || 'You need to create a profile to use the services'}
      </p>
      
      <div className="space-y-6 max-w-sm mx-auto">
        <AvatarUpload
          initialImage={profilePicture}
          onImageChange={setProfilePicture}
          fullName={user?.fullName || ''}
        />
        
        <div>
          <Label htmlFor="New Phone Number">{t('phoneNumber') || 'Phone Number'}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="New Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10"
              placeholder="+1234567890"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleCreateProfile} 
          className="w-full"
          disabled={creatingProfile}
        >
          {creatingProfile ? (
            t('creating') || 'Creating...'
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('createProfile') || 'Create Profile'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateProfileForm;
