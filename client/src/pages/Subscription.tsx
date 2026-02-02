import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Check, 
  Crown, 
  Zap, 
  Star, 
  Infinity as InfinityIcon, 
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

// Tier order for comparison
const TIER_ORDER = ["free", "starter", "pro", "unlimited"] as const;

function getTierIndex(tier: string): number {
  return TIER_ORDER.indexOf(tier as typeof TIER_ORDER[number]);
}

function getTierIcon(tier: string) {
  switch (tier) {
    case "free": return <Zap className="w-5 h-5" />;
    case "starter": return <Star className="w-5 h-5" />;
    case "pro": return <Crown className="w-5 h-5" />;
    case "unlimited": return <InfinityIcon className="w-5 h-5" />;
    default: return <Zap className="w-5 h-5" />;
  }
}

function getTierColor(tier: string) {
  switch (tier) {
    case "free": return "bg-muted text-muted-foreground";
    case "starter": return "bg-blue-500/10 text-blue-500";
    case "pro": return "bg-primary/10 text-primary";
    case "unlimited": return "bg-amber-500/10 text-amber-500";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function Subscription() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [changingTier, setChangingTier] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: subscription, isLoading: subLoading } = trpc.subscription.current.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: tiers } = trpc.subscription.tiers.useQuery();

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
      setChangingTier(null);
    },
  });

  // For upgrade/downgrade between paid tiers, we'll use checkout for now
  // A proper update endpoint would require Stripe subscription modification API

  const cancelSubscription = trpc.subscription.cancel.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Subscription will be canceled at end of billing period");
      setShowCancelDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel subscription");
    },
  });

  const billingPortal = trpc.subscription.billingPortal.useMutation({
    onSuccess: (data) => {
      if (data.portalUrl) {
        window.open(data.portalUrl, "_blank");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to open billing portal");
    },
  });

  const handleChangePlan = (targetTier: string) => {
    if (!subscription) return;
    
    const currentIndex = getTierIndex(subscription.tier);
    const targetIndex = getTierIndex(targetTier);
    
    setChangingTier(targetTier);

    if (subscription.tier === "free") {
      // New subscription - create checkout
      createCheckout.mutate({ tier: targetTier as "starter" | "pro" | "unlimited" });
    } else if (targetTier === "free") {
      // Downgrade to free = cancel subscription
      setShowCancelDialog(true);
      setChangingTier(null);
    } else {
      // For paid tier changes, use checkout flow (Stripe handles proration)
      createCheckout.mutate({ tier: targetTier as "starter" | "pro" | "unlimited" });
    }
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to manage your subscription.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const currentTierIndex = subscription ? getTierIndex(subscription.tier) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Manage Subscription</h1>
              <p className="text-sm text-muted-foreground">Choose the plan that's right for you</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Current Plan Summary */}
        {subscription && (
          <Card className="mb-8 border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTierColor(subscription.tier)}`}>
                    {getTierIcon(subscription.tier)}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {subscription.tierInfo.name} Plan
                      <Badge variant="outline" className="ml-2">Current</Badge>
                    </CardTitle>
                    <CardDescription>
                      {subscription.tier === "free" 
                        ? "Free forever" 
                        : `$${subscription.tierInfo.price / 100}/month`}
                    </CardDescription>
                  </div>
                </div>
                {subscription.tier !== "free" && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => billingPortal.mutate()}
                    disabled={billingPortal.isPending}
                  >
                    {billingPortal.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Billing & Payment
                    <ExternalLink className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground">Daily Queries</p>
                  <p className="text-lg font-semibold">
                    {subscription.dailyQueries} / {subscription.dailyLimit === Infinity ? "∞" : subscription.dailyLimit}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground">Queries Left</p>
                  <p className="text-lg font-semibold">
                    {subscription.queriesRemaining === Infinity ? "∞" : subscription.queriesRemaining}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">
                    {subscription.subscriptionStatus === "none" ? "Active" : subscription.subscriptionStatus}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-muted-foreground">Image Limit</p>
                  <p className="text-lg font-semibold">
                    {subscription.tierInfo.imageLimit === Infinity ? "∞" : subscription.tierInfo.imageLimit}/day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Comparison */}
        <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tiers?.map((tier) => {
            const tierIndex = getTierIndex(tier.id);
            const isCurrentPlan = subscription?.tier === tier.id;
            const isUpgrade = tierIndex > currentTierIndex;
            const isDowngrade = tierIndex < currentTierIndex;
            const isPro = tier.id === "pro";

            return (
              <Card 
                key={tier.id} 
                className={`relative ${isCurrentPlan ? "border-primary border-2" : ""} ${isPro ? "ring-2 ring-primary/20" : ""}`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">Current Plan</Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${getTierColor(tier.id)}`}>
                    {getTierIcon(tier.id)}
                  </div>
                  <CardTitle>{tier.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : tier.id === "free" && subscription?.tier !== "free" ? (
                    <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                          <ArrowDownRight className="w-4 h-4 mr-2" />
                          Downgrade to Free
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Cancel Subscription?
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p>
                              Are you sure you want to cancel your subscription? You'll lose access to:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>Premium AI models</li>
                              <li>Higher query limits</li>
                              <li>Document chat features</li>
                              <li>Priority support</li>
                            </ul>
                            <p className="text-sm text-muted-foreground">
                              Your subscription will remain active until the end of your current billing period.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep My Plan</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelSubscription.mutate()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {cancelSubscription.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            Cancel Subscription
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      className="w-full"
                      variant={isUpgrade ? "default" : "outline"}
                      onClick={() => handleChangePlan(tier.id)}
                      disabled={changingTier === tier.id || createCheckout.isPending}
                    >
                      {changingTier === tier.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : isUpgrade ? (
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-2" />
                      )}
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Info Section */}
        <Separator className="my-8" />
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Can I change plans anytime?</p>
                <p className="text-sm text-muted-foreground">
                  Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately, 
                  and downgrades apply at the end of your billing period.
                </p>
              </div>
              <div>
                <p className="font-medium">What happens when I upgrade?</p>
                <p className="text-sm text-muted-foreground">
                  You'll get immediate access to all features of your new plan. We'll prorate 
                  the charge based on your remaining billing period.
                </p>
              </div>
              <div>
                <p className="font-medium">Can I get a refund?</p>
                <p className="text-sm text-muted-foreground">
                  We offer a 7-day money-back guarantee for new subscriptions. Contact support 
                  if you're not satisfied.
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Have questions about which plan is right for you? Our team is here to help.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="mailto:support@chofesh.ai">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Contact Billing Support
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/#pricing">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Pricing Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
