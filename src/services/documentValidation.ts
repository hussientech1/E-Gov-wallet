/**
 * Document Validation Service
 * 
 * This service provides reusable document validation functionality for the MoI Platform.
 * It checks whether a user already has a valid document before allowing new applications.
 * 
 * Usage:
 * ```typescript
 * import { validateDocumentStatus } from '@/services/documentValidation';
 * 
 * const result = await validateDocumentStatus({
 *   userId: user.nationalNumber,
 *   serviceId: 1, // Passport service
 *   isReplacement: false
 * });
 * 
 * if (!result.canProceed) {
 *   // Show error message and block application
 *   showError(result.errorMessage);
 * }
 * ```
 */

import {
  DocumentValidationParams,
  DocumentValidationResult,
  DocumentStatusResponse,
  SERVICE_TO_DOCUMENT_TYPE,
  DOCUMENT_TYPE_NAMES,
  VALIDATION_ERROR_MESSAGES,
  DocumentValidationError
} from '@/types/documentValidation';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Supabase configuration for Edge Function fallback
const SUPABASE_URL = "https://tzihqfnkuyfgsjpetfzs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aWhxZm5rdXlmZ3NqcGV0ZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzYzNjUsImV4cCI6MjA2MDMxMjM2NX0.aFvEeLvuOJ--JoRITqsKeety96Qcvl46aT1rHL1A7Ko";

// Type alias for cleaner code
type DocumentType = Database['public']['Enums']['document_type'];
type DocumentStatus = Database['public']['Enums']['document_status'];

/**
 * Validates document status using direct database query (primary method)
 *
 * @param params - Validation parameters
 * @returns Promise<DocumentValidationResult> - Validation result
 */
