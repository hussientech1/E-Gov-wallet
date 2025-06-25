
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminApplications from '@/components/admin/AdminApplications';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminDocuments from '@/components/admin/AdminDocuments';
import AdminNotifications from '@/components/admin/AdminNotifications';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminLogs from '@/components/admin/AdminLogs';
import { adminSupabase } from '@/integrations/supabase/admin-client';

// Helper function to log admin actions
export const logAdminAction = async (adminUsername: string, action: string) => {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    
    await adminSupabase.from('admin_logs').insert({
      admin_username: adminUsername,
      action: action,
      ip_address: ipData.ip || '127.0.0.1'
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Non-critical error, so we don't throw and break the app flow
  }
};

const Admin: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/admin-login');
      return;
    }

    // Check if the user is an admin (using isAdmin flag)
    if (!user.isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Log successful admin access using the user's username as identifier
    logAdminAction(user.nationalNumber, 'Accessed admin panel');
    setLoading(false);
  }, [isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading administrative panel...</div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 mx-auto max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">E-Gov Administrative Panel</CardTitle>
          <CardDescription>
            Manage services, users, documents, and system settings
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AdminDashboard />
        </TabsContent>
        
        <TabsContent value="applications">
          <AdminApplications />
        </TabsContent>
        
        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>
        
        <TabsContent value="documents">
          <AdminDocuments />
        </TabsContent>
        
        <TabsContent value="notifications">
          <AdminNotifications />
        </TabsContent>
        
        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>
        
        <TabsContent value="logs">
          <AdminLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
