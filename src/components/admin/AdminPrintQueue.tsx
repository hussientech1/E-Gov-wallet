import React, { useState, useEffect, useCallback, useReducer } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Printer, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Clock,
  MapPin,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import { adminSupabase } from '@/integrations/supabase/admin-client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PrintQueueItem, 
  PrintQueueState, 
  PrintQueueAction,
  PrintQueueFilters,
  PrintQueueSort,
  BulkPrintSelection,
  SERVICE_TYPE_DISPLAY,
  PRINT_STATUS_DISPLAY,
  OFFICE_LOCATIONS
} from '@/types/printQueue';

// Initial state for the print queue
const initialState: PrintQueueState = {
  items: [],
  loading: true,
  error: null,
  filters: {
    status: 'all',
    service_type: '',
    office_location: '',
    search_term: ''
  },
  sort: {
    field: 'approval_date',
    order: 'desc'
  },
  selection: {
    selected_items: [],
    select_all: false,
    total_selected: 0
  },
  stats: null,
  connected: false
};

// Reducer for managing print queue state
const printQueueReducer = (state: PrintQueueState, action: PrintQueueAction): PrintQueueState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD_ITEM':
      return { ...state, items: [action.payload, ...state.items] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.queue_id === action.payload.queue_id
            ? { ...item, ...action.payload.updates }
            : item
        )
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.queue_id !== action.payload)
      };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'SET_SELECTION':
      return { ...state, selection: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'RESET_SELECTION':
      return {
        ...state,
        selection: {
          selected_items: [],
          select_all: false,
          total_selected: 0
        }
      };
    default:
      return state;
  }
};