async function validateDocumentStatusDirect(
  params: DocumentValidationParams
): Promise<DocumentValidationResult> {
  const { userId, serviceId, isReplacement = false, replacementReason } = params;

  const documentType = SERVICE_TO_DOCUMENT_TYPE[serviceId] as DocumentType;
  const documentTypeName = DOCUMENT_TYPE_NAMES[documentType];

  try {
    console.log(`[Direct Validation] Checking ${documentTypeName} for user: ${userId}`);

    // Query user_documents table directly
    const { data: documents, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('national_number', userId)
      .eq('doc_type', documentType)
      .eq('document_status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[Direct Validation] Database error:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    // Prepare document status response
    let documentStatus: DocumentStatusResponse;

    if (documents && documents.length > 0) {
      const document = documents[0];
      const currentDate = new Date();
      const expiryDate = document.expiry_date ? new Date(document.expiry_date) : null;
      const isExpired = expiryDate ? expiryDate < currentDate : false;

      documentStatus = {
        exists: true,
        expired: isExpired,
        expiryDate: document.expiry_date,
        documentId: document.doc_id.toString(),
        documentStatus: document.document_status,
        documentNumber: document.doc_number,
        issueDate: document.issue_date
      };

      console.log(`[Direct Validation] Document found: ID ${document.doc_id}, Status: ${document.document_status}, Expired: ${isExpired}`);
    } else {
      documentStatus = {
        exists: false,
        expired: false,
        expiryDate: null,
        documentId: null,
        documentStatus: null,
        documentNumber: null,
        issueDate: null
      };

      console.log('[Direct Validation] No active document found');
    }

    // Process the validation logic
    return processDocumentValidation(documentStatus, documentTypeName, isReplacement, replacementReason);

  } catch (error) {
    console.error('[Direct Validation] Error:', error);
    throw error; // Re-throw to be handled by fallback mechanism
  }
}

/**
 * Validates document status using Edge Function (fallback method)
 *
 * @param params - Validation parameters
 * @returns Promise<DocumentValidationResult> - Validation result
 */
async function validateDocumentStatusEdgeFunction(
  params: DocumentValidationParams
): Promise<DocumentValidationResult> {
  const { userId, serviceId, isReplacement = false, replacementReason } = params;
  const documentTypeName = DOCUMENT_TYPE_NAMES[SERVICE_TO_DOCUMENT_TYPE[serviceId]];

  console.log(`[Edge Function Validation] Checking document for user: ${userId}, service: ${serviceId}`);

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/check_document_status?userId=${encodeURIComponent(userId)}&documentType=${serviceId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error('[Edge Function Validation] Failed:', response.status, response.statusText);
    
    if (response.status >= 500) {
      throw new Error('Server error');
    } else if (response.status >= 400) {
      throw new Error('Invalid request');
    }
    
    throw new Error('API error');
  }

  const documentStatus: DocumentStatusResponse = await response.json();
  console.log('[Edge Function Validation] Response received:', documentStatus);

  return processDocumentValidation(documentStatus, documentTypeName, isReplacement, replacementReason);
}

/**
 * Validates whether a user can proceed with a document application
 * Uses multiple validation strategies with fallback mechanisms
 *
 * @param params - Validation parameters including userId, serviceId, and replacement info
 * @returns Promise<DocumentValidationResult> - Validation result with canProceed flag and messages
 */
export async function validateDocumentStatus(
  params: DocumentValidationParams
): Promise<DocumentValidationResult> {
  const { userId, serviceId, isReplacement = false, replacementReason } = params;

  // Input validation
  if (!userId || userId.trim() === '') {
    return createErrorResult('MISSING_USER_ID');
  }

  if (!serviceId || !SERVICE_TO_DOCUMENT_TYPE[serviceId]) {
    return createErrorResult('INVALID_SERVICE_ID');
  }

  // If this is a replacement request, validate that reason is provided
  if (isReplacement && (!replacementReason || replacementReason.trim() === '')) {
    return createErrorResult('REPLACEMENT_REASON_REQUIRED');
  }

  const documentTypeName = DOCUMENT_TYPE_NAMES[SERVICE_TO_DOCUMENT_TYPE[serviceId]];

  // Strategy 1: Try direct database query (primary method)
  try {
    console.log('[Validation] Attempting direct database query...');
    return await validateDocumentStatusDirect(params);
  } catch (directError) {
    console.warn('[Validation] Direct database query failed:', directError);
    
    // Strategy 2: Try Edge Function (fallback method)
    try {
      console.log('[Validation] Attempting Edge Function fallback...');
      return await validateDocumentStatusEdgeFunction(params);
    } catch (edgeFunctionError) {
      console.warn('[Validation] Edge Function fallback failed:', edgeFunctionError);
      
      // Strategy 3: Allow with warning (graceful degradation)
      console.log('[Validation] Using graceful degradation - allowing application with warning');
      return {
        canProceed: true,
        warningMessage: `Unable to verify existing ${documentTypeName} status. Your application will be processed, but please ensure you don't already have a valid ${documentTypeName}.`,
        errorMessage: undefined
      };
    }
  }
}

/**
 * Processes the document validation logic based on the API response
 */
function processDocumentValidation(
  documentStatus: DocumentStatusResponse,
  documentTypeName: string,
  isReplacement: boolean,
  replacementReason?: string
): DocumentValidationResult {
  
  // Case 1: Document doesn't exist - Allow application
  if (!documentStatus.exists) {
    return {
      canProceed: true,
      warningMessage: `No existing ${documentTypeName} found. You can proceed with your application.`
    };
  }

  // Case 2: Document exists but is expired - Allow application
  if (documentStatus.exists && documentStatus.expired) {
    return {
      canProceed: true,
      warningMessage: `Your previous ${documentTypeName} has expired. You can apply for a new one.`,
      documentInfo: documentStatus.documentId ? {
        documentId: documentStatus.documentId,
        documentNumber: documentStatus.documentNumber || '',
        expiryDate: documentStatus.expiryDate,
        issueDate: documentStatus.issueDate || '',
        status: documentStatus.documentStatus || 'expired'
      } : undefined
    };
  }

  // Case 3: Document exists and is valid, but user wants replacement - Allow with reason
  if (documentStatus.exists && !documentStatus.expired && isReplacement && replacementReason) {
    return {
      canProceed: true,
      isReplacementAllowed: true,
      warningMessage: `Replacement request for existing ${documentTypeName}. Reason: ${replacementReason}`,
      documentInfo: documentStatus.documentId ? {
        documentId: documentStatus.documentId,
        documentNumber: documentStatus.documentNumber || '',
        expiryDate: documentStatus.expiryDate,
        issueDate: documentStatus.issueDate || '',
        status: documentStatus.documentStatus || 'active'
      } : undefined
    };
  }

  // Case 4: Document exists and is valid - Block application
  if (documentStatus.exists && !documentStatus.expired) {
    const expiryInfo = documentStatus.expiryDate 
      ? ` It expires on ${formatDate(documentStatus.expiryDate)}.`
      : '';
    
    return {
      canProceed: false,
      errorMessage: `You already have a valid ${documentTypeName}.${expiryInfo} You cannot apply for this service until it expires or you request a Lost/Damaged replacement.`,
      documentInfo: documentStatus.documentId ? {
        documentId: documentStatus.documentId,
        documentNumber: documentStatus.documentNumber || '',
        expiryDate: documentStatus.expiryDate,
        issueDate: documentStatus.issueDate || '',
        status: documentStatus.documentStatus || 'active'
      } : undefined
    };
  }

  // Fallback case - should not reach here
  return createErrorResult('API_ERROR');
}

/**
 * Creates a standardized error result
 */
function createErrorResult(errorType: DocumentValidationError): DocumentValidationResult {
  return {
    canProceed: false,
    errorMessage: VALIDATION_ERROR_MESSAGES[errorType]()
  };
}

/**
 * Formats a date string for user display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString; // Return original string if parsing fails
  }
}

/**
 * Helper function to get document type name from service ID
 */
export function getDocumentTypeName(serviceId: number): string {
  const documentType = SERVICE_TO_DOCUMENT_TYPE[serviceId];
  return documentType ? DOCUMENT_TYPE_NAMES[documentType] : 'Unknown Document';
}

/**
 * Helper function to validate service ID
 */
export function isValidServiceId(serviceId: number): boolean {
  return serviceId in SERVICE_TO_DOCUMENT_TYPE;
}

/**
 * Helper function to create replacement reason string
 */
export function createReplacementReasonString(type: string, details?: string): string {
  const baseReason = `Replacement request - ${type}`;
  return details ? `${baseReason}: ${details}` : baseReason;
}

/**
 * Example usage and integration guide:
 * 
 * 1. Basic validation (most common use case):
 * ```typescript
 * const result = await validateDocumentStatus({
 *   userId: user.nationalNumber,
 *   serviceId: parseInt(formData.serviceType)
 * });
 * 
 * if (!result.canProceed) {
 *   toast({
 *     title: "Cannot Proceed",
 *     description: result.errorMessage,
 *     variant: "destructive"
 *   });
 *   return;
 * }
 * ```
 * 
 * 2. With replacement handling:
 * ```typescript
 * const result = await validateDocumentStatus({
 *   userId: user.nationalNumber,
 *   serviceId: parseInt(formData.serviceType),
 *   isReplacement: formData.isReplacement,
 *   replacementReason: formData.replacementReason
 * });
 * ```
 * 
 * 3. Integration in form submission:
 * ```typescript
 * const handleSubmit = async (e: React.FormEvent) => {
 *   e.preventDefault();
 *   
 *   // Validate document status first
 *   const validation = await validateDocumentStatus({
 *     userId: user.nationalNumber,
 *     serviceId: parseInt(formData.serviceType),
 *     isReplacement: formData.isReplacement,
 *     replacementReason: formData.replacementReason
 *   });
 *   
 *   if (!validation.canProceed) {
 *     // Show error and stop submission
 *     return;
 *   }
 *   
 *   // Proceed with application submission
 *   await submitApplication();
 * };
 * ```
 */