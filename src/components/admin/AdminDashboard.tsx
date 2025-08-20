
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { adminSupabase, AdminLog } from '@/integrations/supabase/admin-client';
import { UserIcon, FileTextIcon, CheckCircleIcon, XCircleIcon, ActivityIcon, PrinterIcon } from 'lucide-react';

interface StatsData {
  userCount: number;
  pendingRequests: number;
  approvedApplications: number;
  rejectedApplications: number;
  documentCount: number;
  pendingPrintCount: number;
}

interface ActivityLog {
  id: number;
  action: string;
  user: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsData>({
    userCount: 0,
    pendingRequests: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    documentCount: 0,
    pendingPrintCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch user count
        const { count: userCount, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        // Fetch pending service applications
        const { count: pendingCount, error: pendingError } = await supabase
          .from('service_applications')
          .select('*', { count: 'exact', head: true })
          .eq('application_status', 'Pending');

        // Fetch approved applications
        const { count: approvedCount, error: approvedError } = await supabase
          .from('service_applications')
          .select('*', { count: 'exact', head: true })
          .eq('application_status', 'Approved');

        // Fetch rejected applications
        const { count: rejectedCount, error: rejectedError } = await supabase
          .from('service_applications')
          .select('*', { count: 'exact', head: true })
          .eq('application_status', 'Rejected');

        // Fetch document count
        const { count: docCount, error: docError } = await supabase
          .from('user_documents')
          .select('*', { count: 'exact', head: true });
          
        // Fetch pending print queue count
        const { count: pendingPrintCount, error: printError } = await adminSupabase
          .from('print_queue')
          .select('*', { count: 'exact', head: true })
          .eq('print_status', 'pending_print');
          
        // Fetch recent admin activity logs
        const { data: logData, error: logError } = await adminSupabase
          .from('admin_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (logData) {
          const formattedLogs: ActivityLog[] = logData.map((log: AdminLog, index) => ({
            id: index,
            action: log.action,
            user: log.admin_username || 'Unknown',
            timestamp: new Date(log.created_at).toLocaleString(),
          }));
          setRecentActivity(formattedLogs);
        } else {
          // If no admin_logs table exists yet or no data, use placeholder data
          setRecentActivity([
            { id: 1, action: 'System initialized', user: 'System', timestamp: new Date().toLocaleString() }
          ]);
        }

        setStats({
          userCount: userCount || 0,
          pendingRequests: pendingCount || 0,
          approvedApplications: approvedCount || 0,
          rejectedApplications: rejectedCount || 0,
          documentCount: docCount || 0,
          pendingPrintCount: pendingPrintCount || 0,
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard Overview</h2>
      
      {loading ? (
        <div className="text-center py-10">Loading dashboard data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Registered Users"
              value={stats.userCount}
              icon={<UserIcon className="h-8 w-8 text-blue-500" />}
              description="Total registered users"
            />
            <StatCard
              title="Pending Requests"
              value={stats.pendingRequests}
              icon={<FileTextIcon className="h-8 w-8 text-amber-500" />}
              description="Service applications awaiting review"
            />
            <StatCard
              title="Documents Issued"
              value={stats.documentCount}
              icon={<FileTextIcon className="h-8 w-8 text-green-500" />}
              description="Total documents in system"
            />
            <StatCard
              title="Pending Print"
              value={stats.pendingPrintCount}
              icon={<PrinterIcon className="h-8 w-8 text-blue-500" />}
              description="Documents awaiting printing"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard 
              title="Approved Applications" 
              value={stats.approvedApplications}
              icon={<CheckCircleIcon className="h-8 w-8 text-green-500" />}
              description="Successfully processed applications" 
            />
            <StatCard 
              title="Rejected Applications" 
              value={stats.rejectedApplications}
              icon={<XCircleIcon className="h-8 w-8 text-red-500" />}
              description="Applications denied" 
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-6 w-6" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-4 border-b pb-3">
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>By: {activity.user}</span>
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">No recent activity</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">Showing last 5 activities</p>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}> = ({ title, value, icon, description }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
