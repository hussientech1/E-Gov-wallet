
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { ServiceApplicationDialog } from '@/components/services/ServiceApplicationDialog';

interface Service {
  id: string;
  name: string;
  description: string;
  isAvailable: boolean;
  fee: number;
  processingTime: string;
}

const Services: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Check if user exists in database before allowing submission
  const [userVerified, setUserVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  useEffect(() => {
    const verifyUserExists = async () => {
      if (!user?.nationalNumber) {
        setUserVerified(false);
        return;
      }

      setVerifying(true);
      try {
        const { data, error, count } = await supabase
          .from('users')
          .select('national_number', { count: 'exact' })
          .eq('national_number', user.nationalNumber)
          .limit(1);
        
        if (error) throw error;
        setUserVerified(count !== null && count > 0);
      } catch (error) {
        console.error('Error verifying user:', error);
        setUserVerified(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyUserExists();
  }, [user?.nationalNumber]);

  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*');
        
        if (error) throw error;
        
        if (data) {
          const formattedServices = data.map(service => ({
            id: service.service_id.toString(),
            name: service.service_name,
            description: service.description || '',
            isAvailable: service.is_active || false,
            fee: service.fee || 0,
            processingTime: service.processing_time || ''
          }));
          setServices(formattedServices);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          title: "Error",
          description: "Failed to load services. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleApplyForService = (service: Service) => {
    if (!userVerified) {
      toast({
        title: "Error",
        description: "User verification failed. Please ensure your account is properly set up.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  // Display user verification message if needed
  if (userVerified === false && !verifying) {
    return (
      <AppLayout>
        <PageHeader title={t('services')} showBack />
        <div className="p-4">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-destructive">{t('accountError')}</CardTitle>
              <CardDescription>
                Your account information is not properly set up in our system. 
                Please contact support to resolve this issue before applying for services.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title={t('services')} showBack />

      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">{t('availableServices')}</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Loading skeletons
            Array(6).fill(0).map((_, i) => (
              <Card key={i} className="border-border/50 shadow-sm">
                <CardHeader className="animate-pulse">
                  <div className="h-6 bg-secondary rounded mb-2 w-3/4"></div>
                  <div className="h-4 bg-secondary rounded w-1/2"></div>
                </CardHeader>
                <CardContent className="animate-pulse">
                  <div className="h-3 bg-secondary rounded mb-2 w-full"></div>
                  <div className="h-3 bg-secondary rounded mb-2 w-5/6"></div>
                  <div className="h-3 bg-secondary rounded mb-2 w-4/6"></div>
                </CardContent>
                <CardFooter className="animate-pulse">
                  <div className="h-9 bg-secondary rounded w-full"></div>
                </CardFooter>
              </Card>
            ))
          ) : services.length === 0 ? (
            <Card className="border-border/50 shadow-sm col-span-full">
              <CardHeader>
                <CardTitle>{t('noServices')}</CardTitle>
                <CardDescription>
                  There are currently no services available. Please check back later.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            services.map(service => (
              <Card key={service.id} className={`border-border/50 shadow-sm ${!service.isAvailable ? 'opacity-75' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{service.name}</CardTitle>
                    {service.isAvailable ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    {service.fee > 0 ? `Fee: $${service.fee.toFixed(2)}` : 'No fee'} 
                    {service.processingTime ? ` • Processing time: ${service.processingTime}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {service.description || 'No description available'}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={service.isAvailable ? "default" : "secondary"}
                    disabled={!service.isAvailable || verifying}
                    onClick={() => handleApplyForService(service)}
                  >
                    {service.isAvailable ? (
                      <>
                        Apply Now <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      'Currently Unavailable'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {selectedService && (
        <ServiceApplicationDialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)}
          service={selectedService}
        />
      )}
    </AppLayout>
  );
};

export default Services;
