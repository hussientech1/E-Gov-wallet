
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';

interface Office {
  id: string;
  name: string;
}

interface OfficeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const offices: Office[] = [
  { id: 'khartoum', name: 'Khartoum Office' },
  { id: 'omdurman', name: 'Omdurman Office' },
  { id: 'bahri', name: 'Bahri Office' },
  { id: 'port-sudan', name: 'Port Sudan Office' },
  { id: 'nyala', name: 'Nyala Office' }
];

export const OfficeSelect: React.FC<OfficeSelectProps> = ({
  value,
  onValueChange
}) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('selectOffice')}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`${t('Select Office')}...`} />
        </SelectTrigger>
        <SelectContent>
          {offices.map(office => (
            <SelectItem key={office.id} value={office.id}>{office.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
