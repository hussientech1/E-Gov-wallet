
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { adminSupabase } from '@/integrations/supabase/admin-client';
import { 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Info, 
  AlertTriangle, 
  XCircle 
} from 'lucide-react';

interface Notification {
  notification_id: number;
  title: string;
  message: string;
  created_at: string;
  status_type: 'info' | 'success' | 'warning' | 'error';
  national_number: string | null;
}

const AdminNotifications: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [targetUser, setTargetUser] = useState('');
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  useEffect(() => {
    fetchNotificationHistory();
  }, []);

  const fetchNotificationHistory = async () => {
    setFetchingHistory(true);
    try {
      // Fetch most recent notifications (limit to 50)
      const { data, error } = await adminSupabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotificationHistory(data || []);
    } catch (error) {
      console.error('Error fetching notification history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification history",
        variant: "destructive"
      });
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleRefresh = () => {
    fetchNotificationHistory();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      if (isBroadcast) {
        // In a real implementation, we would fetch all users and send to each
        // For now, just show a success message
        toast({
          title: "Success",
          description: "Broadcast notification feature is not yet implemented"
        });
      } else {
        if (!targetUser) {
          toast({
            title: "Error",
            description: "Please enter a target user",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Check if user exists
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('national_number')
          .eq('national_number', targetUser)
          .single();
          
        if (userError || !userData) {
          toast({
            title: "Error",
            description: "User not found",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        
        // Send notification to specific user
        const { error } = await adminSupabase.from('notifications').insert({
          national_number: targetUser,
          title,
          message,
          status_type: notificationType
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Notification sent successfully"
        });
        
        // Reset form
        setTitle('');
        setMessage('');
        setNotificationType('info');
        
        // Refresh notification history
        fetchNotificationHistory();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <Check className="h-4 w-4 text-success" />;
      case 'info': return <Info className="h-4 w-4 text-info" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Info className="h-4 w-4 text-info" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Notification Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
            <CardDescription>
              Create and send notifications to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notification-type">Notification Type</Label>
                <Select
                  value={notificationType}
                  onValueChange={(value) => setNotificationType(value as any)}
                >
                  <SelectTrigger id="notification-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Information</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Notification title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                  required
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-broadcast"
                    checked={isBroadcast}
                    onChange={() => setIsBroadcast(!isBroadcast)}
                    className="rounded"
                  />
                  <Label htmlFor="is-broadcast">Send to all users</Label>
                </div>
              </div>
              
              {!isBroadcast && (
                <div className="space-y-2">
                  <Label htmlFor="target-user">Target User (National Number)</Label>
                  <Input
                    id="target-user"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="Enter national number"
                  />
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Notification"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View recent notifications sent to users
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={fetchingHistory}
              className="ml-auto flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${fetchingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {fetchingHistory ? (
              <div className="py-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading notifications...</p>
              </div>
            ) : notificationHistory.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                No notifications have been sent yet
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {notificationHistory.map((notification) => (
                  <div 
                    key={notification.notification_id} 
                    className="p-3 border rounded-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notification.status_type)}
                        <span className="font-medium">{notification.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    <p className="mt-1 text-sm">{notification.message}</p>
                    {notification.national_number && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        To: {notification.national_number}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
