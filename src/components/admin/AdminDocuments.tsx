
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentData } from '@/types/document';
import { DocumentCard, getDocumentStatus } from '@/components/documents/DocumentCard';
import { Filter, Share2, QrCode, ArrowUp, ArrowDown, Languages, Smartphone } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminDocuments: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('issue_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [documentType, setDocumentType] = useState<string>('all');
  const [documentStatus, setDocumentStatus] = useState<string>('all');
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortField, sortDirection, documentType, documentStatus]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_documents')
        .select(`
          *,
          users:national_number (
            full_name,
            profile_picture
          )
        `);

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: t('error'),
          description: t('errorFetchingDocuments'),
          variant: "destructive"
        });
        return;
      }

      // Transform data to match DocumentData structure
      const formattedData: DocumentData[] = data.map(doc => ({
        doc_id: doc.doc_id,
        national_number: doc.national_number,
        doc_type: doc.doc_type,
        doc_number: doc.doc_number,
        issue_date: doc.issue_date,
        expiry_date: doc.expiry_date,
        document_status: doc.document_status,
        qr_code: doc.qr_code,
        created_at: doc.created_at,
        personal_info: {
          fullName: doc.users?.full_name || 'Unknown',
          nationality: 'Sudan', // Default value
          dateOfBirth: '', // Would come from user profile in a full implementation
          placeOfBirth: '', // Would come from user profile in a full implementation
          gender: '', // Would come from user profile in a full implementation
          address: '', // Would come from user profile in a full implementation
          profile_picture: doc.users?.profile_picture || null
        }
      }));

      setDocuments(formattedData);
      setFilteredDocuments(formattedData);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t('error'),
        description: t('somethingWentWrong'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let result = [...documents];
    
    // Filter by search query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        doc => 
          doc.doc_number.toLowerCase().includes(lowerQuery) ||
          doc.personal_info?.fullName.toLowerCase().includes(lowerQuery) ||
          doc.national_number?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Filter by document type
    if (documentType !== 'all') {
      result = result.filter(doc => doc.doc_type === documentType);
    }
    
    // Filter by document status
    if (documentStatus !== 'all') {
      result = result.filter(doc => getDocumentStatus(doc) === documentStatus);
    }
    
    // Sort documents
    result.sort((a, b) => {
      let valA: any;
      let valB: any;
      
      switch (sortField) {
        case 'issue_date':
          valA = new Date(a.issue_date);
          valB = new Date(b.issue_date);
          break;
        case 'expiry_date':
          valA = a.expiry_date ? new Date(a.expiry_date) : new Date('9999-12-31');
          valB = b.expiry_date ? new Date(b.expiry_date) : new Date('9999-12-31');
          break;
        case 'name':
          valA = a.personal_info?.fullName.toLowerCase() || '';
          valB = b.personal_info?.fullName.toLowerCase() || '';
          break;
        case 'doc_number':
          valA = a.doc_number;
          valB = b.doc_number;
          break;
        default:
          valA = a.doc_id;
          valB = b.doc_id;
      }
      
      if (sortDirection === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
    
    setFilteredDocuments(result);
  };

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('doc_id', documentId);

      if (error) {
        throw error;
      }

      // Update local state
      setDocuments(documents.filter(doc => doc.doc_id !== documentId));
      toast({
        title: t('success'),
        description: t('documentDeleted'),
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingDocument'),
        variant: "destructive"
      });
    }
  };

  const renderDocumentGrid = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          {searchQuery ? t('noMatchingDocuments') : t('noDocumentsFound')}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map(doc => (
          <div key={doc.doc_id} className="relative">
            <DocumentCard document={doc} />
            <div className="absolute top-2 right-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteDocument(doc.doc_id)}
              >
                {t('delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Document Management</h2>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t('allDocuments')}</TabsTrigger>
          <TabsTrigger value="pending">{t('pendingReview')}</TabsTrigger>
          <TabsTrigger value="templates">{t('documentTemplates')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('allDocuments')}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Smartphone size={14} /> {isMobile ? 'Mobile' : 'Desktop'}
                  </Badge>
                  <Badge variant="outline" className="flex gap-1 items-center">
                    <Languages size={14} /> {t('multiLanguageSupport')}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>{t('manageAllDocumentsInTheSystem')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtering and sorting controls */}
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                  <Input
                    placeholder={t('searchDocuments')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className="flex gap-2">
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('documentType')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">{t('all')}</SelectItem>
                        <SelectItem value="passport">{t('passport')}</SelectItem>
                        <SelectItem value="national_id">{t('nationalIdCard')}</SelectItem>
                        <SelectItem value="birth_certificate">{t('birthCertificate')}</SelectItem>
                        <SelectItem value="driver_license">{t('driverLicense')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Select value={documentStatus} onValueChange={setDocumentStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="all">{t('all')}</SelectItem>
                        <SelectItem value="valid">{t('valid')}</SelectItem>
                        <SelectItem value="expiring">{t('expiringSoon')}</SelectItem>
                        <SelectItem value="expired">{t('expired')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortField} onValueChange={setSortField}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={t('sortBy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="issue_date">{t('issueDate')}</SelectItem>
                        <SelectItem value="expiry_date">{t('expiryDate')}</SelectItem>
                        <SelectItem value="name">{t('name')}</SelectItem>
                        <SelectItem value="doc_number">{t('documentNumber')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={toggleSortDirection}>
                    {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                  </Button>
                </div>
              </div>
              
              {/* Document grid */}
              {renderDocumentGrid()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pending" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('pendingDocuments')}</CardTitle>
              <CardDescription>{t('reviewDocumentsPendingApproval')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                {t('pendingDocumentApprovalFunctionality')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('documentTemplates')}</CardTitle>
              <CardDescription>{t('manageDocumentTemplatesUsedForDocumentGeneration')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center text-muted-foreground">
                {t('templateManagementFunctionality')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDocuments;
