
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserConfirmationProps {
  fullName?: string;
  nationalNumber?: string;
}

export const UserConfirmation: React.FC<UserConfirmationProps> = ({
  fullName = 'John Doe',
  nationalNumber = 'AB1234567890'
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-4 bg-secondary rounded-md">
      <h3 className="font-medium text-sm mb-2">{t('Confirm Information')}</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="text-muted-foreground">{t('Full Name')}:</div>
        <div>{fullName}</div>
        <div className="text-muted-foreground">{t('National Number')}:</div>
        <div>{nationalNumber}</div>
      </div>
    </div>
  );
};
