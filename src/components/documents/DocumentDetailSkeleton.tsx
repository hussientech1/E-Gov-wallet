
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';

export const DocumentDetailSkeleton: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <AppLayout>
      <PageHeader title={t('loading')} showBack />
      <div className="p-4 space-y-6">
        <Card>
          <div className="bg-primary p-6">
            <Skeleton className="h-6 w-40 mx-auto" />
          </div>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};
