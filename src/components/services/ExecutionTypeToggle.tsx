
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExecutionTypeToggleProps {
  isNewExecution: boolean;
  setIsNewExecution: (value: boolean) => void;
}

export const ExecutionTypeToggle: React.FC<ExecutionTypeToggleProps> = ({
  isNewExecution,
  setIsNewExecution
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-4 p-3 bg-secondary rounded-md">
      <div className="flex items-center gap-2">
        <Checkbox 
          id="new-execution" 
          checked={isNewExecution} 
          onCheckedChange={() => setIsNewExecution(true)}
        />
        <label htmlFor="new-execution" className="text-sm cursor-pointer">
          {t('New Execution')}
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox 
          id="renewal" 
          checked={!isNewExecution}
          onCheckedChange={() => setIsNewExecution(false)} 
        />
        <label htmlFor="renewal" className="text-sm cursor-pointer">
          {t('Renewal')}
        </label>
      </div>
    </div>
  );
};
