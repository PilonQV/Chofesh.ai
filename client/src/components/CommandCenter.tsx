import { useEffect, useState, useCallback } from "react";
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
  Wrench,
  Youtube,
  Globe,
  Calculator,
  ArrowRightLeft,
  Regex,
  Braces,
  GitCompare,
  Send,
  Brain,
  Search,
  FileText,
  BarChart3,
  CreditCard,
  Key,
  Moon,
  Sun,
  Sparkles,
  Shield,
  Database,
  Users,
  Code2,
  Palette,
  Home,
  LogOut,
  HelpCircle,
  Zap,
  ImagePlus,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

interface CommandCenterProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandCenter({ open: controlledOpen, onOpenChange }: CommandCenterProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { logout, isAuthenticated } = useAuth();

  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

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
          <CommandItem onSelect={() => navigateTo("/tools?tab=calculator")}>
            <Calculator className="mr-2 h-4 w-4 text-green-500" />
            <span>Math Calculator</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/tools?tab=converter")}>
            <ArrowRightLeft className="mr-2 h-4 w-4 text-purple-500" />
            <span>Unit Converter</span>
          </CommandItem>
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
          <CommandItem onSelect={() => navigateTo("/settings#nsfw-section")}>
            <Shield className="mr-2 h-4 w-4 text-pink-500" />
            <span>Uncensored Mode</span>
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

// Hook to use Command Center from anywhere
export function useCommandCenter() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen(prev => !prev), []);
  const openCommandCenter = useCallback(() => setOpen(true), []);
  const closeCommandCenter = useCallback(() => setOpen(false), []);

  return {
    open,
    setOpen,
    toggle,
    openCommandCenter,
    closeCommandCenter,
  };
}

export default CommandCenter;
