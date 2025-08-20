
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import UserInfoDisplay from '@/components/profile/UserInfoDisplay';
import ProfileForm from '@/components/profile/ProfileForm';
import CreateProfileForm from '@/components/profile/CreateProfileForm';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';

interface UserProfile {
  national_number: string;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  phone_number: string;
  profile_picture?: string | null;
}

const Profile: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('national_number', user.nationalNumber)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
        setProfilePicture(data.profile_picture || null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title={t('profile')} showBack />
        <ProfileSkeleton />
      </AppLayout>
    );
  }

  // Show profile creation option if no profile exists
  if (!userProfile) {
    return (
      <AppLayout>
        <PageHeader title={t('profile')} showBack />
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <CreateProfileForm 
                user={user} 
                onProfileCreated={fetchUserProfile}
              />
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <PageHeader title={t('profile')} showBack />
      
      <div className="p-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="mb-8 flex flex-col items-center">
              <AvatarUpload
                initialImage={profilePicture}
                onImageChange={setProfilePicture}
                fullName={userProfile.full_name}
              />
            </div>
            
            {/* User Information - Read-only */}
            <UserInfoDisplay userProfile={userProfile} />
            
            {/* Editable Fields */}
            <ProfileForm 
              userProfile={userProfile}
              profilePicture={profilePicture}
              setProfilePicture={setProfilePicture}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
