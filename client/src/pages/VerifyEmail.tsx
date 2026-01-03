import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");
  
  // Get token from URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");
  
  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
    },
  });
  
  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      setMessage("No verification token provided");
      return;
    }
    
    // Verify the token
    verifyMutation.mutate({ token });
  }, [token]);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && (
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
            {status === "success" && (
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            )}
            {(status === "error" || status === "no-token") && (
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Email..."}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
            {status === "no-token" && "Invalid Link"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {message || (status === "loading" ? "Please wait while we verify your email address." : "")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Button 
              className="w-full" 
              onClick={() => setLocation("/login")}
            >
              Continue to Login
            </Button>
          )}
          
          {status === "error" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                The verification link may have expired or already been used.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                Back to Login
              </Button>
            </div>
          )}
          
          {status === "no-token" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Please use the verification link sent to your email.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation("/login")}
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
