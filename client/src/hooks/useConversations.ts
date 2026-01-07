import { useState, useEffect, useCallback } from "react";
import {
  Conversation,
  ChatFolder,
  loadConversations,
  saveConversations,
  loadFolders,
  saveFolders,
  generateId,
} from "@/lib/encryption";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations and folders on mount
  useEffect(() => {
    async function load() {
      try {
        const [loadedConvs, loadedFolders] = await Promise.all([
          loadConversations(),
          loadFolders()
        ]);
        setConversations(loadedConvs);
        setFolders(loadedFolders);
        if (loadedConvs.length > 0) {
          setCurrentConversation(loadedConvs[0]);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Save conversations whenever they change
  const persistConversations = useCallback(async (convs: Conversation[]) => {
    try {
      await saveConversations(convs);
    } catch (error) {
      console.error("Failed to save conversations:", error);
    }
  }, []);

  const createConversation = useCallback((model: string = "default") => {
    const newConversation: Conversation = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setConversations((prev) => {
      const updated = [newConversation, ...prev];
      persistConversations(updated);
      return updated;
    });
    setCurrentConversation(newConversation);
    return newConversation;
  }, [persistConversations]);

  const addMessage = useCallback(
    (
      conversationId: string,
      role: "user" | "assistant" | "system",
      content: string
    ) => {
      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.id === conversationId) {
            const newMessages = [
              ...conv.messages,
              { role, content, timestamp: Date.now() },
            ];
            
            // Auto-generate title from first user message
            let title = conv.title;
            if (title === "New Chat" && role === "user") {
              title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
            }
            
            return {
              ...conv,
              messages: newMessages,
              title,
              updatedAt: Date.now(),
            };
          }
          return conv;
        });
        persistConversations(updated);
        return updated;
      });

      // Update current conversation if it's the one being modified
      setCurrentConversation((prev) => {
        if (prev?.id === conversationId) {
          const newMessages = [
            ...prev.messages,
            { role, content, timestamp: Date.now() },
          ];
          let title = prev.title;
          if (title === "New Chat" && role === "user") {
            title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
          }
          return { ...prev, messages: newMessages, title, updatedAt: Date.now() };
        }
        return prev;
      });
    },
    [persistConversations]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((conv) => conv.id !== id);
        persistConversations(updated);
        return updated;
      });
      
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    },
    [currentConversation, persistConversations]
  );

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    persistConversations([]);
  }, [persistConversations]);

  const selectConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentConversation(conv);
    }
  }, [conversations]);

  const updateConversationModel = useCallback(
    (id: string, model: string) => {
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === id ? { ...conv, model, updatedAt: Date.now() } : conv
        );
        persistConversations(updated);
        return updated;
      });
      
      if (currentConversation?.id === id) {
        setCurrentConversation((prev) =>
          prev ? { ...prev, model, updatedAt: Date.now() } : null
        );
      }
    },
    [currentConversation, persistConversations]
  );

  // Folder management
  const createFolder = useCallback((name: string, color?: string) => {
    const newFolder: ChatFolder = {
      id: generateId(),
      name,
      color: color || "#6366f1",
      createdAt: Date.now(),
    };
    setFolders((prev) => {
      const updated = [...prev, newFolder];
      saveFolders(updated);
      return updated;
    });
    return newFolder;
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    // Remove folder and unassign all conversations in it
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      saveFolders(updated);
      return updated;
    });
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.folderId === folderId ? { ...conv, folderId: undefined } : conv
      );
      persistConversations(updated);
      return updated;
    });
  }, [persistConversations]);

  const renameFolder = useCallback((folderId: string, newName: string) => {
    setFolders((prev) => {
      const updated = prev.map((f) =>
        f.id === folderId ? { ...f, name: newName } : f
      );
      saveFolders(updated);
      return updated;
    });
  }, []);

  const moveToFolder = useCallback((conversationId: string, folderId: string | undefined) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === conversationId ? { ...conv, folderId, updatedAt: Date.now() } : conv
      );
      persistConversations(updated);
      return updated;
    });
    if (currentConversation?.id === conversationId) {
      setCurrentConversation((prev) =>
        prev ? { ...prev, folderId, updatedAt: Date.now() } : null
      );
    }
  }, [currentConversation, persistConversations]);

  // Pin/unpin conversations
  const togglePin = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === conversationId ? { ...conv, pinned: !conv.pinned, updatedAt: Date.now() } : conv
      );
      persistConversations(updated);
      return updated;
    });
    if (currentConversation?.id === conversationId) {
      setCurrentConversation((prev) =>
        prev ? { ...prev, pinned: !prev.pinned, updatedAt: Date.now() } : null
      );
    }
  }, [currentConversation, persistConversations]);

  // Get sorted conversations (pinned first, then by date)
  const sortedConversations = useCallback(() => {
    return [...conversations].sort((a, b) => {
      // Pinned items first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then by date
      return b.updatedAt - a.updatedAt;
    });
  }, [conversations]);

  // Mark conversation as having used uncensored content
  const markAsUncensored = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === conversationId ? { ...conv, usedUncensored: true, updatedAt: Date.now() } : conv
      );
      persistConversations(updated);
      return updated;
    });
    if (currentConversation?.id === conversationId) {
      setCurrentConversation((prev) =>
        prev ? { ...prev, usedUncensored: true, updatedAt: Date.now() } : null
      );
    }
  }, [currentConversation, persistConversations]);

  return {
    conversations,
    currentConversation,
    folders,
    isLoading,
    createConversation,
    addMessage,
    deleteConversation,
    clearAllConversations,
    selectConversation,
    updateConversationModel,
    // Folder functions
    createFolder,
    deleteFolder,
    renameFolder,
    moveToFolder,
    // Pin functions
    togglePin,
    sortedConversations,
    // Uncensored tracking
    markAsUncensored,
  };
}
