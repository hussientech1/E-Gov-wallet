
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ServiceForm } from './ServiceForm';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ServiceFormData {
  serviceType: string;
  isNewExecution: boolean;
  office: string;
  invoiceNumber: string;
  isEmergency: boolean;
  emergencyReason: string;
}

interface ServiceApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    isAvailable: boolean;
  };
}

export const ServiceApplicationDialog: React.FC<ServiceApplicationDialogProps> = ({ 
  open, 
  onClose,
  service
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ServiceFormData>({
    serviceType: service.id,
    isNewExecution: true,
    office: '',
    invoiceNumber: '',
    isEmergency: false,
    emergencyReason: ''
  });

  const handleFormChange = (updatedData: Partial<ServiceFormData>) => {
    setFormData(prev => ({ ...prev, ...updatedData }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.nationalNumber) {
      toast({
        title: "Error",
        description: "User information is missing. Please log in again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Submit application to database
      const { data, error } = await supabase
        .from('service_applications')
        .insert({
          national_number: user.nationalNumber,
          service_id: parseInt(formData.serviceType),
          invoice_number: formData.invoiceNumber,
          office_location: formData.office,
          emergency_reason: formData.isEmergency ? formData.emergencyReason : null,
          application_status: 'Pending'
        })
        .select('application_id')
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your service application has been submitted."
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "Failed to submit application.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!service.isAvailable) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{service.name}</DialogTitle>
            <DialogDescription>
              <div className="py-6 flex flex-col items-center text-center">
                <AlertTriangle className="w-12 h-12 text-warning mb-3" />
                <h3 className="text-lg font-medium mb-2">Service Unavailable</h3>
                <p className="text-muted-foreground">
                  This service is currently not available. Please check back later or contact support for assistance.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{service.name} Application</DialogTitle>
          <DialogDescription>
            Complete the form below to apply for this service
          </DialogDescription>
        </DialogHeader>
        
        <ServiceForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          onChange={handleFormChange}
          formData={{...formData, serviceType: service.id}}
          hideServiceSelect={true}
        />
      </DialogContent>
    </Dialog>
  );
};
