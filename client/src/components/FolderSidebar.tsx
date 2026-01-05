import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  lastMessage?: string;
  timestamp: number;
}

interface FolderSidebarProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
}

const FOLDER_COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
];

export function FolderSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
}: FolderSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: number; name: string; color: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  const utils = trpc.useUtils();
  const { data: folders = [] } = trpc.folders.list.useQuery();
  const { data: mappings = [] } = trpc.folders.getAllMappings.useQuery();

  const createFolder = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      setIsCreateDialogOpen(false);
      setNewFolderName("");
      toast.success("Folder created");
    },
    onError: () => toast.error("Failed to create folder"),
  });

  const updateFolder = trpc.folders.update.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      setEditingFolder(null);
      toast.success("Folder updated");
    },
    onError: () => toast.error("Failed to update folder"),
  });

  const deleteFolder = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      utils.folders.getAllMappings.invalidate();
      toast.success("Folder deleted");
    },
    onError: () => toast.error("Failed to delete folder"),
  });

  const addToFolder = trpc.folders.addConversation.useMutation({
    onSuccess: () => {
      utils.folders.getAllMappings.invalidate();
      toast.success("Conversation moved to folder");
    },
    onError: () => toast.error("Failed to move conversation"),
  });

  const removeFromFolder = trpc.folders.removeConversation.useMutation({
    onSuccess: () => {
      utils.folders.getAllMappings.invalidate();
      toast.success("Conversation removed from folder");
    },
    onError: () => toast.error("Failed to remove conversation"),
  });

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getConversationsInFolder = (folderId: number) => {
    const conversationIds = mappings
      .filter((m) => m.folderId === folderId)
      .map((m) => m.conversationId);
    return conversations.filter((c) => conversationIds.includes(c.id));
  };

  const getUnfiledConversations = () => {
    const filedIds = new Set(mappings.map((m) => m.conversationId));
    return conversations.filter((c) => !filedIds.has(c.id));
  };

  const handleDragStart = (e: React.DragEvent, conversationId: string) => {
    e.dataTransfer.setData("conversationId", conversationId);
  };

  const handleDrop = (e: React.DragEvent, folderId: number | null) => {
    e.preventDefault();
    const conversationId = e.dataTransfer.getData("conversationId");
    if (!conversationId) return;

    if (folderId === null) {
      removeFromFolder.mutate({ conversationId });
    } else {
      addToFolder.mutate({ folderId, conversationId });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="font-semibold text-sm">Conversations</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform",
                      newFolderColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolderColor(color)}
                  />
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() => createFolder.mutate({ name: newFolderName, color: newFolderColor })}
                disabled={!newFolderName.trim() || createFolder.isPending}
              >
                Create Folder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onNewChat}>
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Folders and Conversations */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Folders */}
        {folders.map((folder) => {
          const folderConversations = getConversationsInFolder(folder.id);
          const isExpanded = expandedFolders.has(folder.id);

          return (
            <div key={folder.id}>
              <div
                className="flex items-center gap-1 p-2 rounded-md hover:bg-accent cursor-pointer group"
                onClick={() => toggleFolder(folder.id)}
                onDrop={(e) => handleDrop(e, folder.id)}
                onDragOver={handleDragOver}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Folder className="h-4 w-4" style={{ color: folder.color || "#6366f1" }} />
                <span className="flex-1 text-sm truncate">{folder.name}</span>
                <span className="text-xs text-muted-foreground">{folderConversations.length}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder({ id: folder.id, name: folder.name, color: folder.color || "#6366f1" });
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFolder.mutate({ folderId: folder.id });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Folder contents */}
              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {folderConversations.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">
                      Drag conversations here
                    </p>
                  ) : (
                    folderConversations.map((conv) => (
                      <div
                        key={conv.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, conv.id)}
                        onClick={() => onSelectConversation(conv.id)}
                        className={cn(
                          "p-2 rounded-md cursor-pointer text-sm truncate",
                          selectedConversationId === conv.id
                            ? "bg-primary/20 text-primary"
                            : "hover:bg-accent"
                        )}
                      >
                        {conv.title || "New conversation"}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unfiled Conversations */}
        <div
          className="mt-4"
          onDrop={(e) => handleDrop(e, null)}
          onDragOver={handleDragOver}
        >
          <p className="text-xs text-muted-foreground px-2 mb-2">Unfiled</p>
          {getUnfiledConversations().map((conv) => (
            <div
              key={conv.id}
              draggable
              onDragStart={(e) => handleDragStart(e, conv.id)}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "p-2 rounded-md cursor-pointer text-sm truncate",
                selectedConversationId === conv.id
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-accent"
              )}
            >
              {conv.title || "New conversation"}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          {editingFolder && (
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Folder name"
                value={editingFolder.name}
                onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform",
                      editingFolder.color === color && "ring-2 ring-offset-2 ring-primary scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditingFolder({ ...editingFolder, color })}
                  />
                ))}
              </div>
              <Button
                className="w-full"
                onClick={() =>
                  updateFolder.mutate({
                    folderId: editingFolder.id,
                    name: editingFolder.name,
                    color: editingFolder.color,
                  })
                }
                disabled={!editingFolder.name.trim() || updateFolder.isPending}
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
