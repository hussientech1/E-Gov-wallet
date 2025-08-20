import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Eye, 
  AlertTriangle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { adminSupabase } from '@/integrations/supabase/admin-client';
import { useAuth } from '@/contexts/AuthContext';

interface UploadedDocument {
  upload_id: number;
  application_id: number;
  document_type: string;
  file_name: string;
  file_path: string; // base64 data
  file_size: number;
  mime_type: string;
  upload_status: 'pending' | 'verified' | 'rejected';
  rejection_reason: string | null;
  uploaded_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
}

interface DocumentViewerProps {
  applicationId: number;
  onDocumentStatusChange?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  applicationId,
  onDocumentStatusChange
}) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [applicationId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      console.log('=== DOCUMENT FETCH DEBUG START ===');
      console.log('Application ID:', applicationId);
      console.log('Admin Supabase client:', adminSupabase);
      
      // First, let's check if the table exists and what data is in it
      console.log('Checking uploaded_documents table...');
      
      try {
        // Try to get all documents first to see if table exists
        const allDocsResult = await adminSupabase
          .from('uploaded_documents')
          .select('*')
          .limit(5);
        
        console.log('All documents query result:', allDocsResult);
        
        if (allDocsResult.error) {
          console.error('Table access error:', allDocsResult.error);
          
          // If table doesn't exist or no access, show helpful message
          if (allDocsResult.error.code === '42P01') {
            throw new Error('uploaded_documents table does not exist');
          } else if (allDocsResult.error.code === '42501') {
            throw new Error('No permission to access uploaded_documents table');
          } else {
            throw allDocsResult.error;
          }
        }
        
        console.log('Table exists, found', allDocsResult.data?.length || 0, 'total documents');
        
        // Now try to get documents for this specific application
        console.log('Fetching documents for application:', applicationId);
        const appDocsResult = await adminSupabase
          .from('uploaded_documents')
          .select('*')
          .eq('application_id', applicationId)
          .order('uploaded_at', { ascending: true });
        
        console.log('Application documents result:', appDocsResult);
        
        if (appDocsResult.error) {
          console.error('Application documents error:', appDocsResult.error);
          throw appDocsResult.error;
        }
        
        console.log('Found', appDocsResult.data?.length || 0, 'documents for application', applicationId);
        setDocuments(appDocsResult.data || []);
        
      } catch (tableError) {
        console.error('Direct table access failed:', tableError);
        
        // Try RPC function as fallback
        console.log('Trying RPC function as fallback...');
        try {
          const rpcResult = await adminSupabase
            .rpc('get_application_documents', { app_id: applicationId });
          
          console.log('RPC result:', rpcResult);
          
          if (rpcResult.error) {
            console.error('RPC error:', rpcResult.error);
            throw rpcResult.error;
          }
          
          console.log('RPC succeeded, found', rpcResult.data?.length || 0, 'documents');
          setDocuments(rpcResult.data || []);
          
        } catch (rpcError) {
          console.error('RPC function also failed:', rpcError);
          throw new Error(`Both table access and RPC function failed. Table error: ${tableError.message}, RPC error: ${rpcError.message}`);
        }
      }
      
      console.log('=== DOCUMENT FETCH DEBUG END ===');
      
    } catch (error) {
      console.error('=== FINAL ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast({
        title: "Error",
        description: `Failed to load documents: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (documentId: number, action: 'verify' | 'reject', reason?: string) => {
    console.log('=== DOCUMENT VERIFICATION DEBUG START ===');
    console.log('Document ID:', documentId);
    console.log('Action:', action);
    console.log('Reason:', reason);
    console.log('User:', user);
    console.log('Admin National Number:', user?.nationalNumber);
    
    if (!user?.nationalNumber) {
      console.error('Admin user information missing');
      toast({
        title: "Error",
        description: "Admin user information is missing.",
        variant: "destructive"
      });
      return;
    }

    setProcessing(documentId);
    try {
      const status = action === 'verify' ? 'verified' : 'rejected';
      console.log('Target status:', status);
      
      let success = false;
      let updateError = null;
      
      // Try using the admin RPC function first
      try {
        console.log('Attempting to use admin RPC function for document update...');
        console.log('RPC parameters:', {
          doc_id: documentId,
          new_status: status,
          admin_user: user.nationalNumber,
          reason: reason || null
        });
        
        const { data, error } = await adminSupabase
          .rpc('update_document_status', {
            doc_id: documentId,
            new_status: status,
            admin_user: user.nationalNumber,
            reason: reason || null
          });

        console.log('RPC result:', { data, error });

        if (!error) {
          success = true;
          console.log('RPC function update succeeded');
        } else {
          console.error('RPC function error:', error);
          updateError = error;
        }
      } catch (rpcError) {
        console.log('RPC function not available or failed:', rpcError);
        
        // Fallback to direct table update
        console.log('Trying direct table update...');
        
        const updateData: any = {
          upload_status: status,
          verified_at: new Date().toISOString(),
          verified_by: user.nationalNumber
        };

        if (action === 'reject' && reason) {
          updateData.rejection_reason = reason;
        }

        console.log('Update data:', updateData);
        console.log('Updating document with upload_id:', documentId);

        const { data: updateResult, error: updateErr } = await adminSupabase
          .from('uploaded_documents')
          .update(updateData)
          .eq('upload_id', documentId)
          .select();

        console.log('Direct update result:', { updateResult, updateErr });

        if (!updateErr) {
          success = true;
          console.log('Direct table update succeeded');
          console.log('Updated rows:', updateResult?.length || 0);
        } else {
          console.error('Direct table update error:', updateErr);
          updateError = updateErr;
          throw updateErr;
        }
      }

      console.log('Update success:', success);

      if (success) {
        console.log('Showing success toast and refreshing documents');
        toast({
          title: "Success",
          description: `Document ${action === 'verify' ? 'verified' : 'rejected'} successfully.`,
          variant: "default"
        });

        console.log('Calling fetchDocuments to refresh...');
        await fetchDocuments();
        
        console.log('Calling onDocumentStatusChange callback...');
        onDocumentStatusChange?.();
        
        console.log('Document verification completed successfully');
      } else {
        console.error('Update failed but no exception thrown');
        throw new Error(updateError?.message || 'Unknown update error');
      }
    } catch (error) {
      console.error(`=== ERROR ${action.toUpperCase()}ING DOCUMENT ===`);
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      toast({
        title: "Error",
        description: `Failed to ${action} document: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      console.log('Cleaning up verification state...');
      setProcessing(null);
      setRejectionReason('');
      setSelectedDocument(null);
      console.log('=== DOCUMENT VERIFICATION DEBUG END ===');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadDocument = (doc: UploadedDocument) => {
    try {
      const link = document.createElement('a');
      link.href = doc.file_path;
      link.download = doc.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document.",
        variant: "destructive"
      });
    }
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading documents...</span>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              No documents have been uploaded for this application.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const pendingCount = documents.filter(doc => doc.upload_status === 'pending').length;
  const verifiedCount = documents.filter(doc => doc.upload_status === 'verified').length;
  const rejectedCount = documents.filter(doc => doc.upload_status === 'rejected').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Uploaded Documents
            <Badge variant="secondary">{documents.length}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            {pendingCount > 0 && <Badge variant="secondary">{pendingCount} Pending</Badge>}
            {verifiedCount > 0 && <Badge variant="default" className="bg-green-600">{verifiedCount} Verified</Badge>}
            {rejectedCount > 0 && <Badge variant="destructive">{rejectedCount} Rejected</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingCount > 0 && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              {pendingCount} document{pendingCount > 1 ? 's' : ''} require{pendingCount === 1 ? 's' : ''} verification before the application can be approved.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {documents.map((document) => (
            <div key={document.upload_id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getDocumentIcon(document.mime_type)}
                  <div>
                    <p className="font-medium">{document.document_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-sm text-muted-foreground">{document.file_name}</p>
                  </div>
                </div>
                {getStatusBadge(document.upload_status)}
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Size: {formatFileSize(document.file_size)} • Type: {document.mime_type}</p>
                <p>Uploaded: {formatDate(document.uploaded_at)}</p>
                {document.verified_at && (
                  <p>
                    {document.upload_status === 'verified' ? 'Verified' : 'Rejected'}: {formatDate(document.verified_at)}
                    {document.verified_by && ` by ${document.verified_by}`}
                  </p>
                )}
              </div>

              {document.rejection_reason && (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Rejection Reason:</strong> {document.rejection_reason}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                      <DialogTitle>{document.file_name}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      {document.mime_type.startsWith('image/') ? (
                        <img 
                          src={document.file_path} 
                          alt={document.file_name}
                          className="max-w-full h-auto rounded-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                          <div className="text-center">
                            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-lg font-medium">PDF Document</p>
                            <p className="text-sm text-muted-foreground">Click download to view the full document</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={() => downloadDocument(document)}>
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>

                {document.upload_status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleDocumentAction(document.upload_id, 'verify')}
                      disabled={processing === document.upload_id}
                    >
                      {processing === document.upload_id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      Verify
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setSelectedDocument(document)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Document</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>You are about to reject: <strong>{document.file_name}</strong></p>
                          <div>
                            <Label htmlFor="rejection-reason">Reason for rejection</Label>
                            <Textarea
                              id="rejection-reason"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a reason for rejecting this document..."
                              className="mt-1"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => {
                              setSelectedDocument(null);
                              setRejectionReason('');
                            }}>
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleDocumentAction(document.upload_id, 'reject', rejectionReason)}
                              disabled={!rejectionReason.trim() || processing === document.upload_id}
                            >
                              {processing === document.upload_id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-1" />
                              )}
                              Reject Document
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};