
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from "@/components/ui/use-toast";
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { DocumentDetailSkeleton } from '@/components/documents/DocumentDetailSkeleton';
import { DocumentDetailError } from '@/components/documents/DocumentDetailError';
import { DocumentNotFound } from '@/components/documents/DocumentNotFound';
import { DocumentPersonalInfo } from '@/components/documents/DocumentPersonalInfo';
import { DocumentInfo } from '@/components/documents/DocumentInfo';
import { DocumentQRCode } from '@/components/documents/DocumentQRCode';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { DocumentData } from '@/types/document';
import { getDocumentTitle } from '@/components/documents/DocumentCard';

const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!user || !id) {
        setLoading(false);
        setError("User information or document ID is missing");
        return;
      }

      try {
        const docId = parseInt(id, 10);
        
        if (isNaN(docId)) {
          toast({
            title: t('Error'),
            description: t('Invalid Document ID'),
            variant: "destructive"
          });
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('national_number', user.nationalNumber)
          .maybeSingle();

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error fetching user data:', userError);
          setError("Error verifying user account");
          setLoading(false);
          return;
        }

        if (!userData) {
          setError("User profile not found. Please complete your profile first.");
          setLoading(false);
          return;
        }

        const { data: documentData, error: documentError } = await supabase
          .from('user_documents')
          .select('*')
          .eq('doc_id', docId)
          .eq('national_number', user.nationalNumber)
          .maybeSingle();

        if (documentError) {
          console.error('Error fetching document:', documentError);
          if (documentError.code === 'PGRST116') {
            setDocument(null);
          } else {
            setError("Failed to retrieve document information");
            toast({
              title: t('Error'),
              description: t('Error Fetching Document'),
              variant: "destructive"
            });
          }
          setLoading(false);
          return;
        }

        if (!documentData) {
          setLoading(false);
          return;
        }

        let issueAuthority = '';
        let passportType = '';

        switch (documentData.doc_type) {
          case 'national_id':
            issueAuthority = 'Ministry of Interior';
            break;
          case 'passport':
            issueAuthority = 'Department of Immigration and Passports';
            passportType = 'Ordinary';
            break;
          case 'birth_certificate':
            issueAuthority = 'Civil Registry Office';
            break;
          case 'driver_license':
            issueAuthority = 'Traffic Police Department';
            break;
          default:
            issueAuthority = 'Government of Sudan';
        }

        const enhancedDocument = {
          ...documentData,
          personal_info: {
            fullName: userData?.full_name || user.fullName,
            nationality: 'Sudanese',
            dateOfBirth: userData?.birth_date || '2000-01-01',
            placeOfBirth: 'Khartoum',
            gender: userData?.gender || 'Male',
            address: userData?.address || 'Sudan'
          },
          issueAuthority,
          passportType
        };

        setDocument(enhancedDocument);
      } catch (error) {
        console.error('Error:', error);
        setError("An unexpected error occurred");
        toast({
          title: t('Error'),
          description: t('Something Went Wrong'),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, user, t]);

  if (loading) {
    return <DocumentDetailSkeleton />;
  }

  if (error) {
    return <DocumentDetailError error={error} />;
  }

  if (!document) {
    return <DocumentNotFound />;
  }

  const handleDocumentUpdated = (updatedDocument: DocumentData) => {
    setDocument(updatedDocument);
    toast({
      title: t('Document Updated'),
      description: t('Document updated successfully')
    });
  };

  const handleDocumentDeleted = () => {
    // Navigate back to documents page after deletion
    window.location.href = '/documents';
  };

  return (
    <AppLayout>
      <PageHeader title={getDocumentTitle(document.doc_type, t)} showBack />

      <div className="p-4 space-y-6">
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-white">
            <div className="text-center">
              <h2 className="text-xl font-bold">{t('Republic of Sudan')}</h2>
              <p>{getDocumentTitle(document.doc_type, t)}</p>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            <DocumentPersonalInfo personalInfo={document.personal_info!} />
            
            <DocumentInfo 
              docNumber={document.doc_number}
              issueDate={document.issue_date}
              expiryDate={document.expiry_date}
              issueAuthority={document.issueAuthority!}
              docType={document.doc_type}
              passportType={document.passportType}
            />
            
            <DocumentQRCode qrCode={document.qr_code} />
          </CardContent>
        </Card>

        <DocumentActions 
          document={document}
          onDocumentUpdated={handleDocumentUpdated}
          onDocumentDeleted={handleDocumentDeleted}
        />
      </div>
    </AppLayout>
  );
};

export default DocumentDetail;
