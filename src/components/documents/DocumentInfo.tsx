
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from './DocumentCard';

interface DocumentInfoProps {
  docNumber: string;
  issueDate: string;
  expiryDate: string | null;
  issueAuthority: string;
  docType: string;
  passportType?: string;
}

export const DocumentInfo: React.FC<DocumentInfoProps> = ({ 
  docNumber, 
  issueDate, 
  expiryDate, 
  issueAuthority,
  docType,
  passportType
}) => {
  const { t } = useLanguage();
  
  return (
    <div>
      <h3 className="font-semibold text-lg mb-3">{t('documentInformation')}</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div>
            <p className="text-muted-foreground">{t('documentNumber')}</p>
            <p className="font-medium">{docNumber}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground">{t('issueDate')}</p>
            <p className="font-medium">{formatDate(issueDate)}</p>
          </div>
          
          {docType === 'passport' && passportType && (
            <div>
              <p className="text-muted-foreground">{t('passportType')}</p>
              <p className="font-medium">{passportType}</p>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div>
            <p className="text-muted-foreground">{t('expiryDate')}</p>
            <p className="font-medium">{formatDate(expiryDate)}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground">{t('issueAuthority')}</p>
            <p className="font-medium">{issueAuthority}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
