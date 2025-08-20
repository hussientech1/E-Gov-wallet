
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, Check, X, BellRing, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LocationState {
  message?: string;
  applicationId?: string;
}

interface Notification {
  notification_id: number;
  title: string;
  message: string;
  status_type: string | null;
  created_at: string;
  is_read: boolean;
}

const Notifications: React.FC = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const state = location.state as LocationState;
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.nationalNumber) {
      fetchNotifications();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user?.nationalNumber) return;
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('national_number', user.nationalNumber)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'Warning':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'Success':
        return <Check className="h-5 w-5 text-success" />;
      case 'Error':
        return <X className="h-5 w-5 text-destructive" />;
      default:
        return <BellRing className="h-5 w-5 text-primary" />;
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AppLayout>
      <PageHeader title={t('Notifications')} />

      <div className="p-4 space-y-6">
        {/* Success message for new application */}
        {state?.message && (
          <Alert className="bg-success/10 border-success/30">
            <Check className="h-4 w-4 text-success" />
            <AlertDescription className="text-success-foreground">
              {state.message}
              {state.applicationId && (
                <p className="mt-1 font-medium">Application ID: {state.applicationId}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Notifications List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
              <Card key={notification.notification_id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                      {getStatusIcon(notification.status_type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{notification.title}</h3>
                        <Badge variant={
                          notification.status_type === 'warning' ? 'outline' : 
                          notification.status_type === 'success' ? 'default' : 
                          notification.status_type === 'error' ? 'destructive' : 
                          'secondary'
                        }>
                          {notification.status_type || 'info'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mt-1">{notification.message}</p>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10">
              <BellRing className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">{t('No Notifications')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('No Notifications Description')}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
