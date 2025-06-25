
export interface DocumentData {
  doc_id: number;
  national_number: string;
  doc_type: string;
  doc_number: string;
  issue_date: string;
  expiry_date: string | null;
  document_status: string;
  qr_code: string | null;
  created_at: string;
  personal_info?: {
    fullName: string;
    nationality: string;
    dateOfBirth: string;
    placeOfBirth: string;
    gender: string;
    address: string;
    profile_picture?: string | null;
  };
  issueAuthority?: string;
  passportType?: string;
}

// Add a Document type alias for backward compatibility
export type Document = DocumentData;
