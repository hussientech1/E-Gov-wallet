
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { QrCode, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface DocumentQRCodeProps {
  qrCode: string | null;
}

export const DocumentQRCode: React.FC<DocumentQRCodeProps> = ({ qrCode }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = () => {
    if (!qrCode) return;
    
    navigator.clipboard.writeText(qrCode).then(() => {
      setCopied(true);
      toast({
        title: t('Success'),
        description: t('Link Copied'),
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div className="flex justify-center py-6 border-t border-border">
      <div className="text-center">
        <div className="h-40 w-40 bg-white mb-3 mx-auto flex items-center justify-center">
          {qrCode ? (
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode)}`}
              alt="QR Code"
              className="h-full w-full p-2"
            />
          ) : (
            <QrCode className="h-full w-full p-8 text-gray-600" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-3">{t('Scan to Verify')}</p>

        {qrCode && (
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyLink}
              className="flex items-center gap-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('copied') : t('copyVerificationLink')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
