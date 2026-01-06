import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface KeyboardShortcutsOptions {
  onNewChat?: () => void;
  onSearch?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNewChat,
  onSearch,
  enabled = true,
}: KeyboardShortcutsOptions = {}) {
  const [, setLocation] = useLocation();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Cmd/Ctrl + K - Search/Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        }
      }

      // Cmd/Ctrl + N - New chat (only if not typing)
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !isTyping) {
        e.preventDefault();
        if (onNewChat) {
          onNewChat();
        } else {
          setLocation("/chat");
        }
      }

      // Escape - Close modals (handled by Radix UI automatically)
      
      // Cmd/Ctrl + / - Go to chat
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setLocation("/chat");
      }

      // Cmd/Ctrl + I - Go to images
      if ((e.metaKey || e.ctrlKey) && e.key === "i" && !isTyping) {
        e.preventDefault();
        setLocation("/image");
      }

      // Cmd/Ctrl + , - Go to settings
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setLocation("/settings");
      }
    },
    [onNewChat, onSearch, setLocation]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}

// Export shortcut hints for UI display
export const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Search / Command palette" },
  { keys: ["⌘", "N"], description: "New chat" },
  { keys: ["⌘", "/"], description: "Go to chat" },
  { keys: ["⌘", "I"], description: "Go to images" },
  { keys: ["⌘", ","], description: "Settings" },
  { keys: ["Esc"], description: "Close dialog" },
];
