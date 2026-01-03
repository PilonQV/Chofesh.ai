import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Brain,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Lightbulb,
  User,
  FileText,
  MessageSquare,
  Star,
  StarOff,
  Search,
  Filter,
} from "lucide-react";
import { toast } from "sonner";

type MemoryCategory = "preference" | "fact" | "context" | "instruction";
type MemoryImportance = "low" | "medium" | "high";

interface Memory {
  id: number;
  content: string;
  category: MemoryCategory;
  importance: MemoryImportance;
  source: "user" | "auto";
  isActive: boolean;
  lastUsed: Date | null;
  createdAt: Date;
}

const CATEGORY_CONFIG = {
  preference: {
    label: "Preference",
    icon: User,
    color: "bg-blue-500/20 text-blue-500",
    description: "Your personal preferences (e.g., 'I prefer concise answers')",
  },
  fact: {
    label: "Fact",
    icon: FileText,
    color: "bg-green-500/20 text-green-500",
    description: "Important facts about you (e.g., 'I'm a software developer')",
  },
  context: {
    label: "Context",
    icon: MessageSquare,
    color: "bg-purple-500/20 text-purple-500",
    description: "Ongoing context (e.g., 'I'm working on a React project')",
  },
  instruction: {
    label: "Instruction",
    icon: Lightbulb,
    color: "bg-orange-500/20 text-orange-500",
    description: "How AI should behave (e.g., 'Always explain code step by step')",
  },
};

const IMPORTANCE_CONFIG = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-yellow-500/20 text-yellow-500" },
  high: { label: "High", color: "bg-red-500/20 text-red-500" },
};

export default function MemoryPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  // Form state
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryCategory>("fact");
  const [newImportance, setNewImportance] = useState<MemoryImportance>("medium");

  const utils = trpc.useUtils();
  
  const { data: memories, isLoading: memoriesLoading } = trpc.memories.list.useQuery(
    { activeOnly: false },
    { enabled: isAuthenticated }
  );

  const { data: preferences } = trpc.preferences.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.memories.create.useMutation({
    onSuccess: () => {
      toast.success("Memory added successfully");
      setAddDialogOpen(false);
      resetForm();
      utils.memories.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add memory");
    },
  });

  const updateMutation = trpc.memories.update.useMutation({
    onSuccess: () => {
      toast.success("Memory updated");
      setEditDialogOpen(false);
      setEditingMemory(null);
      utils.memories.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update memory");
    },
  });

  const deleteMutation = trpc.memories.delete.useMutation({
    onSuccess: () => {
      toast.success("Memory deleted");
      utils.memories.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete memory");
    },
  });

  const updatePrefsMutation = trpc.preferences.update.useMutation({
    onSuccess: () => {
      utils.preferences.get.invalidate();
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const resetForm = () => {
    setNewContent("");
    setNewCategory("fact");
    setNewImportance("medium");
  };

  const handleCreate = () => {
    if (!newContent.trim()) {
      toast.error("Please enter memory content");
      return;
    }
    createMutation.mutate({
      content: newContent.trim(),
      category: newCategory,
      importance: newImportance,
    });
  };

  const handleUpdate = () => {
    if (!editingMemory || !newContent.trim()) return;
    updateMutation.mutate({
      id: editingMemory.id,
      content: newContent.trim(),
      category: newCategory,
      importance: newImportance,
    });
  };

  const handleEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setNewContent(memory.content);
    setNewCategory(memory.category);
    setNewImportance(memory.importance);
    setEditDialogOpen(true);
  };

  const handleToggleActive = (memory: Memory) => {
    updateMutation.mutate({
      id: memory.id,
      isActive: !memory.isActive,
    });
  };

  const filteredMemories = memories?.filter((memory: Memory) => {
    const matchesSearch = memory.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || memory.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (authLoading || memoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">Memory</span>
            </div>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Memory</DialogTitle>
                <DialogDescription>
                  Add something you want the AI to remember about you.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>What should I remember?</Label>
                  <Textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="e.g., I prefer TypeScript over JavaScript"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newCategory} onValueChange={(v) => setNewCategory(v as MemoryCategory)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <config.icon className="w-4 h-4" />
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Importance</Label>
                    <Select value={newImportance} onValueChange={(v) => setNewImportance(v as MemoryImportance)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(IMPORTANCE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {CATEGORY_CONFIG[newCategory].description}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Add Memory"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Memory Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Memory Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Memory</Label>
                  <p className="text-sm text-muted-foreground">
                    AI will use your memories to personalize responses
                  </p>
                </div>
                <Switch
                  checked={preferences?.memoryEnabled ?? true}
                  onCheckedChange={(checked) => updatePrefsMutation.mutate({ memoryEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Extract Memories</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically learn from conversations (coming soon)
                  </p>
                </div>
                <Switch
                  checked={preferences?.autoExtractMemories ?? false}
                  onCheckedChange={(checked) => updatePrefsMutation.mutate({ autoExtractMemories: checked })}
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Memories List */}
          {filteredMemories.length > 0 ? (
            <div className="space-y-3">
              {filteredMemories.map((memory: Memory) => {
                const categoryConfig = CATEGORY_CONFIG[memory.category];
                const importanceConfig = IMPORTANCE_CONFIG[memory.importance];
                const CategoryIcon = categoryConfig.icon;
                
                return (
                  <Card key={memory.id} className={`transition-all ${!memory.isActive ? 'opacity-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${categoryConfig.color}`}>
                          <CategoryIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm mb-2">{memory.content}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={categoryConfig.color}>
                              {categoryConfig.label}
                            </Badge>
                            <Badge variant="outline" className={importanceConfig.color}>
                              {importanceConfig.label}
                            </Badge>
                            {memory.source === "auto" && (
                              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-500">
                                Auto-extracted
                              </Badge>
                            )}
                            {!memory.isActive && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(memory)}
                            title={memory.isActive ? "Disable" : "Enable"}
                          >
                            {memory.isActive ? (
                              <Star className="w-4 h-4 text-yellow-500" />
                            ) : (
                              <StarOff className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(memory)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Memory</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this memory? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMutation.mutate({ id: memory.id })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="font-semibold mb-2">
                  {searchQuery || filterCategory !== "all" ? "No matching memories" : "No memories yet"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {searchQuery || filterCategory !== "all" 
                    ? "Try adjusting your search or filter"
                    : "Add memories to help the AI understand you better. It will use these to personalize responses."}
                </p>
                {!searchQuery && filterCategory === "all" && (
                  <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Your First Memory
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Tips for Better Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Be specific:</strong> "I'm a React developer" is better than "I code"</li>
                <li>• <strong>Use preferences:</strong> Tell the AI how you like responses formatted</li>
                <li>• <strong>Add context:</strong> Share what you're currently working on</li>
                <li>• <strong>Set instructions:</strong> Define rules like "Always include code examples"</li>
                <li>• <strong>Prioritize:</strong> Mark important memories as "High" importance</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingMemory(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newCategory} onValueChange={(v) => setNewCategory(v as MemoryCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Importance</Label>
                <Select value={newImportance} onValueChange={(v) => setNewImportance(v as MemoryImportance)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IMPORTANCE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingMemory(null); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
