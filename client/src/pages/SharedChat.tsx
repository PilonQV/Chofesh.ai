import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  User,
  Bot,
  ArrowLeft,
  Lock,
  Clock,
  Eye,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

export default function SharedChat() {
  const params = useParams();
  const shareId = params.shareId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptionKey, setDecryptionKey] = useState<string>("");
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const { data: sharedData, isLoading, error } = trpc.shareLinks.get.useQuery(
    { shareId },
    { enabled: !!shareId }
  );

  // Try to get decryption key from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setDecryptionKey(hash);
    }
  }, []);

  // Auto-decrypt when we have both data and key
  useEffect(() => {
    if (sharedData && decryptionKey && !isDecrypted) {
      handleDecrypt();
    }
  }, [sharedData, decryptionKey]);

  const handleDecrypt = async () => {
    if (!sharedData || !decryptionKey) return;

    try {
      // Decrypt the data using Web Crypto API
      const encryptedData = sharedData.encryptedData;
      const [ivHex, encryptedHex] = encryptedData.split(":");
      
      if (!ivHex || !encryptedHex) {
        throw new Error("Invalid encrypted data format");
      }

      const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
      const encrypted = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

      // Derive key from password
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(decryptionKey),
        "PBKDF2",
        false,
        ["deriveKey"]
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode("chofesh-share-salt"),
          iterations: 100000,
          hash: "SHA-256",
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const jsonData = decoder.decode(decrypted);
      const parsedMessages = JSON.parse(jsonData);
      
      setMessages(parsedMessages);
      setIsDecrypted(true);
      setDecryptError(null);
    } catch (err) {
      console.error("Decryption failed:", err);
      setDecryptError("Failed to decrypt. The link may be invalid or the key is incorrect.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Link Not Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error.message || "This shared link is no longer available."}
            </p>
            <Link href="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go to Chofesh
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <div className="flex items-center gap-2">
              <img src="/chofesh-logo.png" alt="Chofesh" className="w-8 h-8 object-contain" />
              <span className="text-lg font-bold gradient-text">Chofesh</span>
            </div>
          </Link>
          <span className="text-muted-foreground">|</span>
          <span className="text-sm text-muted-foreground">Shared Conversation</span>
        </div>
        <Link href="/chat">
          <Button variant="outline" size="sm">
            Start Your Own Chat
          </Button>
        </Link>
      </header>

      <main className="container max-w-4xl mx-auto py-8 px-4">
        {/* Info Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-semibold">
                  {sharedData?.title || "Shared Conversation"}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {sharedData?.createdAt && new Date(sharedData.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-4 h-4" />
                    End-to-end encrypted
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Decryption Required */}
        {!isDecrypted && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-center">Encrypted Conversation</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {decryptError ? (
                <div className="p-4 bg-destructive/10 rounded-lg text-destructive">
                  {decryptError}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  This conversation is encrypted. The decryption key should be included in the link.
                </p>
              )}
              {!decryptionKey && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    If you have the decryption key, enter it below:
                  </p>
                  <div className="flex gap-2 max-w-md mx-auto">
                    <input
                      type="password"
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background"
                      placeholder="Enter decryption key"
                      value={decryptionKey}
                      onChange={(e) => setDecryptionKey(e.target.value)}
                    />
                    <Button onClick={handleDecrypt}>
                      Decrypt
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        {isDecrypted && (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <Streamdown>{message.content}</Streamdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This conversation was shared via{" "}
            <Link href="/" className="text-primary hover:underline">
              Chofesh
            </Link>
            . Create your own private AI conversations.
          </p>
        </div>
      </main>
    </div>
  );
}
