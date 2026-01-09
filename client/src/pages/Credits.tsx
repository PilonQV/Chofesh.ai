import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Zap, Clock, ArrowRight, Check, Sparkles, History, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function Credits() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const [verifying, setVerifying] = useState(false);
  
  const { data: user } = trpc.auth.me.useQuery();
  const { data: balance, refetch: refetchBalance } = trpc.credits.balance.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: packs } = trpc.credits.packs.useQuery();
  const { data: history } = trpc.credits.history.useQuery({ limit: 20 }, {
    enabled: !!user,
  });
  
  const createCheckout = trpc.credits.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });
  
  const verifyPurchase = trpc.credits.verifyPurchase.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully added ${data.creditsAdded} credits!`);
      refetchBalance();
      // Clear URL params
      setLocation("/credits");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify purchase");
    },
  });
  
  // Handle successful payment redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    
    if (success === "true" && sessionId && !verifying) {
      setVerifying(true);
      verifyPurchase.mutate({ sessionId: sessionId as string });
    }
    
    if (searchParams.get("canceled") === "true") {
      toast.info("Purchase canceled");
      setLocation("/credits");
    }
  }, [searchParams]);
  
  const handlePurchase = (packName: string, priceId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }
    createCheckout.mutate({ packName, priceId });
  };
  
  const getPackIcon = (name: string) => {
    switch (name) {
      case "starter": return <Zap className="h-6 w-6 text-yellow-500" />;
      case "standard": return <Coins className="h-6 w-6 text-blue-500" />;
      case "pro": return <Sparkles className="h-6 w-6 text-purple-500" />;
      case "power": return <CreditCard className="h-6 w-6 text-emerald-500" />;
      default: return <Coins className="h-6 w-6" />;
    }
  };
  
  const getPackBadge = (name: string) => {
    if (name === "standard") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Best Value</Badge>;
    if (name === "power") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Most Popular</Badge>;
    return null;
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase": return "text-emerald-400";
      case "daily_refresh": return "text-blue-400";
      case "usage": return "text-rose-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Aurora background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent rounded-full blur-3xl animate-aurora-slow" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-500/10 via-transparent to-transparent rounded-full blur-3xl animate-aurora-slow" style={{ animationDelay: "-5s" }} />
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white font-heading">Credits</h1>
            <p className="text-gray-400 mt-1">Purchase credits to use AI features</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
        </div>
        
        {/* Balance Card */}
        {user && balance && (
          <Card className="mb-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Your Balance</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-bold text-white">{balance.totalCredits}</span>
                    <span className="text-gray-400">credits</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-blue-400">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {balance.freeCredits} daily free
                    </span>
                    <span className="text-emerald-400">
                      <Coins className="h-3 w-3 inline mr-1" />
                      {balance.purchasedCredits} purchased
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Daily free credits refresh in</p>
                  <p className="text-xl font-semibold text-cyan-400">
                    {(() => {
                      const lastRefresh = new Date(balance.freeCreditsLastRefresh);
                      const nextRefresh = new Date(lastRefresh.getTime() + 24 * 60 * 60 * 1000);
                      const hoursLeft = Math.max(0, Math.floor((nextRefresh.getTime() - Date.now()) / (1000 * 60 * 60)));
                      const minsLeft = Math.max(0, Math.floor(((nextRefresh.getTime() - Date.now()) % (1000 * 60 * 60)) / (1000 * 60)));
                      return `${hoursLeft}h ${minsLeft}m`;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="purchase" className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="purchase" className="data-[state=active]:bg-cyan-500/20">
              <CreditCard className="h-4 w-4 mr-2" />
              Purchase Credits
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20">
              <History className="h-4 w-4 mr-2" />
              Transaction History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchase">
            {/* Credit Packs */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packs?.map((pack) => (
                <Card 
                  key={pack.id} 
                  className={`relative bg-slate-800/50 border-slate-700 backdrop-blur-sm transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 ${
                    pack.name === "standard" ? "ring-2 ring-blue-500/50" : ""
                  }`}
                >
                  {getPackBadge(pack.name) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      {getPackBadge(pack.name)}
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      {getPackIcon(pack.name)}
                      <div>
                        <CardTitle className="text-white">{pack.displayName}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {pack.credits.toLocaleString()} credits
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">${(pack.priceUsd / 100).toFixed(0)}</span>
                      <span className="text-gray-400 text-sm">USD</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      ${((pack.priceUsd / 100) / pack.credits * 100).toFixed(2)} per 100 credits
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      onClick={() => handlePurchase(pack.name, pack.stripePriceId || '')}
                      disabled={createCheckout.isPending || !user}
                    >
                      {createCheckout.isPending ? "Processing..." : "Purchase"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Credit Costs Info */}
            <Card className="mt-8 bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Credit Costs</CardTitle>
                <CardDescription>How credits are used across features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Chat
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex justify-between"><span>Free models (Llama)</span><span className="text-emerald-400">1 credit</span></li>
                      <li className="flex justify-between"><span>Standard (GPT-4o-mini)</span><span className="text-blue-400">2 credits</span></li>
                      <li className="flex justify-between"><span>Uncensored (Venice)</span><span className="text-purple-400">3 credits</span></li>
                      <li className="flex justify-between"><span>Premium (GPT-4o, Claude)</span><span className="text-amber-400">8 credits</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Image Generation
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex justify-between"><span>Standard (Flux)</span><span className="text-blue-400">8 credits</span></li>
                      <li className="flex justify-between"><span>Single image</span><span className="text-blue-400">3 credits</span></li>
                      <li className="flex justify-between"><span>4 variations</span><span className="text-purple-400">10 credits</span></li>
                      <li className="flex justify-between"><span>Premium (DALL-E 3)</span><span className="text-amber-400">20 credits</span></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Other Features
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex justify-between"><span>Document Chat</span><span className="text-blue-400">3 credits</span></li>
                      <li className="flex justify-between"><span>Image Upscale</span><span className="text-blue-400">4 credits</span></li>
                      <li className="flex justify-between"><span>Voice Input (STT)</span><span className="text-blue-400">2 credits</span></li>
                      <li className="flex justify-between"><span>Voice Output (TTS)</span><span className="text-blue-400">2 credits</span></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Free Credits Info */}
            <Card className="mt-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">30 Free Credits Daily</h4>
                  <p className="text-gray-400 text-sm">
                    Every day you get 30 free credits that refresh automatically. Use them or lose them!
                    Purchased credits never expire.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Transaction History</CardTitle>
                <CardDescription>Your recent credit transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {history && history.length > 0 ? (
                  <div className="space-y-3">
                    {history.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            tx.type === "purchase" ? "bg-emerald-500/20" :
                            tx.type === "daily_refresh" ? "bg-blue-500/20" :
                            "bg-rose-500/20"
                          }`}>
                            {tx.type === "purchase" ? <CreditCard className="h-4 w-4 text-emerald-400" /> :
                             tx.type === "daily_refresh" ? <Clock className="h-4 w-4 text-blue-400" /> :
                             <Zap className="h-4 w-4 text-rose-400" />}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{tx.description}</p>
                            <p className="text-gray-500 text-xs">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${getTransactionColor(tx.type)}`}>
                            {tx.amount > 0 ? "+" : ""}{tx.amount}
                          </p>
                          <p className="text-gray-500 text-xs">Balance: {tx.balanceAfter}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm">Purchase credits or use AI features to see your history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Not signed in message */}
        {!user && (
          <Card className="mt-8 bg-amber-500/10 border-amber-500/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Sign in to purchase credits</h4>
                <p className="text-gray-400 text-sm">
                  Create an account to buy credits and access all AI features.
                </p>
              </div>
              <Button onClick={() => setLocation("/login")} className="bg-amber-500 hover:bg-amber-600">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
