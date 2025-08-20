
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceType {
  id: string;
  name: string;
}

interface ServiceTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const serviceTypes: ServiceType[] = [
  { id: '1', name: 'Passport' },
  { id: '2', name: 'ID Card' },
  { id: '3', name: 'Birth Certificate' },
  { id: '4', name: 'Driver License' }
];

export const ServiceTypeSelect: React.FC<ServiceTypeSelectProps> = ({
  value,
  onValueChange
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('Select Service')}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`${t('Select Service')}...`} />
        </SelectTrigger>
        <SelectContent>
          {serviceTypes.map(service => (
            <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
