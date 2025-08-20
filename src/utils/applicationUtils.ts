import { toast } from "@/components/ui/use-toast";
import { adminSupabase } from "@/integrations/supabase/admin-client";
import { ServiceApplication } from "@/types/application";
import { updateApplicationStatus } from "./adminUtils";

export const handleApplicationApproval = async (
  applicationId: number,
  nationalNumber: string,
  adminNationalNumber: string,
  applications: ServiceApplication[]
): Promise<boolean> => {
  try {
    // First update the application status
    const result = await updateApplicationStatus(
      applicationId,
      'Approved',
      adminNationalNumber
    );

    if (result.success) {
      const application = applications.find(app => app.application_id === applicationId);
      
      if (application) {
        // Determine document type based on service ID
        let docType: 'passport' | 'national_id' | 'birth_certificate' | 'driver_license' = 'passport';
        
        switch (application.service_id) {
          case 1:
            docType = 'passport';
            break;
          case 2:
            docType = 'national_id';
            break;
          case 3:
            docType = 'birth_certificate';
            break;
          case 4:
            docType = 'driver_license';
            break;
          default:
            docType = 'passport';
        }
        
        // Create document with a more sophisticated unique document number
        const timestamp = new Date().getTime().toString().slice(-6);
        const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const docNumber = `${docType.charAt(0).toUpperCase()}${docType.charAt(1).toUpperCase()}-${timestamp}-${randomPart}`;
        
        // Set issue date to today
        const issueDate = new Date().toISOString().split('T')[0];
        
        // Set expiry date based on document type
        const expiryDate = new Date();
        if (docType === 'birth_certificate') {
          // Birth certificates don't expire
          expiryDate.setFullYear(expiryDate.getFullYear() + 100); 
        } else if (docType === 'passport') {
          // Passports typically valid for 10 years
          expiryDate.setFullYear(expiryDate.getFullYear() + 10);
        } else {
          // Other documents valid for 5 years
          expiryDate.setFullYear(expiryDate.getFullYear() + 5);
        }
        
        // Generate a more sophisticated QR code value
        const qrCode = `https://verify.egov.example/${docType}/${applicationId}/${randomPart}`;
        
        console.log('Creating document with details:', {
          national_number: application.national_number,
          doc_type: docType,
          doc_number: docNumber,
          issue_date: issueDate,
          expiry_date: expiryDate.toISOString().split('T')[0]
        });
        
        // Insert the document into user_documents table
        const { data: docData, error: docError } = await adminSupabase
          .from('user_documents')
          .insert({
            national_number: application.national_number,
            doc_type: docType,
            doc_number: docNumber,
            issue_date: issueDate,
            expiry_date: expiryDate.toISOString().split('T')[0],
            document_status: 'active',
            qr_code: qrCode
          })
          .select('doc_id')
          .single();
          
        if (docError) {
          console.error('Error creating document:', docError);
          toast({
            title: "Error",
            description: "Failed to create document, but application was approved.",
            variant: "destructive",
          });
          // Return true since the application was approved even if document creation failed
          return true;
        }

        console.log('Document created successfully:', docData);
        
        // Get user's full name for print queue
        const { data: userData, error: userError } = await adminSupabase
          .from('users')
          .select('full_name')
          .eq('national_number', application.national_number)
          .single();

        const userFullName = userData?.full_name || 'Unknown User';

        // Add approved application to print queue
        const { error: queueError } = await adminSupabase
          .from('print_queue')
          .insert({
            application_id: application.application_id,
            national_number: application.national_number,
            user_full_name: userFullName,
            service_type: getServiceName(application.service_id),
            service_id: application.service_id,
            office_location: application.office_location,
            document_id: docData?.doc_id || null,
            print_status: 'pending_print'
          });

        if (queueError) {
          console.error('Error adding to print queue:', queueError);
          // Don't fail the approval process if print queue insertion fails
          toast({
            title: "Warning",
            description: "Application approved but failed to add to print queue. Please add manually.",
            variant: "destructive",
          });
        } else {
          console.log('Successfully added to print queue');
        }
        
        // Create notification with more detailed information
        const { error: notifError } = await adminSupabase
          .from('notifications')
          .insert({
            national_number: application.national_number,
            title: 'Application Approved',
            message: `Your application for ${getServiceName(application.service_id)} has been approved. Your document has been queued for printing and will be ready for collection at ${application.office_location}.`,
            status_type: 'success'
          });

        if (notifError) {
          console.error('Error creating notification:', notifError);
        }
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error approving application:', error);
    return false;
  }
};

// Helper function to get service name from service ID
const getServiceName = (serviceId?: number): string => {
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

export const handleApplicationRejection = async (
  applicationId: number,
  adminNationalNumber: string,
  rejectionReason: string,
  nationalNumber: string
): Promise<{ success: boolean }> => {
  try {
    const result = await updateApplicationStatus(
      applicationId,
      'Rejected',
      adminNationalNumber,
      rejectionReason
    );

    if (result.success) {
      await adminSupabase
        .from('notifications')
        .insert({
          national_number: nationalNumber,
          title: 'Application Rejected',
          message: `Your application has been rejected. Reason: ${rejectionReason || 'No reason provided'}`,
          status_type: 'error'
        });
    }
    
    return result;
  } catch (error) {
    console.error('Error rejecting application:', error);
    return { success: false };
  }
};
