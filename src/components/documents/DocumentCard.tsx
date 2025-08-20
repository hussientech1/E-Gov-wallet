
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Scan, ExternalLink } from 'lucide-react';
import { DocumentData } from '@/types/document';

interface DocumentCardProps {
  document: DocumentData;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const status = getDocumentStatus(document);

  return (
    <Card 
      className="card-hover cursor-pointer"
      onClick={() => navigate(`/documents/${document.doc_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{getDocumentTitle(document.doc_type, t)}</h3>
              <p className="text-xs text-muted-foreground">
                {document.doc_number}
              </p>
            </div>
          </div>
          {renderStatusBadge(status, t)}
        </div>

        <div className="text-sm grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          <span className="text-muted-foreground">{t('Issue Date')}:</span>
          <span>{formatDate(document.issue_date)}</span>
          
          <span className="text-muted-foreground">{t('Expiry Date')}:</span>
          <span>{formatDate(document.expiry_date)}</span>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-primary">
          <Scan size={14} />
          <span>{t('Scan QR To Verify')}</span>
          <ExternalLink size={14} className="ml-auto" />
        </div>
      </CardContent>
    </Card>
  );
};

// Get document validity status
export const getDocumentStatus = (doc: DocumentData) => {
  if (!doc.expiry_date) return 'valid'; // No expiry

  const now = new Date();
  const expiry = new Date(doc.expiry_date);
  const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000; // Approximate 6 months in ms
  
  if (expiry < now) return 'expired';
  if (expiry.getTime() - now.getTime() < sixMonths) return 'expiring';
  return 'valid';
};

// Document status badge
export const renderStatusBadge = (status: string, t: (key: string) => string) => {
  switch (status) {
    case 'valid':
      return <Badge className="bg-success">{t('Valid')}</Badge>;
    case 'expiring':
      return <Badge className="bg-warning text-warning-foreground">{t('Expiring Soon')}</Badge>;
    case 'expired':
      return <Badge variant="destructive">{t('Expired')}</Badge>;
    default:
      return null;
  }
};

// Format date
export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Get document title based on type
export const getDocumentTitle = (type: string, t: (key: string) => string) => {
  switch (type) {
    case 'national_id':
      return t('National ID Card');
    case 'passport':
      return t('Passport');
    case 'birth_certificate':
      return t('Birth Certificate');
    case 'driver_license':
      return t('Driver License');
    default:
      return type;
  }
};
