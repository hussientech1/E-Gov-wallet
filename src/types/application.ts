
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
}
