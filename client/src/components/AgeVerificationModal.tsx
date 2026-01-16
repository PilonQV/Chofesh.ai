import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Sparkles } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgeVerificationModal({ open, onConfirm, onCancel }: AgeVerificationModalProps) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const verifyAgeMutation = trpc.verifyAge.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Age verified successfully!");
        onConfirm();
      } else {
        toast.error(data.message || "You must be 18 or older to access this feature");
      }
      setLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify age");
      setLoading(false);
    },
  });

  const handleVerify = () => {
    // Validation
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    const yearNum = parseInt(year);

    if (!month || !day || !year) {
      toast.error("Please enter your complete date of birth");
      return;
    }

    if (monthNum < 1 || monthNum > 12) {
      toast.error("Invalid month");
      return;
    }

    if (dayNum < 1 || dayNum > 31) {
      toast.error("Invalid day");
      return;
    }

    if (yearNum < 1900 || yearNum > new Date().getFullYear()) {
      toast.error("Invalid year");
      return;
    }

    if (!confirmed) {
      toast.error("Please confirm that the information is accurate");
      return;
    }

    // Format date as YYYY-MM-DD
    const dateOfBirth = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;

    setLoading(true);
    verifyAgeMutation.mutate({ dateOfBirth });
  };

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
              You're about to unlock <strong>uncensored AI mode</strong> with no content filters.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-left text-amber-200">
                  Please confirm your date of birth to verify you're <strong>18 or older</strong>.
                  This is a one-time verification.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-center block">Date of Birth</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="MM"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="text-center"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">Month</p>
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="DD"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="text-center"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">Day</p>
              </div>
              <div className="flex-[1.5]">
                <Input
                  type="number"
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="text-center"
                />
                <p className="text-xs text-muted-foreground text-center mt-1">Year</p>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I confirm this information is accurate and I am 18 years or older
            </label>
          </div>

          <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
            <p className="font-medium mb-1">Privacy Notice:</p>
            <p>Your date of birth is stored securely for legal compliance.
            We'll remember this so you won't have to verify again.</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleVerify}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
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
