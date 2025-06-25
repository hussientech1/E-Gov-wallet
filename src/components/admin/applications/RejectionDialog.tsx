
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
import { ServiceApplication } from '@/types/application';

interface RejectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReject: () => void;
  selectedApplication: ServiceApplication | null;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  processing: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  open,
  onOpenChange,
  onReject,
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
            Enter the reason for rejecting the application.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="rejectionReason" className="text-right">
              Reason
            </Label>
            <Input 
              id="rejectionReason" 
              className="col-span-3" 
              onChange={(e) => setRejectionReason(e.target.value)} 
              value={rejectionReason}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onReject} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
