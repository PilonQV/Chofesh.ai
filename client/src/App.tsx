import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieConsent } from "./components/CookieConsent";
import { lazy, Suspense } from "react";

import { Loader2 } from "lucide-react";

// Eagerly load critical pages (landing, login)
import Home from "./pages/Home";
import Login from "./pages/Login";

// Lazy load heavy pages for better initial load performance
const Chat = lazy(() => import("./pages/Chat"));
const ImageGen = lazy(() => import("./pages/ImageGen"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Settings = lazy(() => import("./pages/Settings"));
const Documents = lazy(() => import("./pages/Documents"));
const Usage = lazy(() => import("./pages/Usage"));
const Characters = lazy(() => import("./pages/Characters"));
const SharedChat = lazy(() => import("./pages/SharedChat"));
const Memory = lazy(() => import("./pages/Memory"));
const Artifacts = lazy(() => import("./pages/Artifacts"));
const Subscription = lazy(() => import("./pages/Subscription"));
const MyGallery = lazy(() => import("./pages/MyGallery"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const CodeWorkspace = lazy(() => import("./pages/CodeWorkspace"));
const Workflows = lazy(() => import("./pages/Workflows"));
const CodeReview = lazy(() => import("./pages/CodeReview"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const ComponentShowcase = lazy(() => import("./pages/ComponentShowcase"));
const Tools = lazy(() => import("./pages/Tools"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/chat" component={Chat} />
        <Route path="/image" component={ImageGen} />
        <Route path="/images" component={ImageGen} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/audit-logs" component={AdminAuditLogs} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/settings" component={Settings} />
        <Route path="/documents" component={Documents} />
        <Route path="/usage" component={Usage} />
        <Route path="/characters" component={Characters} />
        <Route path="/share/:shareId" component={SharedChat} />
        <Route path="/memory" component={Memory} />
        <Route path="/artifacts" component={Artifacts} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/gallery" component={MyGallery} />
        <Route path="/code" component={CodeWorkspace} />
        <Route path="/workflows" component={Workflows} />
        <Route path="/code-review" component={CodeReview} />
        <Route path="/knowledge" component={KnowledgeBase} />
        <Route path="/showcase" component={ComponentShowcase} />
        <Route path="/tools" component={Tools} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
