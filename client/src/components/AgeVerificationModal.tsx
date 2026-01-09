import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles } from "lucide-react";

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
          <DialogTitle className="text-center text-xl">Quick Age Check</DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            <p>
              You're about to unlock <strong>uncensored AI mode</strong> with no content filters.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-left text-amber-200">
                  Just confirm you're <strong>18 or older</strong> and you're good to go!
                  No ID needed - just a quick tap.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll remember this so you won't have to confirm again.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            I'm 18+, Let's Go!
          </Button>
        </DialogFooter>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Everything stays legal and within our{" "}
          <a href="/privacy" className="underline hover:text-primary">Terms of Service</a>.
        </p>
      </DialogContent>
    </Dialog>
  );
}
