
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmergencySectionProps {
  isEmergency: boolean;
  setIsEmergency: (value: boolean) => void;
  emergencyReason: string;
  setEmergencyReason: (value: string) => void;
}

export const EmergencySection: React.FC<EmergencySectionProps> = ({
  isEmergency,
  setIsEmergency,
  emergencyReason,
  setEmergencyReason
}) => {
  const { t } = useLanguage();

  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-md">
        <Checkbox 
          id="Emergency" 
          checked={isEmergency}
          onCheckedChange={checked => setIsEmergency(!!checked)}
        />
        <div className="grid gap-1">
          <label htmlFor="Emergency" className="text-sm font-medium cursor-pointer flex items-center gap-1">
            <AlertTriangle size={14} className="text-warning" />
            {t('Emergency Request')}
          </label>
          <p className="text-xs text-muted-foreground">
            Select for urgent processing (additional fees may apply)
          </p>
        </div>
      </div>

      {isEmergency && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Emergency Reason</label>
          <Input
            value={emergencyReason}
            onChange={e => setEmergencyReason(e.target.value)}
            placeholder="Explain why this request is urgent"
            required={isEmergency}
          />
        </div>
      )}
    </>
  );
};
