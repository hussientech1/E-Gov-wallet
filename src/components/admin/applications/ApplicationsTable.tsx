
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileCheck, XCircle } from 'lucide-react';
import { ServiceApplication } from '@/types/application';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ApplicationsTableProps {
  applications: ServiceApplication[];
  loading: boolean;
  processing: boolean;
  onApprove: (applicationId: number, nationalNumber: string) => void;
  onOpenRejectDialog: (application: ServiceApplication) => void;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  processing,
  onApprove,
  onOpenRejectDialog,
}) => {
  // Helper function to get service name
  const getServiceName = (serviceId: number | undefined) => {
    if (!serviceId) return 'Unknown Service';
    
    switch (serviceId) {
      case 1:
        return 'Passport';
      case 2:
        return 'National ID';
      case 3:
        return 'Birth Certificate';
      case 4:
        return 'Driver License';
      default:
        return `Service #${serviceId}`;
    }
  };
  
  return (
    <Table>
      <TableCaption>List of all service applications</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Application ID</TableHead>
          <TableHead>National Number</TableHead>
          <TableHead>Service</TableHead>
          <TableHead>Submitted At</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              <span className="mt-2 block text-sm">Loading applications...</span>
            </TableCell>
          </TableRow>
        ) : applications.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">No applications found.</TableCell>
          </TableRow>
        ) : (
          applications.map((application) => (
            <TableRow key={application.application_id}>
              <TableCell>{application.application_id}</TableCell>
              <TableCell>{application.national_number}</TableCell>
              <TableCell>{getServiceName(application.service_id)}</TableCell>
              <TableCell>{new Date(application.submitted_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    application.application_status === 'Approved' 
                      ? 'default' 
                      : application.application_status === 'Rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {application.application_status}
                </Badge>
              </TableCell>
              <TableCell>
                {application.application_status === 'Pending' && (
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            onClick={() => onApprove(application.application_id, application.national_number)}
                            disabled={processing}
                            className="flex items-center gap-1"
                          >
                            {processing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <FileCheck className="h-4 w-4" /> 
                                Approve & Create Document
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Approve application and automatically create official document</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => onOpenRejectDialog(application)}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                )}
                
                {application.application_status === 'Approved' && (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Document created
                  </span>
                )}
                
                {application.application_status === 'Rejected' && (
                  <span className="text-sm text-muted-foreground">
                    {application.rejection_reason ? 
                      `Reason: ${application.rejection_reason.substring(0, 30)}${application.rejection_reason.length > 30 ? '...' : ''}` : 
                      'No reason provided'}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};
