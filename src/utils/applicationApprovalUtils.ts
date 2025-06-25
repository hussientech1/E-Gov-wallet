
import { toast } from "@/components/ui/use-toast";
import { ServiceApplication } from "@/types/application";
import { handleApplicationApproval } from "./applicationUtils";

export const handleApprove = async (
  applicationId: number,
  nationalNumber: string,
  adminNationalNumber: string,
  applications: ServiceApplication[]
): Promise<boolean> => {
  try {
    // Show loading toast
    toast({
      title: "Processing",
      description: "Approving application and creating document...",
    });
    
    const success = await handleApplicationApproval(
      applicationId,
      nationalNumber,
      adminNationalNumber,
      applications
    );
    
    if (!success) {
      toast({
        title: "Error",
        description: "Failed to approve application.",
        variant: "destructive",
      });
      return false;
    } else {
      toast({
        title: "Success",
        description: "Application approved and document created successfully.",
      });
      return true;
    }
  } catch (error) {
    console.error('Error approving application:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred.",
      variant: "destructive",
    });
    return false;
  }
};
