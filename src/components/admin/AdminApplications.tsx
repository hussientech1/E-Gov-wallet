
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ServiceApplication } from '@/types/application';
import { ApplicationsTable } from './applications/ApplicationsTable';
import { RejectionDialog } from './applications/RejectionDialog';
import { adminSupabase } from '@/integrations/supabase/admin-client';
import { handleApplicationRejection } from '@/utils/applicationUtils';
import { handleApprove } from '@/utils/applicationApprovalUtils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const AdminApplications: React.FC = () => {
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ServiceApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await adminSupabase
        .from('service_applications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to fetch applications.",
          variant: "destructive",
        });
      } else {
        setApplications(data || []);
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

  const handleOpenRejectDialog = (application: ServiceApplication) => {
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
