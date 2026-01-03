import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieConsent } from "./components/CookieConsent";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ImageGen from "./pages/ImageGen";
import AdminDashboard from "./pages/AdminDashboard";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Settings from "./pages/Settings";
import Documents from "./pages/Documents";
import Usage from "./pages/Usage";
import Characters from "./pages/Characters";
import SharedChat from "./pages/SharedChat";
import Memory from "./pages/Memory";
import Artifacts from "./pages/Artifacts";
import Subscription from "./pages/Subscription";
import MyGallery from "./pages/MyGallery";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/chat" component={Chat} />
      <Route path="/image" component={ImageGen} />
      <Route path="/admin" component={AdminDashboard} />
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
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
