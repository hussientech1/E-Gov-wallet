
import React from 'react';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserInfoDisplayProps {
  userProfile: {
    full_name: string;
    national_number: string;
    birth_date: string | null;
    gender: string | null;
    address: string | null;
  };
}

const UserInfoDisplay: React.FC<UserInfoDisplayProps> = ({ userProfile }) => {
  const { t } = useLanguage();

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-lg font-medium">{t('userInformation')}</h2>
      
      <div className="grid gap-4">
        <div>
          <Label className="text-muted-foreground">{t('fullName')}</Label>
          <div className="p-2 border rounded-md bg-muted/40">{userProfile.full_name}</div>
        </div>
        
        <div>
          <Label className="text-muted-foreground">{t('nationalNumber')}</Label>
          <div className="p-2 border rounded-md bg-muted/40">{userProfile.national_number}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground">{t('dateOfBirth')}</Label>
            <div className="p-2 border rounded-md bg-muted/40">{formatDate(userProfile.birth_date)}</div>
          </div>
          
          <div>
            <Label className="text-muted-foreground">{t('gender')}</Label>
            <div className="p-2 border rounded-md bg-muted/40">{userProfile.gender || t('notSpecified')}</div>
          </div>
        </div>
        
        <div>
          <Label className="text-muted-foreground">{t('address')}</Label>
          <div className="p-2 border rounded-md bg-muted/40">{userProfile.address || t('notSpecified')}</div>
        </div>
      </div>
    </div>
  );
};

export default UserInfoDisplay;
