export interface UploadedDocument {
  document_type: string;
  file_name: string;
  file_data: string; // base64 encoded file data
  file_size: number;
  mime_type: string;
  upload_status: 'pending' | 'verified' | 'rejected';
}

export interface DocumentUploadState {
  [documentType: string]: UploadedDocument | null;
}

export interface RequiredDocumentInfo {
  type: string;
  label: string;
  description?: string;
  acceptedTypes: string[];
  maxSize: number; // in bytes
  required: boolean;
}

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
}

export interface DocumentUploadProps {
  documentType: string;
  label: string;
  description?: string;
  acceptedTypes?: string[];
  maxSize?: number;
  onDocumentChange: (document: UploadedDocument | null) => void;
  initialDocument?: UploadedDocument | null;
  required?: boolean;
}

export interface RequiredDocumentsProps {
  serviceId: string;
  requiredDocuments: string[];
  onDocumentsChange: (documents: DocumentUploadState) => void;
  documents: DocumentUploadState;
}