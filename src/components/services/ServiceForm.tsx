
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceTypeSelect } from './ServiceTypeSelect';
import { ExecutionTypeToggle } from './ExecutionTypeToggle';
import { OfficeSelect } from './OfficeSelect';
import { EmergencySection } from './EmergencySection';
import { UserConfirmation } from './UserConfirmation';
import { ReplacementReasonSection } from './ReplacementReasonSection';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ReplacementReasonType } from '@/types/documentValidation';
import { getDocumentTypeName } from '@/services/documentValidation';

interface ServiceFormData {
  serviceType: string;
  isNewExecution: boolean;
  office: string;
  invoiceNumber: string;
  isEmergency: boolean;
  emergencyReason: string;
  isReplacement: boolean;
  replacementType?: ReplacementReasonType;
  replacementDetails: string;
}

interface ServiceFormProps {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  formData: ServiceFormData;
  onChange: (data: Partial<ServiceFormData>) => void;
  hideServiceSelect?: boolean;
  isDocumentValidationComplete?: boolean;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  onSubmit,
  isLoading,
  formData,
  onChange,
  hideServiceSelect = false,
  isDocumentValidationComplete = true
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    serviceType,
    isNewExecution,
    office,
    invoiceNumber,
    isEmergency,
    emergencyReason,
    isReplacement,
    replacementType,
    replacementDetails
  } = formData;

  // Enhanced form validation including replacement requirements and document validation
  const isFormValid = serviceType &&
    office &&
    invoiceNumber.length >= 6 &&
    (!isEmergency || emergencyReason) &&
    (!isReplacement || replacementType) &&
    isDocumentValidationComplete;

  // Get document type name for replacement section
  const documentTypeName = serviceType ? getDocumentTypeName(parseInt(serviceType)) : 'document';

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {!hideServiceSelect && (
        <ServiceTypeSelect 
          value={serviceType} 
          onValueChange={(value) => onChange({ serviceType: value })} 
        />
      )}

      {serviceType && (
        <ExecutionTypeToggle 
          isNewExecution={isNewExecution} 
          setIsNewExecution={(value) => onChange({ isNewExecution: value })} 
        />
      )}

      <OfficeSelect 
        value={office} 
        onValueChange={(value) => onChange({ office: value })} 
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('Invoice Number')}</label>
        <Input
          value={invoiceNumber}
          onChange={e => onChange({ invoiceNumber: e.target.value })}
          placeholder="Enter your invoice number"
        />
        <p className="text-xs text-muted-foreground">
          Enter the payment invoice number you received after payment
        </p>
      </div>

      <ReplacementReasonSection
        isReplacement={isReplacement}
        onReplacementChange={(value) => onChange({ isReplacement: value })}
        replacementType={replacementType}
        onReplacementTypeChange={(type) => onChange({ replacementType: type })}
        replacementDetails={replacementDetails}
        onReplacementDetailsChange={(details) => onChange({ replacementDetails: details })}
        documentTypeName={documentTypeName}
      />

      <EmergencySection
        isEmergency={isEmergency}
        setIsEmergency={(value) => onChange({ isEmergency: value })}
        emergencyReason={emergencyReason}
        setEmergencyReason={(value) => onChange({ emergencyReason: value })}
      />

      <UserConfirmation 
        fullName={user?.fullName}
        nationalNumber={user?.nationalNumber}
      />

      {user && !user.nationalNumber && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
          Your account information is incomplete. Please update your profile before applying for services.
        </div>
      )}
      
      <div className="space-y-3">
        {user && !user.nationalNumber && (
          <div 
            className="p-3 bg-warning/10 border border-warning/30 rounded-md text-sm flex gap-2 items-center cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <span>You need to update your profile first. Click here to go to your profile page.</span>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={!isFormValid || isLoading || !user?.nationalNumber}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('Processing')}...
            </>
          ) : (
            t('Confirm')
          )}
        </Button>
      </div>
    </form>
  );
};
