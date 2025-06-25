
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { Document } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface DocumentFormProps {
  open: boolean;
  document: Document;
  onClose: () => void;
  onDocumentUpdated: (document: Document) => void;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  open,
  document,
  onClose,
  onDocumentUpdated
}) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    doc_number: document?.doc_number || '',
    issue_date: document?.issue_date || '',
    expiry_date: document?.expiry_date || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('user_documents')
        .update({
          doc_number: formData.doc_number,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date || null,
        })
        .eq('doc_id', document.doc_id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('documentUpdated'),
        description: t('documentUpdatedDescription'),
      });

      onDocumentUpdated({
        ...document,
        ...data
      });
      onClose();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: t('error'),
        description: t('errorUpdatingDocument'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editDocument')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc_number">{t('documentNumber')}</Label>
              <Input
                id="doc_number"
                name="doc_number"
                value={formData.doc_number}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="issue_date">{t('issueDate')}</Label>
              <Input
                id="issue_date"
                name="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expiry_date">{t('expiryDate')}</Label>
              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={formData.expiry_date || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('saving') + '...' : t('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
