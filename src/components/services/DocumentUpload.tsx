import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import { DocumentUploadProps, UploadedDocument, DocumentValidationResult } from '@/types/documentUpload';

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  documentType,
  label,
  description,
  acceptedTypes = ['image/*', 'application/pdf'],
  maxSize = 5 * 1024 * 1024, // 5MB default
  onDocumentChange,
  initialDocument = null,
  required = true
}) => {
  const { t } = useLanguage();
  const [document, setDocument] = useState<UploadedDocument | null>(initialDocument);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): DocumentValidationResult => {
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(1)}MB.`
      };
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      return {
        isValid: false,
        error: `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      toast({
        title: t('Error'),
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newDocument: UploadedDocument = {
        document_type: documentType,
        file_name: file.name,
        file_data: result,
        file_size: file.size,
        mime_type: file.type,
        upload_status: 'pending'
      };
      
      setDocument(newDocument);
      onDocumentChange(newDocument);
      setIsUploading(false);
      
      toast({
        title: t('Success'),
        description: `${label} uploaded successfully.`,
        variant: "default"
      });
    };
    
    reader.onerror = () => {
      toast({
        title: t('Error'),
        description: 'Error reading file.',
        variant: "destructive"
      });
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = () => {
    setDocument(null);
    onDocumentChange(null);
    toast({
      title: t('Success'),
      description: `${label} removed.`,
      variant: "default"
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <img src={document?.file_data} alt={label} className="w-12 h-12 object-cover rounded" />;
    }
    return <File className="w-12 h-12 text-muted-foreground" />;
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                {label}
                {required && <span className="text-destructive">*</span>}
              </Label>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {document && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Uploaded</span>
              </div>
            )}
          </div>

          {document ? (
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              {getFileIcon(document.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{document.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(document.file_size)} • {document.mime_type}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveDocument}
                className="text-destructive hover:text-destructive/80"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                {isUploading ? (
                  <>
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <Label 
                        htmlFor={`document-${documentType}`}
                        className="cursor-pointer text-sm text-primary hover:text-primary/80"
                      >
                        Click to upload {label.toLowerCase()}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <Input
                id={`document-${documentType}`}
                type="file"
                accept={acceptedTypes.join(',')}
                className="sr-only"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
          )}

          {required && !document && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="w-3 h-3" />
              <span>This document is required</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};