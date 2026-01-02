import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Users,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
  Loader2,
  Globe,
  Lock,
  Bot,
  Wand2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface CharacterFormData {
  name: string;
  description: string;
  systemPrompt: string;
  avatarUrl: string;
  personality: string;
  isPublic: boolean;
}

const DEFAULT_FORM: CharacterFormData = {
  name: "",
  description: "",
  systemPrompt: "",
  avatarUrl: "",
  personality: "",
  isPublic: false,
};

const PERSONALITY_PRESETS = [
  { name: "Friendly Assistant", prompt: "You are a friendly and helpful AI assistant. You speak in a warm, conversational tone and always try to be encouraging and supportive." },
  { name: "Expert Analyst", prompt: "You are an expert analyst with deep knowledge across many fields. You provide detailed, well-researched responses with clear reasoning and evidence." },
  { name: "Creative Writer", prompt: "You are a creative writer with a vivid imagination. You craft engaging stories, poems, and creative content with rich descriptions and compelling narratives." },
  { name: "Code Mentor", prompt: "You are an experienced software developer and mentor. You explain coding concepts clearly, provide clean code examples, and help debug issues patiently." },
  { name: "Socratic Teacher", prompt: "You are a Socratic teacher who guides learning through questions. Instead of giving direct answers, you ask thought-provoking questions to help users discover insights themselves." },
];

export default function Characters() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<number | null>(null);
  const [formData, setFormData] = useState<CharacterFormData>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState("my");

  const { data: myCharacters, refetch: refetchMy } = trpc.characters.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: publicCharacters, refetch: refetchPublic } = trpc.characters.listPublic.useQuery();

  const createMutation = trpc.characters.create.useMutation({
    onSuccess: () => {
      toast.success("Character created!");
      setIsCreateOpen(false);
      setFormData(DEFAULT_FORM);
      refetchMy();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.characters.update.useMutation({
    onSuccess: () => {
      toast.success("Character updated!");
      setEditingCharacter(null);
      setFormData(DEFAULT_FORM);
      refetchMy();
      refetchPublic();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = trpc.characters.remove.useMutation({
    onSuccess: () => {
      toast.success("Character deleted!");
      refetchMy();
      refetchPublic();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.systemPrompt.trim()) {
      toast.error("Name and system prompt are required");
      return;
    }

    if (editingCharacter) {
      updateMutation.mutate({
        id: editingCharacter,
        name: formData.name,
        description: formData.description || undefined,
        systemPrompt: formData.systemPrompt,
        avatarUrl: formData.avatarUrl || undefined,
        personality: formData.personality || undefined,
        isPublic: formData.isPublic,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
        systemPrompt: formData.systemPrompt,
        avatarUrl: formData.avatarUrl || undefined,
        personality: formData.personality || undefined,
        isPublic: formData.isPublic,
      });
    }
  };

  const handleEdit = (character: any) => {
    setFormData({
      name: character.name,
      description: character.description || "",
      systemPrompt: character.systemPrompt,
      avatarUrl: character.avatarUrl || "",
      personality: character.personality || "",
      isPublic: character.isPublic,
    });
    setEditingCharacter(character.id);
    setIsCreateOpen(true);
  };

  const handleUseInChat = (character: any) => {
    // Store character in session storage for chat to pick up
    sessionStorage.setItem("selectedCharacter", JSON.stringify({
      id: character.id,
      name: character.name,
      systemPrompt: character.systemPrompt,
    }));
    setLocation("/chat");
    toast.success(`Using ${character.name} in chat`);
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("System prompt copied!");
  };

  const handlePresetSelect = (prompt: string) => {
    setFormData(prev => ({ ...prev, systemPrompt: prompt }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const CharacterCard = ({ character, isOwner }: { character: any; isOwner: boolean }) => (
    <Card className="group hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {character.avatarUrl ? (
                <img src={character.avatarUrl} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <Bot className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{character.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {character.isPublic ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {character.usageCount} uses
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {character.description && (
          <CardDescription className="line-clamp-2">
            {character.description}
          </CardDescription>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleUseInChat(character)}>
            <MessageSquare className="w-4 h-4 mr-1" />
            Chat
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleCopyPrompt(character.systemPrompt)}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>
          {isOwner && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleEdit(character)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this character?")) {
                    deleteMutation.mutate({ id: character.id });
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-card border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold gradient-text">Chofesh</span>
          </Link>
          <div className="text-sm font-medium text-muted-foreground">
            AI Characters
          </div>
        </div>

        <div className="p-4 space-y-2">
          <Link href="/chat">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </Button>
          </Link>
          <Link href="/image">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <ImageIcon className="w-4 h-4" />
              Image Generation
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="ghost" className="w-full justify-start gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name || "User"}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">AI Characters</h1>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingCharacter(null);
              setFormData(DEFAULT_FORM);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Character
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCharacter ? "Edit Character" : "Create AI Character"}
                </DialogTitle>
                <DialogDescription>
                  Create a custom AI persona with its own personality and behavior.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Creative Writing Coach"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this character"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="systemPrompt">System Prompt *</Label>
                    <div className="flex gap-1">
                      {PERSONALITY_PRESETS.map((preset) => (
                        <Button
                          key={preset.name}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handlePresetSelect(preset.prompt)}
                        >
                          {preset.name.split(" ")[0]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    id="systemPrompt"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="Define the character's personality, knowledge, and behavior..."
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt defines how the AI will behave and respond.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                  <Input
                    id="avatarUrl"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatarUrl: e.target.value }))}
                    placeholder="https://example.com/avatar.png"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Make Public</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow others to discover and use this character
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingCharacter ? "Save Changes" : "Create Character"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="my" className="gap-2">
                  <Lock className="w-4 h-4" />
                  My Characters
                </TabsTrigger>
                <TabsTrigger value="public" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Public Characters
                </TabsTrigger>
              </TabsList>

              <TabsContent value="my">
                {myCharacters?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Characters Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first AI character to get started.
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Character
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {myCharacters?.map((character) => (
                      <CharacterCard key={character.id} character={character} isOwner={true} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="public">
                {publicCharacters?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Public Characters</h3>
                    <p className="text-muted-foreground">
                      Be the first to share a character with the community!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {publicCharacters?.map((character) => (
                      <CharacterCard
                        key={character.id}
                        character={character}
                        isOwner={character.userId === user?.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
