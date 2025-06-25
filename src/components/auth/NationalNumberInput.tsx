
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface NationalNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const NationalNumberInput: React.FC<NationalNumberInputProps> = ({
  value,
  onChange,
  error
}) => {
  const { t } = useLanguage();
  const [focused, setFocused] = useState(false);

  // Handle national number validation (2 chars + 10 numbers)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Only allow letters for first two characters and numbers for the rest
    const regex = /^[A-Za-z]{0,2}[0-9]{0,10}$/;
    
    if (regex.test(inputValue) || inputValue === '') {
      onChange(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label 
        htmlFor="nationalNumber"
        className={`transition-colors ${focused ? 'text-primary' : ''}`}
      >
        {t('nationalNumber')}
      </Label>
      
      <Input
        id="nationalNumber"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="AB1234567890"
        className={error ? 'border-destructive' : ''}
        maxLength={12}
      />
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      
      <p className="text-xs text-muted-foreground">
        {t('nationalNumber')} {value.length}/12
      </p>
    </div>
  );
};

export default NationalNumberInput;
