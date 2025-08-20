
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { DocumentSearch } from '@/components/documents/DocumentSearch';
import { DocumentTabs } from '@/components/documents/DocumentTabs';
import { DocumentError } from '@/components/documents/DocumentError';
import { DocumentSkeleton } from '@/components/documents/DocumentSkeleton';
import { DocumentData } from '@/types/document';
import { getDocumentTitle } from '@/components/documents/DocumentCard';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Documents: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Filtering and sorting states
  const [sortField, setSortField] = useState<string>('issue_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentDocuments, setCurrentDocuments] = useState<DocumentData[]>([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        
        // First check if user exists in the database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('national_number', user.nationalNumber)
          .maybeSingle();
          
        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user:', userError);
          setError('Failed to verify user account');
          setLoading(false);
          return;
        }
        
        if (!userData) {
          setError('User profile not found. Please complete your profile first.');
          setLoading(false);
          return;
        }

        // Fetch all documents for the current user
        const { data, error } = await supabase
          .from('user_documents')
          .select('*')
          .eq('national_number', user.nationalNumber);

        if (error) {
          console.error('Error fetching documents:', error);
          setError('Failed to load documents');
          toast({
            title: t('Error'),
            description: t('Error Fetching Documents'),
            variant: "destructive"
          });
          return;
        }

        setDocuments(data || []);
        sortDocuments(data || [], sortField, sortDirection);
      } catch (error) {
        console.error('Error:', error);
        setError('An unexpected error occurred');
        toast({
          title: t('Error'),
          description: t('Something Went Wrong'),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, t]);

  // Sort documents function
  const sortDocuments = (docs: DocumentData[], field: string, direction: 'asc' | 'desc') => {
    const sortedDocs = [...docs].sort((a, b) => {
      let valA: any;
      let valB: any;
      
      switch (field) {
        case 'issue_date':
          valA = new Date(a.issue_date);
          valB = new Date(b.issue_date);
          break;
        case 'expiry_date':
          valA = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
          valB = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
          break;
        case 'doc_type':
          valA = getDocumentTitle(a.doc_type, t);
          valB = getDocumentTitle(b.doc_type, t);
          break;
        default:
          valA = a.doc_id;
          valB = b.doc_id;
      }
      
      if (direction === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    
    setCurrentDocuments(sortedDocs);
  };

  // Handle sort change
  const handleSortChange = (field: string) => {
    const newDirection = field === sortField && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortField(field);
    setSortDirection(newDirection);
    sortDocuments(documents, field, newDirection);
  };

  // Filter documents based on search query
  useEffect(() => {
    const filteredDocs = documents.filter(
      doc => {
        const title = getDocumentTitle(doc.doc_type, t);
        return title.toLowerCase().includes(searchQuery.toLowerCase()) || 
               doc.doc_number.toLowerCase().includes(searchQuery.toLowerCase());
      }
    );
    sortDocuments(filteredDocs, sortField, sortDirection);
  }, [searchQuery, documents, t]);

  const toggleSortDirection = () => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    sortDocuments(currentDocuments, sortField, newDirection);
  };

  if (loading) {
    return (
      <AppLayout>
        <PageHeader title={t('Documents')} />
        <DocumentSkeleton />
      </AppLayout>
    );
  }

  // Show error state if something went wrong
  if (error) {
    return (
      <AppLayout>
        <PageHeader title={t('Documents')} />
        <div className="p-4">
          <DocumentError error={error} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader title={t('Documents')} />

      <div className="p-4 space-y-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <DocumentSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          
          {/* Sorting controls */}
          <div className={`flex gap-2 ${isMobile ? 'mt-2' : ''}`}>
            <Select value={sortField} onValueChange={(value) => handleSortChange(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="issue_date">{t('Issue Date')}</SelectItem>
                  <SelectItem value="expiry_date">{t('Expiry Date')}</SelectItem>
                  <SelectItem value="doc_type">{t('Document Type')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon" onClick={toggleSortDirection}>
              {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </Button>
          </div>
        </div>
        
        <DocumentTabs
          documents={documents}
          filteredDocuments={currentDocuments}
        />
      </div>
    </AppLayout>
  );
};

export default Documents;
