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
      title: t('linkCopied'),
      description: t('linkCopiedDescription'),
    });
  };

  const handleShare = async (documentId: number) => {
    const shareUrl = `${window.location.origin}/documents/${documentId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('shareDocument'),
          text: t('checkOutThisDocument'),
          url: shareUrl,
        });
        toast({
          title: t('documentShared'),
          description: t('documentSharedDescription'),
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
        title: t('documentDeleted'),
        description: t('documentDeletedDescription'),
      });
      onDocumentDeleted(document.doc_id);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: t('error'),
        description: t('errorDeletingDocument'),
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
            {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare(document.doc_id)}>
            <Share2 className="mr-2 h-4 w-4" /> 
            {t('share')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCopyLink(`${window.location.origin}/documents/${document.doc_id}`)}>
            <Copy className="mr-2 h-4 w-4" /> 
            {t('copyLink')}
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <RotateCcw className="mr-2 h-4 w-4" /> 
            {t('renew')}
          </DropdownMenuItem>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" /> 
                {t('delete')}
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('deleteConfirmation')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteConfirmationDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting ? t('deleting') + '...' : t('delete')}
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
