import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle } from "lucide-react";

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgeVerificationModal({ open, onConfirm, onCancel }: AgeVerificationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Shield className="w-8 h-8 text-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Age Verification Required</DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p>
              You are about to access <strong>uncensored AI content</strong> that may include adult themes, 
              explicit language, or mature subject matter.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-left text-amber-200">
                  By clicking "I Confirm", you certify that you are <strong>18 years of age or older</strong> and 
                  legally permitted to access adult content in your jurisdiction.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This verification will be saved to your account. You can access uncensored features 
              without re-verifying in the future.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            I Confirm I'm 18+
          </Button>
        </DialogFooter>
        <p className="text-xs text-center text-muted-foreground mt-2">
          All content remains within legal parameters. See our{" "}
          <a href="/privacy" className="underline hover:text-primary">Terms of Service</a> for details.
        </p>
      </DialogContent>
    </Dialog>
  );
}