const AdminPrintQueue: React.FC = () => {
  const [state, dispatch] = useReducer(printQueueReducer, initialState);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch print queue data
  const fetchPrintQueue = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      let query = adminSupabase
        .from('print_queue')
        .select(`
          *,
          service_applications!inner(invoice_number),
          services!inner(service_name, description)
        `);

      // Apply filters
      if (state.filters.status && state.filters.status !== 'all') {
        query = query.eq('print_status', state.filters.status);
      }

      if (state.filters.service_type) {
        query = query.eq('service_type', state.filters.service_type);
      }

      if (state.filters.office_location) {
        query = query.eq('office_location', state.filters.office_location);
      }

      if (state.filters.search_term) {
        query = query.or(`user_full_name.ilike.%${state.filters.search_term}%,national_number.ilike.%${state.filters.search_term}%`);
      }

      // Apply sorting
      query = query.order(state.sort.field, { ascending: state.sort.order === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching print queue:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch print queue data' });
        toast({
          title: "Error",
          description: "Failed to fetch print queue data.",
          variant: "destructive",
        });
      } else {
        const enhancedItems: PrintQueueItem[] = (data || []).map(item => ({
          ...item,
          time_in_queue: calculateTimeInQueue(item.approval_date),
          priority_level: determinePriorityLevel(item),
          can_print: item.print_status === 'pending_print'
        }));

        dispatch({ type: 'SET_ITEMS', payload: enhancedItems });
      }
    } catch (error) {
      console.error('Error fetching print queue:', error);
      dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' });
    }
  }, [state.filters, state.sort]);

  // Calculate time in queue
  const calculateTimeInQueue = (approvalDate: string | null): string => {
    if (!approvalDate) return 'Unknown';
    
    const now = new Date();
    const approved = new Date(approvalDate);
    const diffMs = now.getTime() - approved.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'Less than 1 hour';
    }
  };

  // Determine priority level based on time in queue and service type
  const determinePriorityLevel = (item: PrintQueueItem): 'normal' | 'high' | 'urgent' => {
    if (!item.approval_date) return 'normal';
    
    const hoursInQueue = (new Date().getTime() - new Date(item.approval_date).getTime()) / (1000 * 60 * 60);
    
    if (hoursInQueue > 48) return 'urgent';
    if (hoursInQueue > 24) return 'high';
    return 'normal';
  };

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    const channel = adminSupabase
      .channel('print_queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'print_queue'
        },
        (payload) => {
          console.log('Print queue change detected:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              const newItem: PrintQueueItem = {
                ...payload.new as PrintQueueItem,
                time_in_queue: calculateTimeInQueue(payload.new.approval_date),
                priority_level: determinePriorityLevel(payload.new as PrintQueueItem),
                can_print: payload.new.print_status === 'pending_print'
              };
              dispatch({ type: 'ADD_ITEM', payload: newItem });
              toast({
                title: "New Print Job",
                description: `${payload.new.service_type} for ${payload.new.user_full_name} added to queue.`,
              });
              break;
              
            case 'UPDATE':
              dispatch({
                type: 'UPDATE_ITEM',
                payload: {
                  queue_id: payload.new.queue_id,
                  updates: {
                    ...payload.new as PrintQueueItem,
                    time_in_queue: calculateTimeInQueue(payload.new.approval_date),
                    priority_level: determinePriorityLevel(payload.new as PrintQueueItem),
                    can_print: payload.new.print_status === 'pending_print'
                  }
                }
              });
              break;
              
            case 'DELETE':
              dispatch({ type: 'REMOVE_ITEM', payload: payload.old.queue_id });
              break;
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          dispatch({ type: 'SET_CONNECTED', payload: true });
          console.log('Connected to print queue real-time updates');
        } else if (status === 'CLOSED') {
          dispatch({ type: 'SET_CONNECTED', payload: false });
          console.log('Disconnected from print queue real-time updates');
        }
      });

    return () => {
      adminSupabase.removeChannel(channel);
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPrintQueue();
  }, [fetchPrintQueue]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrintQueue();
    setRefreshing(false);
  };

  // Handle individual print
  const handlePrint = async (queueId: number) => {
    if (!user) return;

    try {
      const { error } = await adminSupabase
        .from('print_queue')
        .update({
          print_status: 'printed',
          printed_at: new Date().toISOString(),
          printed_by: user.nationalNumber
        })
        .eq('queue_id', queueId);

      if (error) {
        console.error('Error updating print status:', error);
        toast({
          title: "Error",
          description: "Failed to update print status.",
          variant: "destructive",
        });
      } else {
        // Find the item to send notification
        const item = state.items.find(i => i.queue_id === queueId);
        if (item) {
          await sendPrintNotification(item);
        }
        
        toast({
          title: "Success",
          description: "Document marked as printed successfully.",
        });
      }
    } catch (error) {
      console.error('Error printing document:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Send notification to user when document is printed
  const sendPrintNotification = useCallback(async (item: PrintQueueItem) => {
    try {
      await adminSupabase
        .from('notifications')
        .insert({
          national_number: item.national_number,
          title: 'Document Ready for Collection',
          message: `Your ${item.service_type} document is ready for collection at ${item.office_location}. Please bring your national ID for verification.`,
          status_type: 'info'
        });
    } catch (error) {
      console.error('Error sending print notification:', error);
    }
  }, []);

  // Handle bulk print
  const handleBulkPrint = async () => {
    if (!user || state.selection.selected_items.length === 0) return;

    try {
      const { error } = await adminSupabase
        .from('print_queue')
        .update({
          print_status: 'printed',
          printed_at: new Date().toISOString(),
          printed_by: user.nationalNumber
        })
        .in('queue_id', state.selection.selected_items);

      if (error) {
        console.error('Error bulk printing:', error);
        toast({
          title: "Error",
          description: "Failed to print selected documents.",
          variant: "destructive",
        });
      } else {
        // Send notifications for all printed items
        const printedItems = state.items.filter(item => 
          state.selection.selected_items.includes(item.queue_id)
        );
        
        for (const item of printedItems) {
          await sendPrintNotification(item);
        }

        dispatch({ type: 'RESET_SELECTION' });
        toast({
          title: "Success",
          description: `${state.selection.selected_items.length} documents marked as printed.`,
        });
      }
    } catch (error) {
      console.error('Error bulk printing:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during bulk print.",
        variant: "destructive",
      });
    }
  };

  // Handle selection changes
  const handleSelectItem = (queueId: number, checked: boolean) => {
    const newSelection = { ...state.selection };
    
    if (checked) {
      newSelection.selected_items.push(queueId);
    } else {
      newSelection.selected_items = newSelection.selected_items.filter(id => id !== queueId);
      newSelection.select_all = false;
    }
    
    newSelection.total_selected = newSelection.selected_items.length;
    dispatch({ type: 'SET_SELECTION', payload: newSelection });
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    const printableItems = state.items.filter(item => item.can_print);
    const newSelection: BulkPrintSelection = {
      select_all: checked,
      selected_items: checked ? printableItems.map(item => item.queue_id) : [],
      total_selected: checked ? printableItems.length : 0
    };
    
    dispatch({ type: 'SET_SELECTION', payload: newSelection });
  };

  // Filter and sort items for display
  const displayItems = state.items;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Print Queue</h2>
          <p className="text-muted-foreground">
            Manage approved documents ready for printing
            {state.connected && (
              <Badge variant="outline" className="ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Live
              </Badge>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={refreshing || state.loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Print</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.items.filter(item => item.print_status === 'pending_print').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Printed Today</CardTitle>
            <Printer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.items.filter(item => 
                item.print_status === 'printed' && 
                item.printed_at && 
                new Date(item.printed_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{state.selection.total_selected}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {state.items.filter(item => 
                item.priority_level === 'high' || item.priority_level === 'urgent'
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Filters and Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search by name or national number..."
                value={state.filters.search_term || ''}
                onChange={(e) => dispatch({
                  type: 'SET_FILTERS',
                  payload: { ...state.filters, search_term: e.target.value }
                })}
                className="w-64"
              />
            </div>
            
            <Select
              value={state.filters.status || 'all'}
              onValueChange={(value) => dispatch({
                type: 'SET_FILTERS',
                payload: { ...state.filters, status: value as any }
              })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_print">Pending Print</SelectItem>
                <SelectItem value="printed">Printed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={state.filters.service_type || ''}
              onValueChange={(value) => dispatch({
                type: 'SET_FILTERS',
                payload: { ...state.filters, service_type: value }
              })}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Services</SelectItem>
                {Object.entries(SERVICE_TYPE_DISPLAY).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {state.selection.total_selected > 0 && (
              <Button onClick={handleBulkPrint} className="ml-auto">
                <Printer className="h-4 w-4 mr-2" />
                Print Selected ({state.selection.total_selected})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Print Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Print Queue ({displayItems.length} items)</CardTitle>
          <CardDescription>
            Documents approved and ready for printing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.loading ? (
            <div className="text-center py-10">Loading print queue...</div>
          ) : state.error ? (
            <div className="text-center py-10 text-red-500">{state.error}</div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No items in print queue
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={state.selection.select_all}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Request ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Time in Queue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayItems.map((item) => (
                  <TableRow key={item.queue_id}>
                    <TableCell>
                      <Checkbox
                        checked={state.selection.selected_items.includes(item.queue_id)}
                        onCheckedChange={(checked) => handleSelectItem(item.queue_id, checked as boolean)}
                        disabled={!item.can_print}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      #{item.application_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.user_full_name}</p>
                        <p className="text-sm text-muted-foreground">{item.national_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {item.service_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{item.office_location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.approval_date ? new Date(item.approval_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span className="text-sm">{item.time_in_queue}</span>
                        {item.priority_level === 'urgent' && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                        {item.priority_level === 'high' && (
                          <Badge variant="secondary" className="text-xs">High</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.print_status === 'printed' ? 'default' : 'secondary'}
                        className={item.print_status === 'printed' ? 'bg-green-600' : ''}
                      >
                        {PRINT_STATUS_DISPLAY[item.print_status || 'pending_print']?.label || item.print_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.can_print ? (
                        <Button
                          size="sm"
                          onClick={() => handlePrint(item.queue_id)}
                          className="flex items-center gap-1"
                        >
                          <Printer className="h-3 w-3" />
                          Print
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item.printed_at ? `Printed ${new Date(item.printed_at).toLocaleDateString()}` : 'Printed'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrintQueue;