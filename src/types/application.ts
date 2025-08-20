
export interface ServiceApplication {
  application_id: number;
  national_number: string;
  service_id: number;
  submitted_at: string;
  application_status: string;
  invoice_number: string;
  office_location: string;
  emergency_reason: string | null;
  rejection_reason: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  payment_status?: string | null;
}

// Enhanced application interface with user details for admin view
export interface EnhancedServiceApplication extends ServiceApplication {
  // User information
  user_full_name: string;
  user_phone_number: string;
  user_email?: string | null;
  user_address?: string | null;
  user_state?: string | null;
  user_gender?: string | null;
  user_birth_date?: string | null;
  
  // Service information
  service_name: string;
  service_description?: string | null;
  service_fee?: number | null;
  service_processing_time?: string | null;
  
  // Additional metadata
  is_emergency: boolean;
  has_documents?: boolean;
  document_count?: number;
  
  // Document status information
  pending_documents?: number;
  verified_documents?: number;
  rejected_documents?: number;
}

// Request details view state
export interface RequestViewState {
  [applicationId: number]: boolean;
}

// Document attachment interface (for future use)
export interface ApplicationDocument {
  document_id: string;
  application_id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  file_url: string;
  uploaded_at: string;
  mime_type: string;
}
