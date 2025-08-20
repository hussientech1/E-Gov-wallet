
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { EnhancedServiceApplication } from '@/types/application';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: () => void;
  selectedApplication: EnhancedServiceApplication | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  processing: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  open,
  onOpenChange,
  onReject,
  selectedApplication,
  rejectionReason,
  setRejectionReason,
  processing
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Application</DialogTitle>
          <DialogDescription>
            {selectedApplication && (
              <>
                Rejecting application #{selectedApplication.application_id} for {selectedApplication.user_full_name} ({selectedApplication.service_name}).
                <br />
                Please provide a detailed reason for rejection.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">
              Rejection Reason *
            </Label>
            <textarea
              id="rejectionReason"
              className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
              placeholder="Please provide a detailed reason for rejecting this application..."
              onChange={(e) => setRejectionReason(e.target.value)}
              value={rejectionReason}
              disabled={processing}
            />
            <p className="text-xs text-muted-foreground">
              This reason will be visible to the applicant and stored in the system.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={processing || !rejectionReason.trim()}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject Application"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
