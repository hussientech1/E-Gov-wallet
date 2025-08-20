import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { DocumentUpload } from './DocumentUpload';
import { RequiredDocumentsProps, DocumentUploadState, UploadedDocument, RequiredDocumentInfo } from '@/types/documentUpload';

export const RequiredDocuments: React.FC<RequiredDocumentsProps> = ({
  serviceId,
  requiredDocuments,
  onDocumentsChange,
  documents
}) => {
  const { t } = useLanguage();
  const [documentInfos, setDocumentInfos] = useState<RequiredDocumentInfo[]>([]);

  // Map document types to user-friendly information
  const getDocumentInfo = (documentType: string): RequiredDocumentInfo => {
    const documentMap: { [key: string]: RequiredDocumentInfo } = {
      'Birth Certificate': {
        type: 'birth_certificate',
        label: 'Birth Certificate',
        description: 'Official birth certificate issued by civil registry',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Photo': {
        type: 'photo',
        label: 'Passport Photo',
        description: 'Recent passport-size photograph (white background)',
        acceptedTypes: ['image/*'],
        maxSize: 2 * 1024 * 1024,
        required: true
      },
      'Proof of Address': {
        type: 'proof_of_address',
        label: 'Proof of Address',
        description: 'Utility bill, bank statement, or rental agreement',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Current National ID': {
        type: 'current_national_id',
        label: 'Current National ID',
        description: 'Copy of your current national identity card',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'National ID': {
        type: 'national_id',
        label: 'National ID',
        description: 'Copy of your national identity card',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Application Form': {
        type: 'application_form',
        label: 'Application Form',
        description: 'Completed and signed application form',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Current Passport': {
        type: 'current_passport',
        label: 'Current Passport',
        description: 'Copy of your current passport',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Passport': {
        type: 'passport',
        label: 'Passport',
        description: 'Copy of your passport',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Visa': {
        type: 'visa',
        label: 'Visa',
        description: 'Copy of your current visa',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Sponsor Letter': {
        type: 'sponsor_letter',
        label: 'Sponsor Letter',
        description: 'Official letter from your sponsor',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Medical Certificate': {
        type: 'medical_certificate',
        label: 'Medical Certificate',
        description: 'Medical fitness certificate from approved clinic',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Current Iqama': {
        type: 'current_iqama',
        label: 'Current Iqama',
        description: 'Copy of your current residence permit (Iqama)',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'ID Document': {
        type: 'id_document',
        label: 'ID Document',
        description: 'National ID or Iqama (whichever applicable)',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Driving Test Certificate': {
        type: 'driving_test_certificate',
        label: 'Driving Test Certificate',
        description: 'Certificate from approved driving school',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Current License': {
        type: 'current_license',
        label: 'Current License',
        description: 'Copy of your current driving license',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Hospital Birth Record': {
        type: 'hospital_birth_record',
        label: 'Hospital Birth Record',
        description: 'Original birth record from hospital',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Parents ID': {
        type: 'parents_id',
        label: 'Parents ID',
        description: 'Copy of both parents\' identity documents',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Marriage Certificate': {
        type: 'marriage_certificate',
        label: 'Marriage Certificate',
        description: 'Official marriage certificate',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Marriage Contract': {
        type: 'marriage_contract',
        label: 'Marriage Contract',
        description: 'Official marriage contract document',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Witnesses ID': {
        type: 'witnesses_id',
        label: 'Witnesses ID',
        description: 'Copy of witnesses\' identity documents',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      },
      'Couples ID': {
        type: 'couples_id',
        label: 'Couples ID',
        description: 'Copy of both spouses\' identity documents',
        acceptedTypes: ['image/*', 'application/pdf'],
        maxSize: 5 * 1024 * 1024,
        required: true
      }
    };

    return documentMap[documentType] || {
      type: documentType.toLowerCase().replace(/\s+/g, '_'),
      label: documentType,
      description: `Please upload your ${documentType.toLowerCase()}`,
      acceptedTypes: ['image/*', 'application/pdf'],
      maxSize: 5 * 1024 * 1024,
      required: true
    };
  };

  useEffect(() => {
    const infos = requiredDocuments.map(doc => getDocumentInfo(doc));
    setDocumentInfos(infos);
  }, [requiredDocuments]);

  const handleDocumentChange = (documentType: string, document: UploadedDocument | null) => {
    const updatedDocuments = {
      ...documents,
      [documentType]: document
    };
    onDocumentsChange(updatedDocuments);
  };

  const getUploadedCount = () => {
    return Object.values(documents).filter(doc => doc !== null).length;
  };

  const getTotalRequired = () => {
    return documentInfos.filter(info => info.required).length;
  };

  const isAllRequiredUploaded = () => {
    return documentInfos
      .filter(info => info.required)
      .every(info => documents[info.type] !== null);
  };

  if (requiredDocuments.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Required Documents
          </CardTitle>
          <Badge variant={isAllRequiredUploaded() ? "default" : "secondary"}>
            {getUploadedCount()}/{getTotalRequired()} uploaded
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAllRequiredUploaded() && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please upload all required documents before submitting your application.
            </AlertDescription>
          </Alert>
        )}

        {isAllRequiredUploaded() && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              All required documents have been uploaded successfully.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {documentInfos.map((docInfo) => (
            <DocumentUpload
              key={docInfo.type}
              documentType={docInfo.type}
              label={docInfo.label}
              description={docInfo.description}
              acceptedTypes={docInfo.acceptedTypes}
              maxSize={docInfo.maxSize}
              required={docInfo.required}
              initialDocument={documents[docInfo.type] || null}
              onDocumentChange={(document) => handleDocumentChange(docInfo.type, document)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};