
import React from 'react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface DocumentSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenFilter?: () => void;
  showFilterButton?: boolean;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ 
  searchQuery, 
  setSearchQuery,
  onOpenFilter,
  showFilterButton = false
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`${t('search')} ${t('documents')}...`}
          className="pl-9"
        />
      </div>
      
      {showFilterButton && onOpenFilter && (
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"} 
          onClick={onOpenFilter}
          className="flex items-center gap-1"
        >
          <Filter size={16} />
          {!isMobile && t('filter')}
        </Button>
      )}
    </div>
  );
};
