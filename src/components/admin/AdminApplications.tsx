
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { EnhancedServiceApplication } from '@/types/application';
import { ApplicationsTable } from './applications/ApplicationsTable';
import { RejectionDialog } from './applications/RejectionDialog';
import { adminSupabase } from '@/integrations/supabase/admin-client';
import { handleApplicationRejection } from '@/utils/applicationUtils';
import { handleApprove } from '@/utils/applicationApprovalUtils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<EnhancedServiceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<EnhancedServiceApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    console.log('=== FETCH APPLICATIONS DEBUG START ===');
    setLoading(true);
    try {
      // Enhanced query with user, service, and document information
      const { data, error } = await adminSupabase
        .from('service_applications')
        .select(`
          *,
          users!service_applications_national_number_fkey (
            full_name,
            phone_number,
            email,
            address,
            state,
            gender,
            birth_date
          ),
          services!service_applications_service_id_fkey (
            service_name,
            description,
            fee,
            processing_time
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to fetch applications.",
          variant: "destructive",
        });
      } else {
        console.log('Fetched', data?.length || 0, 'applications');
        
        // Fetch document information for each application
        const enhancedApplications: EnhancedServiceApplication[] = await Promise.all(
          (data || []).map(async (app) => {
            console.log(`Fetching documents for application ${app.application_id}...`);
            
            // Get document count and status for this application
            const { data: documents, error: docError } = await adminSupabase
              .from('uploaded_documents')
              .select('upload_id, upload_status')
              .eq('application_id', app.application_id);

            console.log(`Application ${app.application_id} documents:`, documents);

            let hasDocuments = false;
            let documentCount = 0;
            let pendingDocuments = 0;
            let verifiedDocuments = 0;
            let rejectedDocuments = 0;

            if (!docError && documents) {
              hasDocuments = documents.length > 0;
              documentCount = documents.length;
              pendingDocuments = documents.filter(doc => doc.upload_status === 'pending').length;
              verifiedDocuments = documents.filter(doc => doc.upload_status === 'verified').length;
              rejectedDocuments = documents.filter(doc => doc.upload_status === 'rejected').length;
              
              console.log(`Application ${app.application_id} document counts:`, {
                total: documentCount,
                pending: pendingDocuments,
                verified: verifiedDocuments,
                rejected: rejectedDocuments
              });
            } else if (docError) {
              console.error(`Error fetching documents for application ${app.application_id}:`, docError);
            }

            return {
              ...app,
              // User information
              user_full_name: app.users?.full_name || 'Unknown User',
              user_phone_number: app.users?.phone_number || 'N/A',
              user_email: app.users?.email || null,
              user_address: app.users?.address || null,
              user_state: app.users?.state || null,
              user_gender: app.users?.gender || null,
              user_birth_date: app.users?.birth_date || null,
              
              // Service information
              service_name: app.services?.service_name || `Service #${app.service_id}`,
              service_description: app.services?.description || null,
              service_fee: app.services?.fee || null,
              service_processing_time: app.services?.processing_time || null,
              
              // Additional metadata
              is_emergency: Boolean(app.emergency_reason),
              has_documents: hasDocuments,
              document_count: documentCount,
              pending_documents: pendingDocuments,
              verified_documents: verifiedDocuments,
              rejected_documents: rejectedDocuments
            };
          })
        );
        
        console.log('Enhanced applications with document counts:', enhancedApplications.map(app => ({
          id: app.application_id,
          pending: app.pending_documents,
          verified: app.verified_documents,
          rejected: app.rejected_documents
        })));
        
        setApplications(enhancedApplications);
        console.log('Applications state updated');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log('=== FETCH APPLICATIONS DEBUG END ===');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
  };

  const handleApproveClick = async (applicationId: number, nationalNumber: string) => {
    if (!user) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const success = await handleApprove(
        applicationId,
        nationalNumber,
        user.nationalNumber,
        applications
      );
      
      if (success) {
        // Refresh the applications list after successful approval
        await fetchApplications();
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedApplication) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const result = await handleApplicationRejection(
        selectedApplication.application_id,
        user.nationalNumber,
        rejectionReason,
        selectedApplication.national_number
      );

      if (result.success) {
        toast({
          title: "Success",
          description: "Application rejected successfully.",
        });
        await fetchApplications();
      } else {
        toast({
          title: "Error",
          description: "Failed to reject application.",
          variant: "destructive",
        });
      }
    } finally {
      setProcessing(false);
      setOpen(false);
      setRejectionReason('');
    }
  };

  const handleOpenRejectDialog = (application: EnhancedServiceApplication) => {
    setSelectedApplication(application);
    setRejectionReason('');
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Service Applications</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Applications</CardTitle>
          <CardDescription>View and manage service applications</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ApplicationsTable
            applications={applications}
            loading={loading}
            processing={processing}
            onApprove={handleApproveClick}
            onOpenRejectDialog={handleOpenRejectDialog}
            onRefresh={fetchApplications}
          />
          <RejectionDialog
            open={open}
            onOpenChange={setOpen}
            onReject={handleReject}
            selectedApplication={selectedApplication}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            processing={processing}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminApplications;
