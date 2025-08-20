/**
 * Document Validation Types
 * 
 * This file contains TypeScript interfaces and types for the document validation system.
 * These types ensure type safety across the document validation flow.
 */

import { Database } from '@/integrations/supabase/types';

// Document type from database enum
export type DocumentType = Database['public']['Enums']['document_type'];

// Document status from database enum
export type DocumentStatus = Database['public']['Enums']['document_status'];

// Service ID to Document Type mapping
export const SERVICE_TO_DOCUMENT_TYPE: Record<number, DocumentType> = {
  1: 'passport',
  2: 'national_id', 
  3: 'birth_certificate',
  4: 'driver_license'
} as const;

// Document Type to Service ID mapping (reverse lookup)
export const DOCUMENT_TYPE_TO_SERVICE: Record<DocumentType, number> = {
  'passport': 1,
  'national_id': 2,
  'birth_certificate': 3,
  'driver_license': 4
} as const;

// Document names for user-friendly messages
export const DOCUMENT_TYPE_NAMES: Record<DocumentType, string> = {
  'passport': 'Passport',
  'national_id': 'National ID',
  'birth_certificate': 'Birth Certificate',
  'driver_license': 'Driver License'
} as const;

/**
 * Response from the document status check API/RPC function
 */
export interface DocumentStatusResponse {
  /** Whether the document exists in the system */
  exists: boolean;
  /** Whether the document is expired (only relevant if exists = true) */
  expired: boolean;
  /** Document expiry date in ISO format (YYYY-MM-DD) */
  expiryDate: string | null;
  /** Unique document ID from the database */
  documentId: string | null;
  /** Current document status */
  documentStatus: DocumentStatus | null;
  /** Document number */
  documentNumber: string | null;
  /** Issue date in ISO format (YYYY-MM-DD) */
  issueDate: string | null;
}

/**
 * Parameters for document validation function
 */
export interface DocumentValidationParams {
  /** User's national number */
  userId: string;
  /** Service ID (1-4) that maps to document type */
  serviceId: number;
  /** Whether this is a Lost/Damaged replacement request */
  isReplacement?: boolean;
  /** Reason for replacement (required if isReplacement = true) */
  replacementReason?: string;
}

/**
 * Result of document validation
 */
export interface DocumentValidationResult {
  /** Whether the user can proceed with the application */
  canProceed: boolean;
  /** Error message to display to user (if canProceed = false) */
  errorMessage?: string;
  /** Warning message to display (non-blocking) */
  warningMessage?: string;
  /** Document information (if exists) */
  documentInfo?: {
    documentId: string;
    documentNumber: string;
    expiryDate: string | null;
    issueDate: string;
    status: DocumentStatus;
  };
  /** Whether this validation passed due to replacement request */
  isReplacementAllowed?: boolean;
}

/**
 * Replacement reason types
 */
export type ReplacementReasonType = 'lost' | 'damaged' | 'stolen';

/**
 * Replacement reason details
 */
export interface ReplacementReason {
  /** Type of replacement */
  type: ReplacementReasonType;
  /** Additional details provided by user */
  details?: string;
  /** Combined reason string for storage */
  fullReason: string;
}

/**
 * Replacement reason options for UI
 */
export const REPLACEMENT_REASON_OPTIONS: Array<{
  value: ReplacementReasonType;
  label: string;
  description: string;
}> = [
  {
    value: 'lost',
    label: 'Lost Document',
    description: 'I have lost my document and need a replacement'
  },
  {
    value: 'damaged',
    label: 'Damaged Document', 
    description: 'My document is damaged and needs to be replaced'
  },
  {
    value: 'stolen',
    label: 'Stolen Document',
    description: 'My document was stolen and I need a replacement'
  }
] as const;

/**
 * Document validation error types
 */
export type DocumentValidationError =
  | 'DOCUMENT_EXISTS_VALID'
  | 'NETWORK_ERROR'
  | 'INVALID_SERVICE_ID'
  | 'MISSING_USER_ID'
  | 'API_ERROR'
  | 'REPLACEMENT_REASON_REQUIRED'
  | 'VALIDATION_UNAVAILABLE';

/**
 * Error messages for different validation scenarios
 */
export const VALIDATION_ERROR_MESSAGES: Record<DocumentValidationError, (documentType?: string) => string> = {
  DOCUMENT_EXISTS_VALID: (documentType = 'document') =>
    `You already have a valid ${documentType}. You cannot apply for this service until it expires or you request a Lost/Damaged replacement.`,
  NETWORK_ERROR: () =>
    'Unable to verify document status due to connectivity issues. The system will attempt alternative validation methods.',
  INVALID_SERVICE_ID: () =>
    'Invalid service selected. Please refresh the page and try again.',
  MISSING_USER_ID: () =>
    'User information is missing. Please log out and log back in.',
  API_ERROR: () =>
    'Unable to verify document status using standard methods. Your application will be processed with manual verification.',
  REPLACEMENT_REASON_REQUIRED: () =>
    'Please provide a reason for the replacement request.',
  VALIDATION_UNAVAILABLE: (documentType = 'document') =>
    `Document validation services are temporarily unavailable. Your ${documentType} application will be processed with manual verification.`
} as const;