
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';

export const DocumentNotFound: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <AppLayout>
      <PageHeader title={t('documentNotFound')} showBack />
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-8">
              <AlertTriangle className="h-12 w-12 text-warning mb-4" />
              <h2 className="text-xl font-bold mb-2">{t('documentNotFound')}</h2>
              <p className="text-muted-foreground mb-4">{t('documentNotFoundDescription')}</p>
              <Button onClick={() => navigate('/documents')}>{t('backToDocuments')}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
