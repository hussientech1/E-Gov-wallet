import React, { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Copy, Edit, MoreHorizontal, RotateCcw, Share2, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Document } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { DocumentForm } from './DocumentForm';

interface DocumentActionsProps {
  document: Document;
  onDocumentUpdated: (updatedDocument: Document) => void;
  onDocumentDeleted: (documentId: number) => void;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({ 
  document,
  onDocumentUpdated,
  onDocumentDeleted
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: t('Link Copied'),
      description: t('Link Copied Description'),
    });
  };

  const handleShare = async (documentId: number) => {
    const shareUrl = `${window.location.origin}/documents/${documentId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('Share Docuent'),
          text: t('Check Out This Document'),
          url: shareUrl,
        });
        toast({
          title: t('Document Shared'),
          description: t('Document Shared Description'),
        });
      } else {
        handleCopyLink(shareUrl);
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      handleCopyLink(shareUrl);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('doc_id', document.doc_id);

      if (error) {
        throw error;
      }

      toast({
        title: t('Document Deleted'),
        description: t('Document Deleted Description'),
      });
      onDocumentDeleted(document.doc_id);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: t('Error'),
        description: t('Error Deleting Document'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" /> 
            {t('Edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare(document.doc_id)}>
            <Share2 className="mr-2 h-4 w-4" /> 
            {t('Share')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyLink(`${window.location.origin}/documents/${document.doc_id}`)}>
            <Copy className="mr-2 h-4 w-4" /> 
            {t('Copy Link')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <RotateCcw className="mr-2 h-4 w-4" /> 
            {t('Renew')}
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> 
                {t('Delete')}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('Delete Confirmation')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('Delete Confirmation Description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? t('Deleting') + '...' : t('Delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentForm
        open={isEditDialogOpen}
        document={document}
        onClose={() => setIsEditDialogOpen(false)}
        onDocumentUpdated={onDocumentUpdated}
      />
    </>
  );
};
