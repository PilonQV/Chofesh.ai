import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface AgeVerificationModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgeVerificationModal({ open, onConfirm, onCancel }: AgeVerificationModalProps) {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyAgeMutation = trpc.auth.verifyAge.useMutation({
    onSuccess: () => {
      onConfirm();
    },
    onError: (error) => {
      setError(error.message);
      setIsVerifying(false);
    },
  });

  const handleVerify = () => {
    setError("");

    // Validate inputs
    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);

    if (!month || !day || !year) {
      setError("Please enter your complete date of birth");
      return;
    }

    if (m < 1 || m > 12) {
      setError("Invalid month (1-12)");
      return;
    }

    if (d < 1 || d > 31) {
      setError("Invalid day (1-31)");
      return;
    }

    if (y < 1900 || y > new Date().getFullYear()) {
      setError("Invalid year");
      return;
    }

    // Format as YYYY-MM-DD
    const dateOfBirth = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

    setIsVerifying(true);
    verifyAgeMutation.mutate({ dateOfBirth });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🔞 Age Verification Required</DialogTitle>
          <DialogDescription>
            To access uncensored features, please confirm your date of birth.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="MM"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="DD"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            ✓ I confirm this information is accurate
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isVerifying}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
