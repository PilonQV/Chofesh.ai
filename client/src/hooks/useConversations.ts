import { useState, useEffect, useCallback } from "react";
import {
  Conversation,
  loadConversations,
  saveConversations,
  generateId,
} from "@/lib/encryption";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    async function load() {
      try {
        const loaded = await loadConversations();
        setConversations(loaded);
        if (loaded.length > 0) {
          setCurrentConversation(loaded[0]);
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

  return {
    conversations,
    currentConversation,
    isLoading,
    createConversation,
    addMessage,
    deleteConversation,
    clearAllConversations,
    selectConversation,
    updateConversationModel,
  };
}
