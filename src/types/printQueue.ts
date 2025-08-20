import { Tables } from '@/integrations/supabase/types';

// Base print queue type from database
export type PrintQueueRow = Tables<'print_queue'>;

// Enhanced print queue interface with additional computed fields
export interface PrintQueueItem extends PrintQueueRow {
  // Computed fields for UI display
  time_in_queue?: string;
  priority_level?: 'normal' | 'high' | 'urgent';
  can_print?: boolean;
}

// Print queue filters interface
export interface PrintQueueFilters {
  status?: 'all' | 'pending_print' | 'printed';
  service_type?: string;
  office_location?: string;
  date_range?: {
    start: string;
    end: string;
  };
  search_term?: string;
}

// Print queue sorting options
export type PrintQueueSortField = 
  | 'approval_date' 
  | 'user_full_name' 
  | 'service_type' 
  | 'office_location'
  | 'print_status';

export type PrintQueueSortOrder = 'asc' | 'desc';

export interface PrintQueueSort {
  field: PrintQueueSortField;
  order: PrintQueueSortOrder;
}

// Bulk print selection interface
export interface BulkPrintSelection {
  selected_items: number[]; // queue_ids
  select_all: boolean;
  total_selected: number;
}

// Print operation result
export interface PrintOperationResult {
  success: boolean;
  printed_count: number;
  failed_count: number;
  errors?: string[];
  printed_items?: number[]; // queue_ids that were successfully printed
}

// Print queue statistics
export interface PrintQueueStats {
  total_pending: number;
  total_printed_today: number;
  total_printed_this_week: number;
  by_service_type: {
    [service_type: string]: {
      pending: number;
      printed_today: number;
    };
  };
  by_office: {
    [office: string]: {
      pending: number;
      printed_today: number;
    };
  };
  average_processing_time?: number; // in minutes
}

// WebSocket event types for real-time updates
export interface PrintQueueWebSocketEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'print_queue';
  record: PrintQueueRow;
  old_record?: PrintQueueRow;
}

// Print queue context state
export interface PrintQueueState {
  items: PrintQueueItem[];
  loading: boolean;
  error: string | null;
  filters: PrintQueueFilters;
  sort: PrintQueueSort;
  selection: BulkPrintSelection;
  stats: PrintQueueStats | null;
  connected: boolean; // WebSocket connection status
}

// Print queue actions
export type PrintQueueAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ITEMS'; payload: PrintQueueItem[] }
  | { type: 'ADD_ITEM'; payload: PrintQueueItem }
  | { type: 'UPDATE_ITEM'; payload: { queue_id: number; updates: Partial<PrintQueueItem> } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'SET_FILTERS'; payload: PrintQueueFilters }
  | { type: 'SET_SORT'; payload: PrintQueueSort }
  | { type: 'SET_SELECTION'; payload: BulkPrintSelection }
  | { type: 'SET_STATS'; payload: PrintQueueStats }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'RESET_SELECTION' };

// Print notification payload
export interface PrintNotificationPayload {
  national_number: string;
  user_full_name: string;
  service_type: string;
  office_location: string;
  document_number?: string;
}

// Service type mapping for display
export const SERVICE_TYPE_DISPLAY: Record<string, string> = {
  'Passport': 'Passport',
  'National ID': 'National ID',
  'Birth Certificate': 'Birth Certificate',
  'Driver License': 'Driver License',
  'Marriage Certificate': 'Marriage Certificate',
  'Death Certificate': 'Death Certificate'
};

// Print status display mapping
export const PRINT_STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  'pending_print': { label: 'Pending Print', color: 'orange' },
  'printed': { label: 'Printed', color: 'green' }
};

// Office locations (this could be fetched from database in the future)
export const OFFICE_LOCATIONS = [
  'Khartoum Main Office',
  'Khartoum North Branch',
  'Omdurman Branch',
  'Bahri Branch',
  'Kassala Branch',
  'Port Sudan Branch',
  'Nyala Branch',
  'El Obeid Branch'
];