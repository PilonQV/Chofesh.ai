import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie, Settings, Check, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "chofesh_cookie_consent";
const COOKIE_PREFERENCES_KEY = "chofesh_cookie_preferences";

interface CookiePreferences {
  necessary: boolean; // Always true, required
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Longer delay to not interrupt initial page experience
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    } else {
      // Load saved preferences
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    saveConsent(allAccepted);
  };

  const handleAcceptNecessary = () => {
    saveConsent(DEFAULT_PREFERENCES);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "true");
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setIsVisible(false);
    setShowSettings(false);
    setIsExpanded(false);
  };

  if (!isVisible) return null;

  // Compact banner (default state)
  if (!isExpanded && !showSettings) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 w-[calc(100%-3rem)] md:w-auto">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-4 max-w-sm mx-auto md:mx-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Cookie className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                We use cookies for analytics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={handleAcceptAll} className="flex-1 h-8 text-xs">
              <Check className="w-3 h-3 mr-1" />
              Accept All
            </Button>
            <Button size="sm" variant="outline" onClick={handleAcceptNecessary} className="h-8 text-xs">
              Necessary Only
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsExpanded(true)}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded banner
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 w-[calc(100%-3rem)] md:w-auto">
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl overflow-hidden max-w-sm mx-auto md:mx-0">
        {!showSettings ? (
          // Main consent banner (expanded)
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">We value your privacy</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => setIsExpanded(false)}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-muted-foreground text-xs mb-3 leading-relaxed">
              We use cookies to enhance your browsing experience and analyze our traffic. 
              Your conversations are always encrypted locally.{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Learn more
              </Link>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleAcceptAll} className="h-8 text-xs">
                <Check className="w-3 h-3 mr-1" />
                Accept All
              </Button>
              <Button size="sm" variant="outline" onClick={handleAcceptNecessary} className="h-8 text-xs">
                Necessary Only
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSettings(true)} className="h-8 text-xs">
                <Settings className="w-3 h-3 mr-1" />
                Customize
              </Button>
            </div>
          </div>
        ) : (
          // Settings panel
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Cookie Preferences</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSettings(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-2 mb-4">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-xs">Necessary</div>
                  <p className="text-xs text-muted-foreground">Required</p>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full flex items-center justify-end px-0.5">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-xs">Analytics</div>
                  <p className="text-xs text-muted-foreground">Usage data</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, analytics: !p.analytics }))}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    preferences.analytics ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </button>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium text-xs">Marketing</div>
                  <p className="text-xs text-muted-foreground">Personalized ads</p>
                </div>
                <button
                  onClick={() => setPreferences(p => ({ ...p, marketing: !p.marketing }))}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                    preferences.marketing ? "bg-primary justify-end" : "bg-muted-foreground/30 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={handleSavePreferences} className="flex-1 h-8 text-xs">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleAcceptAll} className="h-8 text-xs">
                Accept All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to check cookie preferences
export function useCookiePreferences(): CookiePreferences {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  return preferences;
}

// Function to reset cookie consent (for settings page)
export function resetCookieConsent() {
  localStorage.removeItem(COOKIE_CONSENT_KEY);
  localStorage.removeItem(COOKIE_PREFERENCES_KEY);
  window.location.reload();
}
