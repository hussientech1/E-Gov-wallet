
import { adminSupabase } from '@/integrations/supabase/admin-client';
import { logAdminAction } from '@/pages/Admin';

export const updateApplicationStatus = async (
  applicationId: number,
  status: 'Approved' | 'Rejected' | 'Pending',
  adminUsername: string,
  rejectionReason?: string
) => {
  try {
    const updateData: any = {
      application_status: status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminUsername
    };
    
    if (status === 'Rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }
    
    const { error } = await adminSupabase
      .from('service_applications')
      .update(updateData)
      .eq('application_id', applicationId);
      
    if (error) throw error;
    
    // Log the action
    await logAdminAction(
      adminUsername, 
      `${status} application #${applicationId}${rejectionReason ? ': ' + rejectionReason : ''}`
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error updating application status:', error);
    return { success: false, error };
  }
};
