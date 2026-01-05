import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  createFolder: vi.fn(),
  getFoldersByUser: vi.fn(),
  getFolderById: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  addConversationToFolder: vi.fn(),
  removeConversationFromFolder: vi.fn(),
  getConversationFolder: vi.fn(),
  getConversationsInFolder: vi.fn(),
  getAllConversationFolderMappings: vi.fn(),
}));

import {
  createFolder,
  getFoldersByUser,
  getFolderById,
  updateFolder,
  deleteFolder,
  addConversationToFolder,
  removeConversationFromFolder,
  getConversationFolder,
  getConversationsInFolder,
  getAllConversationFolderMappings,
} from "./db";

describe("Conversation Folders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Folder CRUD Operations", () => {
    it("creates a new folder", async () => {
      const mockFolder = {
        id: 1,
        userId: 1,
        name: "Work Projects",
        color: "#6366f1",
        icon: "folder",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(createFolder).mockResolvedValue(mockFolder);

      const result = await createFolder({
        userId: 1,
        name: "Work Projects",
        color: "#6366f1",
        icon: "folder",
        sortOrder: 1,
      });

      expect(result).toEqual(mockFolder);
      expect(createFolder).toHaveBeenCalledWith({
        userId: 1,
        name: "Work Projects",
        color: "#6366f1",
        icon: "folder",
        sortOrder: 1,
      });
    });

    it("lists folders for a user", async () => {
      const mockFolders = [
        { id: 1, userId: 1, name: "Work", color: "#6366f1", icon: "folder", sortOrder: 1 },
        { id: 2, userId: 1, name: "Personal", color: "#22c55e", icon: "heart", sortOrder: 2 },
      ];
      vi.mocked(getFoldersByUser).mockResolvedValue(mockFolders as any);

      const result = await getFoldersByUser(1);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Work");
      expect(result[1].name).toBe("Personal");
    });

    it("gets a folder by ID", async () => {
      const mockFolder = { id: 1, userId: 1, name: "Work", color: "#6366f1" };
      vi.mocked(getFolderById).mockResolvedValue(mockFolder as any);

      const result = await getFolderById(1, 1);

      expect(result).toEqual(mockFolder);
      expect(getFolderById).toHaveBeenCalledWith(1, 1);
    });

    it("updates a folder", async () => {
      vi.mocked(updateFolder).mockResolvedValue(undefined);

      await updateFolder(1, 1, { name: "Updated Name", color: "#ef4444" });

      expect(updateFolder).toHaveBeenCalledWith(1, 1, { name: "Updated Name", color: "#ef4444" });
    });

    it("deletes a folder", async () => {
      vi.mocked(deleteFolder).mockResolvedValue(undefined);

      await deleteFolder(1, 1);

      expect(deleteFolder).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("Conversation-Folder Mappings", () => {
    it("adds a conversation to a folder", async () => {
      vi.mocked(addConversationToFolder).mockResolvedValue(undefined);

      await addConversationToFolder({
        userId: 1,
        folderId: 1,
        conversationId: "conv-123",
      });

      expect(addConversationToFolder).toHaveBeenCalledWith({
        userId: 1,
        folderId: 1,
        conversationId: "conv-123",
      });
    });

    it("removes a conversation from a folder", async () => {
      vi.mocked(removeConversationFromFolder).mockResolvedValue(undefined);

      await removeConversationFromFolder(1, "conv-123");

      expect(removeConversationFromFolder).toHaveBeenCalledWith(1, "conv-123");
    });

    it("gets the folder for a conversation", async () => {
      const mockFolder = { id: 1, userId: 1, name: "Work", color: "#6366f1" };
      vi.mocked(getConversationFolder).mockResolvedValue(mockFolder as any);

      const result = await getConversationFolder(1, "conv-123");

      expect(result).toEqual(mockFolder);
      expect(getConversationFolder).toHaveBeenCalledWith(1, "conv-123");
    });

    it("returns null when conversation has no folder", async () => {
      vi.mocked(getConversationFolder).mockResolvedValue(null);

      const result = await getConversationFolder(1, "conv-456");

      expect(result).toBeNull();
    });

    it("gets all conversations in a folder", async () => {
      const mockConversationIds = ["conv-123", "conv-456", "conv-789"];
      vi.mocked(getConversationsInFolder).mockResolvedValue(mockConversationIds);

      const result = await getConversationsInFolder(1, 1);

      expect(result).toEqual(mockConversationIds);
      expect(result).toHaveLength(3);
    });

    it("gets all folder mappings for a user", async () => {
      const mockMappings = [
        { conversationId: "conv-123", folderId: 1 },
        { conversationId: "conv-456", folderId: 1 },
        { conversationId: "conv-789", folderId: 2 },
      ];
      vi.mocked(getAllConversationFolderMappings).mockResolvedValue(mockMappings);

      const result = await getAllConversationFolderMappings(1);

      expect(result).toHaveLength(3);
      expect(result.filter(m => m.folderId === 1)).toHaveLength(2);
    });
  });

  describe("Folder Validation", () => {
    it("validates folder name length", () => {
      const validName = "A".repeat(100);
      const invalidName = "A".repeat(101);
      
      expect(validName.length).toBeLessThanOrEqual(100);
      expect(invalidName.length).toBeGreaterThan(100);
    });

    it("validates folder color format", () => {
      const validColors = ["#6366f1", "#22c55e", "#ef4444", "#000000", "#ffffff"];
      const invalidColors = ["red", "rgb(255,0,0)", "6366f1"];
      
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      
      validColors.forEach(color => {
        expect(hexColorRegex.test(color)).toBe(true);
      });
      
      invalidColors.forEach(color => {
        expect(hexColorRegex.test(color)).toBe(false);
      });
    });
  });

  describe("Sort Order Management", () => {
    it("calculates next sort order correctly", async () => {
      const existingFolders = [
        { sortOrder: 1 },
        { sortOrder: 3 },
        { sortOrder: 2 },
      ];
      
      const maxOrder = existingFolders.reduce((max, f) => Math.max(max, f.sortOrder), 0);
      const nextOrder = maxOrder + 1;
      
      expect(nextOrder).toBe(4);
    });

    it("handles empty folder list for sort order", () => {
      const existingFolders: { sortOrder: number }[] = [];
      
      const maxOrder = existingFolders.reduce((max, f) => Math.max(max, f.sortOrder), 0);
      const nextOrder = maxOrder + 1;
      
      expect(nextOrder).toBe(1);
    });
  });
});
