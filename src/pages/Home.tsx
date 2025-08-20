
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, ExternalLink, Clock, Check, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { DocumentData } from '@/types/document';
import { getDocumentTitle } from '@/components/documents/DocumentCard';
import { Description } from '@radix-ui/react-toast';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch recent documents
        const { data: docsData, error: docsError } = await supabase
          .from('user_documents')
          .select('*')
          .eq('national_number', user.nationalNumber)
          .order('created_at', { ascending: false })
          .limit(2);

        if (docsError) {
          console.error('Error fetching documents:', docsError);
          toast({
            title: t('Error'),
            description: t('Error Fetching Documents'),
            variant: "destructive"
          });
        } else {
          setDocuments(docsData || []);
        }

        // Fetch recent applications
        const { data: appsData, error: appsError } = await supabase
          .from('service_applications')
          .select('*, services(service_name)')
          .eq('national_number', user.nationalNumber)
          .order('submitted_at', { ascending: false })
          .limit(3);

        if (appsError) {
          console.error('Error fetching applications:', appsError);
          toast({
            title: t('Error'),
            description: t('Error Fetching Applications'),
            variant: "destructive"
          });
        } else {
          setApplications(appsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: t('Error'),
          description: t('Something Went Wrong'),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, t]);

  // Status icon mapping
  const statusIcons = {
    Pending: <Clock className="h-4 w-4 text-warning" />,
    Approved: <Check className="h-4 w-4 text-success" />,
    Rejected: <X className="h-4 w-4 text-destructive" />
  };

  // Status badge classes mapping
  const statusBadgeClasses = {
    Pending: 'status-badge-pending',
    Approved: 'status-badge-approved',
    Rejected: 'status-badge-rejected'
  };

  return (
    <AppLayout>
      <PageHeader title={`${t('Welcome to MOI Platform')}, ${user?.fullName || t('user')}`}>
        {t('We Empower Citizens Through Technology')}
      </PageHeader>
      <Description className="text-foreground text-sm">{t('You Can Access Your Documents and Applications Here')}</Description>

      <div className="p-4 space-y-6">
        {/* Quick Access Documents */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">{t('Documents')}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/documents')}
              className="text-primary flex items-center gap-1"
            >
              {t('View All')}
              <ExternalLink size={14} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <Card className="p-4">
                <div className="animate-pulse h-12 bg-muted rounded"></div>
              </Card>
            ) : documents.length > 0 ? (
              documents.map(doc => (
                <Card key={doc.doc_id} className="card-hover cursor-pointer" onClick={() => navigate(`/documents/${doc.doc_id}`)}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{getDocumentTitle(doc.doc_type, t)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.doc_number}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-6">
                <p className="text-muted-foreground">{t('No Documents Found')}</p>
                <Button 
                  className="mt-2" 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/services')}
                >
                  {t('Apply For Document')}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Recent Applications */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">{t('Recent Applications')}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/notifications')}
              className="text-primary flex items-center gap-1"
            >
              {t('View All')}
              <ExternalLink size={14} />
            </Button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <Card className="p-4">
                <div className="animate-pulse h-12 bg-muted rounded"></div>
              </Card>
            ) : applications.length > 0 ? (
              applications.map(app => (
                <Card key={app.application_id} className="card-hover">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{app.services?.service_name}</h3>
                      <span className={statusBadgeClasses[app.application_status as keyof typeof statusBadgeClasses]}>
                        {statusIcons[app.application_status as keyof typeof statusIcons]}
                        {t(app.application_status.toLowerCase())}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('Applied')}: {new Date(app.submitted_at).toLocaleDateString()}
                    </p>
                    {app.application_status === 'Rejected' && app.rejection_reason && (
                      <p className="text-sm text-destructive mt-1">
                        {t('Reason')}: {app.rejection_reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">{t('No Applications Found')}</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Apply Button */}
        <div className="mt-8">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/services')}
          >
            {t('Apply For Service')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Home;
