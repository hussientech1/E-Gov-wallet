
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from './DocumentCard';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";

interface DocumentPersonalInfoProps {
  personalInfo: {
    fullName: string;
    nationality: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
    address: string;
    profile_picture?: string | null;
  };
}

export const DocumentPersonalInfo: React.FC<DocumentPersonalInfoProps> = ({ personalInfo }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(personalInfo.profile_picture || null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('profile_picture')
          .eq('national_number', user.nationalNumber)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        if (data && data.profile_picture) {
          setProfilePicture(data.profile_picture);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);
  
  // Get initial from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">{t('Personal Information')}</h3>

      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-20 w-20">
          {profilePicture ? (
            <AvatarImage src={profilePicture} alt={personalInfo.fullName} className="object-cover" />
          ) : null}
          <AvatarFallback className="text-xl bg-primary/10 text-primary">
            {getInitials(personalInfo.fullName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-lg">{personalInfo.fullName}</h3>
          <p className="text-sm text-muted-foreground">{personalInfo.nationality}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <p className="text-muted-foreground">{t('Date of Birth')}</p>
            <p className="font-medium">{formatDate(personalInfo.dateOfBirth || null)}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground">{t('Place of Birth')}</p>
            <p className="font-medium">{personalInfo.placeOfBirth}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div>
            <p className="text-muted-foreground">{t('Gender')}</p>
            <p className="font-medium">{personalInfo.gender}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground">{t('Address')}</p>
            <p className="font-medium">{personalInfo.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
