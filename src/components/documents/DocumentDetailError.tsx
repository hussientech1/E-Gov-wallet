
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';

interface DocumentDetailErrorProps {
  error: string;
}

export const DocumentDetailError: React.FC<DocumentDetailErrorProps> = ({ error }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <AppLayout>
      <PageHeader title={t('Error')} showBack />
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-8">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-xl font-medium mb-2">{t('error')}</h3>
              <p className="text-muted-foreground mb-6">{error}</p>
              {error.includes('profile') ? (
                <Button onClick={() => navigate('/profile')} className="w-full max-w-xs">
                  {t('Go To Profile')}
                </Button>
              ) : (
                <Button onClick={() => navigate('/documents')} className="w-full max-w-xs">
                  {t('Back To Documents')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
