import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { EnhancedServiceApplication } from '@/types/application';
import { DocumentViewer } from '../documents/DocumentViewer';

interface RequestDetailsViewProps {
  application: EnhancedServiceApplication;
  onApprove: (applicationId: number, nationalNumber: string) => void;
  onReject: (application: EnhancedServiceApplication) => void;
  processing: boolean;
  onDocumentStatusChange?: () => void;
}

export const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({
  application,
  onApprove,
  onReject,
  processing,
  onDocumentStatusChange
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Request Details</h3>
          <p className="text-sm text-muted-foreground">
            Application #{application.application_id} • Submitted {formatDate(application.submitted_at)}
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{application.user_full_name}</p>
                <p className="text-sm text-muted-foreground">National Number: {application.national_number}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{application.user_phone_number}</span>
            </div>
            
            {application.user_email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{application.user_email}</span>
              </div>
            )}
            
            {application.user_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{application.user_address}</span>
              </div>
            )}
            
            {application.user_birth_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Born: {new Date(application.user_birth_date).toLocaleDateString()}</span>
              </div>
            )}
            
            {application.user_gender && (
              <div className="text-sm">
                <span className="text-muted-foreground">Gender: </span>
                <span className="capitalize">{application.user_gender}</span>
              </div>
            )}
            
            {application.user_state && (
              <div className="text-sm">
                <span className="text-muted-foreground">State: </span>
                <span>{application.user_state}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Service Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium">{application.service_name}</p>
              <p className="text-sm text-muted-foreground">Service ID: {application.service_id}</p>
            </div>
            
            {application.service_description && (
              <p className="text-sm">{application.service_description}</p>
            )}
            
            {application.service_fee && (
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Fee: {formatCurrency(application.service_fee)}</span>
              </div>
            )}
            
            {application.service_processing_time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Processing Time: {application.service_processing_time}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>Office: {application.office_location}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span>Invoice: {application.invoice_number}</span>
            </div>
            
            {application.payment_status && (
              <div className="text-sm">
                <span className="text-muted-foreground">Payment Status: </span>
                <Badge variant={application.payment_status === 'Paid' ? 'default' : 'secondary'}>
                  {application.payment_status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency/Special Requests */}
      {(application.is_emergency || application.emergency_reason) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Emergency/Special Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            {application.is_emergency && (
              <Badge variant="destructive" className="mb-2">
                Emergency Request
              </Badge>
            )}
            {application.emergency_reason && (
              <p className="text-sm">{application.emergency_reason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Application Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Application Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">Application Submitted</p>
              <p className="text-xs text-muted-foreground">{formatDate(application.submitted_at)}</p>
            </div>
          </div>
          
          {application.reviewed_at && (
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                application.application_status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <div>
                <p className="text-sm font-medium">
                  Application {application.application_status}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(application.reviewed_at)}
                  {application.reviewed_by && ` by ${application.reviewed_by}`}
                </p>
              </div>
            </div>
          )}
          
          {application.rejection_reason && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-500">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Rejection Reason:</p>
              <p className="text-sm text-red-600 dark:text-red-400">{application.rejection_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Section */}
      <DocumentViewer
        applicationId={application.application_id}
        onDocumentStatusChange={onDocumentStatusChange}
      />

      {/* Action Buttons */}
      {application.application_status === 'Pending' && (
        <>
          <Separator />
          
          {/* Document Verification Warning */}
          {application.has_documents && application.pending_documents && application.pending_documents > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border-l-4 border-orange-500">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Document Verification Required
                </p>
              </div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                {application.pending_documents} document{application.pending_documents > 1 ? 's' : ''} require{application.pending_documents === 1 ? 's' : ''} verification before this application can be approved.
              </p>
            </div>
          )}

          {application.has_documents && application.rejected_documents && application.rejected_documents > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-500">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Rejected Documents Found
                </p>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {application.rejected_documents} document{application.rejected_documents > 1 ? 's have' : ' has'} been rejected. The applicant may need to resubmit valid documents.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onReject(application)}
              disabled={processing}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject Application
            </Button>
            <Button
              onClick={() => onApprove(application.application_id, application.national_number)}
              disabled={
                processing ||
                (application.has_documents && application.pending_documents && application.pending_documents > 0)
              }
              className="flex items-center gap-2"
              title={
                application.has_documents && application.pending_documents && application.pending_documents > 0
                  ? "All documents must be verified before approval"
                  : "Approve application and create document"
              }
            >
              <CheckCircle className="h-4 w-4" />
              Approve & Create Document
            </Button>
          </div>
        </>
      )}
    </div>
  );
};