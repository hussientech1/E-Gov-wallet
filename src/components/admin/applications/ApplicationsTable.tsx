
import React, { useState } from 'react';
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
import { Loader2, FileCheck, XCircle, Eye, EyeOff, ChevronDown, ChevronRight, FileText, AlertTriangle } from 'lucide-react';
import { EnhancedServiceApplication, RequestViewState } from '@/types/application';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RequestDetailsView } from './RequestDetailsView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ApplicationsTableProps {
  applications: EnhancedServiceApplication[];
  loading: boolean;
  processing: boolean;
  onApprove: (applicationId: number, nationalNumber: string) => void;
  onOpenRejectDialog: (application: EnhancedServiceApplication) => void;
  onRefresh: () => void;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  processing,
  onApprove,
  onOpenRejectDialog,
  onRefresh,
}) => {
  const [viewState, setViewState] = useState<RequestViewState>({});

  const toggleRequestView = (applicationId: number) => {
    setViewState(prev => ({
      ...prev,
      [applicationId]: !prev[applicationId]
    }));
  };

  const isRequestVisible = (applicationId: number) => {
    return viewState[applicationId] || false;
  };
  
  return (
    <div className="space-y-2">
      <Table>
        <TableCaption>List of all service applications</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Application ID</TableHead>
            <TableHead>Applicant</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead className="w-32">View Request</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                <span className="mt-2 block text-sm">Loading applications...</span>
              </TableCell>
            </TableRow>
          ) : applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">No applications found.</TableCell>
            </TableRow>
          ) : (
            applications.map((application) => (
              <React.Fragment key={application.application_id}>
                <TableRow className={isRequestVisible(application.application_id) ? 'border-b-0' : ''}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRequestView(application.application_id)}
                      className="p-1 h-6 w-6"
                    >
                      {isRequestVisible(application.application_id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{application.application_id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{application.user_full_name}</p>
                      <p className="text-sm text-muted-foreground">{application.national_number}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{application.service_name}</p>
                      <div className="flex gap-1 mt-1">
                        {application.is_emergency && (
                          <Badge variant="destructive" className="text-xs">
                            Emergency
                          </Badge>
                        )}
                        {application.has_documents && (
                          <div className="flex gap-1">
                            {application.pending_documents && application.pending_documents > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {application.pending_documents} Pending
                              </Badge>
                            )}
                            {application.verified_documents && application.verified_documents > 0 && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <FileCheck className="w-3 h-3 mr-1" />
                                {application.verified_documents} Verified
                              </Badge>
                            )}
                            {application.rejected_documents && application.rejected_documents > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                {application.rejected_documents} Rejected
                              </Badge>
                            )}
                          </div>
                        )}
                        {!application.has_documents && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            No Documents
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
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
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                onClick={() => onApprove(application.application_id, application.national_number)}
                                disabled={
                                  processing ||
                                  (application.has_documents && application.pending_documents && application.pending_documents > 0)
                                }
                                className="flex items-center gap-1 text-xs px-2 py-1 h-7"
                              >
                                {processing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <FileCheck className="h-3 w-3" />
                                    Approve
                                  </>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {application.has_documents && application.pending_documents && application.pending_documents > 0
                                  ? "All documents must be verified before approval"
                                  : "Approve application and automatically create official document"
                                }
                              </p>
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
                              className="text-xs px-2 py-1 h-7"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
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
                          `Reason: ${application.rejection_reason.substring(0, 20)}${application.rejection_reason.length > 20 ? '...' : ''}` :
                          'No reason provided'}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRequestView(application.application_id)}
                            className="flex items-center gap-2"
                          >
                            {isRequestVisible(application.application_id) ? (
                              <>
                                <EyeOff className="h-4 w-4" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4" />
                                View
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isRequestVisible(application.application_id) ? 'Hide' : 'View'} detailed request information</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
                
                {/* Expandable Request Details */}
                {isRequestVisible(application.application_id) && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <div className="border-t bg-muted/30">
                        <RequestDetailsView
                          application={application}
                          onApprove={onApprove}
                          onReject={onOpenRejectDialog}
                          processing={processing}
                          onDocumentStatusChange={() => {
                            // Refresh applications when document status changes
                            console.log('Document status changed, refreshing applications...');
                            onRefresh();
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
