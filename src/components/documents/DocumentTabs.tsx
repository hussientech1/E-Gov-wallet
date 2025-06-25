
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { DocumentCard, getDocumentStatus } from './DocumentCard';
import { DocumentData } from '@/types/document';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from 'react';

interface DocumentTabsProps {
  documents: DocumentData[];
  filteredDocuments: DocumentData[];
}

export const DocumentTabs: React.FC<DocumentTabsProps> = ({ 
  documents, 
  filteredDocuments 
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(user?.fullName || '');

  // Get initial from name for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, profile_picture')
          .eq('national_number', user.nationalNumber)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }
        
        if (data) {
          setProfilePicture(data.profile_picture || null);
          setUserName(data.full_name || user.fullName);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* User information section */}
      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg border">
        <Avatar className="h-16 w-16">
          {profilePicture ? (
            <AvatarImage src={profilePicture} alt={userName} />
          ) : null}
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-medium text-lg">{userName}</h2>
          <p className="text-sm text-muted-foreground">
            {t('nationalIdNumber')}: {user?.nationalNumber}
          </p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">{t('all')}</TabsTrigger>
          <TabsTrigger value="valid">{t('valid')}</TabsTrigger>
          <TabsTrigger value="other">{t('other')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4 space-y-4">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map(doc => <DocumentCard key={doc.doc_id} document={doc} />)
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">{t('noDocumentsFound')}</p>
              <p className="text-sm mt-2">{t('checkApplicationStatus')}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="valid" className="mt-4 space-y-4">
          {filteredDocuments.filter(doc => getDocumentStatus(doc) === 'valid').length > 0 ? (
            filteredDocuments.filter(doc => getDocumentStatus(doc) === 'valid').map(
              doc => <DocumentCard key={doc.doc_id} document={doc} />
            )
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">{t('noValidDocumentsFound')}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="other" className="mt-4 space-y-4">
          {filteredDocuments.filter(doc => getDocumentStatus(doc) !== 'valid').length > 0 ? (
            filteredDocuments.filter(doc => getDocumentStatus(doc) !== 'valid').map(
              doc => <DocumentCard key={doc.doc_id} document={doc} />
            )
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">{t('noOtherDocumentsFound')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
