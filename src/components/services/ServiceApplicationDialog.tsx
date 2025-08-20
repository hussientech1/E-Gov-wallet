
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceForm } from './ServiceForm';
import { RequiredDocuments } from './RequiredDocuments';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { validateDocumentStatus, createReplacementReasonString } from '@/services/documentValidation';
import { ReplacementReasonType } from '@/types/documentValidation';
import { DocumentUploadState, UploadedDocument } from '@/types/documentUpload';

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

interface ServiceApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    isAvailable: boolean;
  };
}

export const ServiceApplicationDialog: React.FC<ServiceApplicationDialogProps> = ({
  open,
  onClose,
  service
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'success' | 'warning' | 'error'>('idle');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentUploadState>({});
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceType: service.id,
    isNewExecution: true,
    office: '',
    invoiceNumber: '',
    isEmergency: false,
    emergencyReason: '',
    isReplacement: false,
    replacementType: undefined,
    replacementDetails: ''
  });

  // Fetch required documents when service changes
  useEffect(() => {
    const fetchRequiredDocuments = async () => {
      if (!service.id) return;
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select('required_documents')
          .eq('service_id', parseInt(service.id))
          .single();
        
        if (error) throw error;
        
        if (data?.required_documents) {
          setRequiredDocuments(data.required_documents);
        }
      } catch (error) {
        console.error('Error fetching required documents:', error);
        toast({
          title: "Error",
          description: "Failed to load required documents.",
          variant: "destructive"
        });
      }
    };

    if (open && service.id) {
      fetchRequiredDocuments();
    }
  }, [open, service.id]);

  const handleFormChange = (updatedData: Partial<ServiceFormData>) => {
    setFormData(prev => ({ ...prev, ...updatedData }));
  };

  const handleDocumentsChange = (updatedDocuments: DocumentUploadState) => {
    setDocuments(updatedDocuments);
  };

  const isAllRequiredDocumentsUploaded = () => {
    if (requiredDocuments.length === 0) return true;
    
    return requiredDocuments.every(docType => {
      const docKey = docType.toLowerCase().replace(/\s+/g, '_');
      return documents[docKey] !== null && documents[docKey] !== undefined;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.nationalNumber) {
      toast({
        title: "Error",
        description: "User information is missing. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    // Check if all required documents are uploaded
    if (!isAllRequiredDocumentsUploaded()) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents before submitting your application.",
        variant: "destructive"
      });
      return;
    }

    // Clear previous validation messages and set status
    setValidationError(null);
    setValidationWarning(null);
    setValidationStatus('checking');
    setIsValidating(true);

    try {
      // Step 1: Validate document status before submission
      const replacementReason = formData.isReplacement && formData.replacementType
        ? createReplacementReasonString(
            formData.replacementType.charAt(0).toUpperCase() + formData.replacementType.slice(1),
            formData.replacementDetails
          )
        : undefined;

      const validationResult = await validateDocumentStatus({
        userId: user.nationalNumber,
        serviceId: parseInt(formData.serviceType),
        isReplacement: formData.isReplacement,
        replacementReason: replacementReason
      });

      setIsValidating(false);

      // Step 2: Handle validation result
      if (!validationResult.canProceed) {
        setValidationError(validationResult.errorMessage || 'Cannot proceed with application');
        setValidationStatus('error');
        toast({
          title: "Cannot Proceed",
          description: validationResult.errorMessage,
          variant: "destructive"
        });
        return;
      }

      // Show warning if present (but allow to continue)
      if (validationResult.warningMessage) {
        setValidationWarning(validationResult.warningMessage);
        setValidationStatus('warning');
        
        // Show informative toast for warnings
        toast({
          title: "Validation Notice",
          description: validationResult.warningMessage,
          variant: "default"
        });
      } else {
        setValidationStatus('success');
      }

      // Step 3: Proceed with application submission
      setIsLoading(true);

      // Determine the emergency reason - use replacement reason if this is a replacement
      let emergencyReasonToStore = null;
      if (formData.isReplacement && replacementReason) {
        emergencyReasonToStore = replacementReason;
      } else if (formData.isEmergency && formData.emergencyReason) {
        emergencyReasonToStore = formData.emergencyReason;
      }

      const { data, error } = await supabase
        .from('service_applications')
        .insert({
          national_number: user.nationalNumber,
          service_id: parseInt(formData.serviceType),
          invoice_number: formData.invoiceNumber,
          office_location: formData.office,
          emergency_reason: emergencyReasonToStore,
          application_status: 'Pending',
          documents_uploaded: true
        })
        .select('application_id')
        .single();
      
      if (error) throw error;

      // Step 4: Upload documents to uploaded_documents table
      console.log('=== DOCUMENT INSERTION DEBUG START ===');
      console.log('Application ID:', data?.application_id);
      console.log('Documents object:', documents);
      console.log('Documents keys:', Object.keys(documents));
      console.log('Documents count:', Object.keys(documents).length);
      
      if (data?.application_id && Object.keys(documents).length > 0) {
        console.log('Preparing to insert documents for application:', data.application_id);
        
        const documentInserts = Object.entries(documents)
          .filter(([_, doc]) => doc !== null)
          .map(([docType, doc]) => {
            console.log(`Processing document: ${docType}`, {
              file_name: doc!.file_name,
              file_size: doc!.file_size,
              mime_type: doc!.mime_type,
              data_length: doc!.file_data?.length || 0
            });
            
            return {
              application_id: data.application_id,
              document_type: docType,
              file_name: doc!.file_name,
              file_path: doc!.file_data, // Store base64 data in file_path
              file_size: doc!.file_size,
              mime_type: doc!.mime_type,
              upload_status: 'pending'
            };
          });

        console.log('Document inserts prepared:', documentInserts.length);
        console.log('Insert data:', documentInserts);

        if (documentInserts.length > 0) {
          console.log('Attempting to insert documents...');
          
          const { data: insertedDocs, error: docError } = await supabase
            .from('uploaded_documents')
            .insert(documentInserts)
            .select();

          console.log('Insert result:', { insertedDocs, docError });

          if (docError) {
            console.error('Error uploading documents:', docError);
            console.error('Error code:', docError.code);
            console.error('Error message:', docError.message);
            console.error('Error details:', docError.details);
            
            // Don't fail the entire application, just log the error
            toast({
              title: "Warning",
              description: `Application submitted but documents failed to save: ${docError.message}`,
              variant: "default"
            });
          } else {
            console.log('Documents inserted successfully:', insertedDocs?.length || 0);
            console.log('Inserted documents:', insertedDocs);
          }
        }
      } else {
        console.log('No documents to insert. Reasons:');
        console.log('- Application ID exists:', !!data?.application_id);
        console.log('- Documents count:', Object.keys(documents).length);
        console.log('- Documents object:', documents);
      }
      
      console.log('=== DOCUMENT INSERTION DEBUG END ===');
      
      const successMessage = formData.isReplacement
        ? "Your replacement request has been submitted successfully."
        : "Your service application has been submitted successfully.";

      toast({
        title: "Success!",
        description: successMessage
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsValidating(false);
      if (validationStatus === 'checking') {
        setValidationStatus('idle');
      }
    }
  };

  if (!service.isAvailable) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{service.name}</DialogTitle>
            <DialogDescription>
              <div className="py-6 flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-warning mb-3" />
                <h3 className="text-lg font-medium mb-2">Service Unavailable</h3>
                <p className="text-muted-foreground">
                  This service is currently not available. Please check back later or contact support for assistance.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service.name} Application</DialogTitle>
          <DialogDescription>
            Complete the form below to apply for this service
          </DialogDescription>
        </DialogHeader>

        {/* Validation Messages */}
        {validationError && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {validationWarning && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{validationWarning}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Validation Status */}
        {isValidating && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Verifying document status using multiple validation methods...
            </AlertDescription>
          </Alert>
        )}

        {validationStatus === 'success' && !validationWarning && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Document validation completed successfully. You can proceed with your application.
            </AlertDescription>
          </Alert>
        )}

        {/* Required Documents Section */}
        {requiredDocuments.length > 0 && (
          <RequiredDocuments
            serviceId={service.id}
            requiredDocuments={requiredDocuments}
            onDocumentsChange={handleDocumentsChange}
            documents={documents}
          />
        )}
        
        <ServiceForm
          onSubmit={handleSubmit}
          isLoading={isLoading || isValidating}
          onChange={handleFormChange}
          formData={{...formData, serviceType: service.id}}
          hideServiceSelect={true}
          isDocumentValidationComplete={isAllRequiredDocumentsUploaded()}
        />
      </DialogContent>
    </Dialog>
  );
};
