/**
 * Replacement Reason Section Component
 * 
 * This component handles the UI for capturing replacement reasons when users
 * want to apply for a Lost/Damaged document replacement.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertTriangle, FileX, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ReplacementReasonType,
  REPLACEMENT_REASON_OPTIONS
} from '@/types/documentValidation';
import { createReplacementReasonString } from '@/services/documentValidation';

interface ReplacementReasonSectionProps {
  /** Whether this is a replacement request */
  isReplacement: boolean;
  /** Callback when replacement status changes */
  onReplacementChange: (isReplacement: boolean) => void;
  /** Current replacement reason type */
  replacementType?: ReplacementReasonType;
  /** Callback when replacement type changes */
  onReplacementTypeChange: (type: ReplacementReasonType) => void;
  /** Additional details for the replacement */
  replacementDetails?: string;
  /** Callback when replacement details change */
  onReplacementDetailsChange: (details: string) => void;
  /** Document type name for display */
  documentTypeName?: string;
}

export const ReplacementReasonSection: React.FC<ReplacementReasonSectionProps> = ({
  isReplacement,
  onReplacementChange,
  replacementType,
  onReplacementTypeChange,
  replacementDetails = '',
  onReplacementDetailsChange,
  documentTypeName = 'document'
}) => {
  const { t } = useLanguage();

  // Get icon for replacement type
  const getReplacementIcon = (type: ReplacementReasonType) => {
    switch (type) {
      case 'lost':
        return <FileX className="h-4 w-4" />;
      case 'damaged':
        return <AlertTriangle className="h-4 w-4" />;
      case 'stolen':
        return <Shield className="h-4 w-4" />;
      default:
        return <FileX className="h-4 w-4" />;
    }
  };

  // Generate the full replacement reason string
  const getFullReplacementReason = (): string => {
    if (!isReplacement || !replacementType) return '';
    
    const typeLabel = REPLACEMENT_REASON_OPTIONS.find(opt => opt.value === replacementType)?.label || replacementType;
    return createReplacementReasonString(typeLabel, replacementDetails);
  };

  return (
    <div className="space-y-4">
      {/* Replacement Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
        <div className="space-y-1">
          <Label htmlFor="replacement-toggle" className="text-sm font-medium">
            Lost/Damaged Replacement
          </Label>
          <p className="text-xs text-muted-foreground">
            Check this if you already have a {documentTypeName} but need a replacement
          </p>
        </div>
        <Switch
          id="replacement-toggle"
          checked={isReplacement}
          onCheckedChange={onReplacementChange}
        />
      </div>

      {/* Replacement Details */}
      {isReplacement && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-warning">
              <AlertTriangle className="h-4 w-4" />
              Replacement Request Details
            </CardTitle>
            <CardDescription className="text-xs">
              Please provide the reason for requesting a replacement {documentTypeName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Replacement Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Reason for Replacement *</Label>
              <RadioGroup
                value={replacementType}
                onValueChange={(value) => onReplacementTypeChange(value as ReplacementReasonType)}
                className="space-y-2"
              >
                {REPLACEMENT_REASON_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <Label 
                        htmlFor={option.value} 
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                      >
                        {getReplacementIcon(option.value)}
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Additional Details */}
            <div className="space-y-2">
              <Label htmlFor="replacement-details" className="text-sm font-medium">
                Additional Details (Optional)
              </Label>
              <Textarea
                id="replacement-details"
                placeholder="Please provide any additional details about your replacement request..."
                value={replacementDetails}
                onChange={(e) => onReplacementDetailsChange(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide any additional context that might help with processing your replacement request
              </p>
            </div>

            {/* Preview of Full Reason */}
            {replacementType && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <Label className="text-xs font-medium text-muted-foreground">
                  Replacement Reason Summary:
                </Label>
                <p className="text-sm mt-1 font-medium">
                  {getFullReplacementReason()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      {isReplacement && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Important Notice:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Your existing {documentTypeName} will be marked as replaced once this application is approved</li>
                <li>You may be required to provide additional documentation or file a police report for stolen documents</li>
                <li>Processing time may be longer for replacement requests</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};