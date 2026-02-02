import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  MessageSquare,
  Image,
  Settings,
  Youtube,
  Globe,
  Calculator,
  ArrowRightLeft,
  Regex,
  Braces,
  GitCompare,
  Send,
  Brain,
  FileText,
  BarChart3,
  CreditCard,
  Key,
  Moon,
  Sun,
  Shield,
  Database,
  Users,
  Code2,
  Palette,
  Home,
  LogOut,
  ImagePlus,
  HelpCircle,
  Video,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

// Context for Command Center state
interface CommandCenterContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openCommandCenter: () => void;
  closeCommandCenter: () => void;
}

const CommandCenterContext = createContext<CommandCenterContextType | null>(null);

// Provider component
export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen(prev => !prev), []);
  const openCommandCenter = useCallback(() => setOpen(true), []);
  const closeCommandCenter = useCallback(() => setOpen(false), []);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandCenterContext.Provider value={{ open, setOpen, toggle, openCommandCenter, closeCommandCenter }}>
      {children}
      <CommandCenterDialog />
    </CommandCenterContext.Provider>
  );
}

// Hook to use Command Center from anywhere
export function useCommandCenter() {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error("useCommandCenter must be used within a CommandCenterProvider");
  }
  return context;
}

// The actual Command Center dialog
function CommandCenterDialog() {
  const { open, setOpen } = useCommandCenter();
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, isAuthenticated } = useAuth();

  const runCommand = useCallback((command: (() => void) | undefined) => {
    setOpen(false);
    if (command) command();
  }, [setOpen]);

  const navigateTo = useCallback((path: string) => {
    runCommand(() => setLocation(path));
  }, [runCommand, setLocation]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Command Center">
      <CommandInput placeholder="Search tools, settings, and actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigateTo("/chat")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/image")}>
            <ImagePlus className="mr-2 h-4 w-4" />
            <span>Generate Image</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(toggleTheme)}>
            {theme === "dark" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Moon className="mr-2 h-4 w-4" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Smart Tools */}
        <CommandGroup heading="Smart Tools">
          <CommandItem onSelect={() => navigateTo("/tools?tab=youtube")}>
            <Youtube className="mr-2 h-4 w-4 text-red-500" />
            <span>YouTube Summarizer</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/tools?tab=scraper")}>
            <Globe className="mr-2 h-4 w-4 text-blue-500" />
            <span>URL Analyzer</span>
          </CommandItem>
          {/* Removed Math Calculator and Unit Converter - too elementary */}
        </CommandGroup>

        <CommandSeparator />

        {/* Developer Tools */}
        <CommandGroup heading="Developer Tools">
          <CommandItem onSelect={() => navigateTo("/tools?tab=regex")}>
            <Regex className="mr-2 h-4 w-4 text-orange-500" />
            <span>Regex Tester</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/tools?tab=json")}>
            <Braces className="mr-2 h-4 w-4 text-yellow-500" />
            <span>JSON Formatter</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/tools?tab=diff")}>
            <GitCompare className="mr-2 h-4 w-4 text-cyan-500" />
            <span>Diff Viewer</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/tools?tab=api")}>
            <Send className="mr-2 h-4 w-4 text-pink-500" />
            <span>API Tester</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/code")}>
            <Code2 className="mr-2 h-4 w-4" />
            <span>Code Workspace</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* AI Features */}
        <CommandGroup heading="AI Features">
          <CommandItem onSelect={() => navigateTo("/chat")}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat with AI</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/image")}>
            <Image className="mr-2 h-4 w-4" />
            <span>Image Generation</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/gallery")}>
            <Palette className="mr-2 h-4 w-4" />
            <span>My Gallery</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/knowledge")}>
            <Database className="mr-2 h-4 w-4" />
            <span>Knowledge Base</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/memory")}>
            <Brain className="mr-2 h-4 w-4" />
            <span>AI Memory</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/personas")}>
            <Users className="mr-2 h-4 w-4" />
            <span>AI Personas</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Settings & Account */}
        <CommandGroup heading="Settings & Account">
          <CommandItem onSelect={() => navigateTo("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => navigateTo("/credits")}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Buy Credits</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/usage")}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Usage Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/settings")}>
            <Key className="mr-2 h-4 w-4" />
            <span>API Keys (BYOK)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigateTo("/")}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/privacy")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Privacy Policy</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/terms")}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Terms of Service</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/support")}>
            <HelpCircle className="mr-2 h-4 w-4 text-green-500" />
            <span>Customer Support</span>
          </CommandItem>
          {isAuthenticated && (
            <CommandItem onSelect={() => runCommand(async () => {
              await logout();
              window.location.href = "/";
            })}>
              <LogOut className="mr-2 h-4 w-4 text-red-500" />
              <span>Logout</span>
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default CommandCenterProvider;
