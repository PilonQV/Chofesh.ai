import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
import { useState, useEffect, useMemo } from "react";
import {
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
  Copy,
  Search,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  CURATED_PERSONAS,
  PERSONA_CATEGORIES,
  getPopularPersonas,
  searchPersonas,
  type Persona,
  type PersonaCategory,
} from "@shared/personas";

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

export default function Characters() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<number | null>(null);
  const [formData, setFormData] = useState<CharacterFormData>(DEFAULT_FORM);
  const [activeTab, setActiveTab] = useState("library");
  const [selectedCategory, setSelectedCategory] = useState<PersonaCategory | "all" | "popular">("popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPersona, setPreviewPersona] = useState<Persona | null>(null);

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

  // Filter personas based on category and search
  const filteredPersonas = useMemo(() => {
    let personas = CURATED_PERSONAS;
    
    if (searchQuery) {
      personas = searchPersonas(searchQuery);
    } else if (selectedCategory === "popular") {
      personas = getPopularPersonas();
    } else if (selectedCategory !== "all") {
      personas = CURATED_PERSONAS.filter(p => p.category === selectedCategory);
    }
    
    return personas;
  }, [selectedCategory, searchQuery]);

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

  const handleUseInChat = (character: { id?: number; name: string; systemPrompt: string }) => {
    sessionStorage.setItem("selectedCharacter", JSON.stringify({
      id: character.id,
      name: character.name,
      systemPrompt: character.systemPrompt,
    }));
    setLocation("/chat");
    toast.success(`Using ${character.name} in chat`);
  };

  const handleUsePersonaInChat = (persona: Persona) => {
    sessionStorage.setItem("selectedCharacter", JSON.stringify({
      id: `persona-${persona.id}`,
      name: persona.name,
      systemPrompt: persona.systemPrompt,
    }));
    setLocation("/chat");
    toast.success(`Using ${persona.name} in chat`);
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("System prompt copied!");
  };

  const handleSavePersonaAsCharacter = (persona: Persona) => {
    setFormData({
      name: persona.name,
      description: persona.description,
      systemPrompt: persona.systemPrompt,
      avatarUrl: "",
      personality: persona.tags.join(", "),
      isPublic: false,
    });
    setIsCreateOpen(true);
    setPreviewPersona(null);
    toast.info("Customize and save as your own character");
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

  const PersonaCard = ({ persona }: { persona: Persona }) => (
    <Card 
      className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-lg"
      onClick={() => setPreviewPersona(persona)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
              {persona.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{persona.name}</CardTitle>
                {persona.isPopular && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <Badge variant="secondary" className="text-xs mt-1">
                {PERSONA_CATEGORIES.find(c => c.id === persona.category)?.name}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="line-clamp-2">
          {persona.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1">
          {persona.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              handleUsePersonaInChat(persona);
            }}
          >
            <Zap className="w-4 h-4 mr-1" />
            Use Now
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyPrompt(persona.systemPrompt);
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
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
            <img src="/chofesh-logo.png" alt="Chofesh" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold gradient-text">Chofesh</span>
          </Link>
          <div className="text-sm font-medium text-muted-foreground">
            AI Personas & Characters
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
            <h1 className="font-semibold">AI Personas & Characters</h1>
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
                Create Custom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCharacter ? "Edit Character" : "Create Custom Character"}
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
                  <Label htmlFor="systemPrompt">System Prompt *</Label>
                  <Textarea
                    id="systemPrompt"
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                    placeholder="Define the character's personality, knowledge, and behavior..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    This prompt defines how the AI will behave and respond. Be specific about personality, expertise, and communication style.
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
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="library" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Persona Library
                </TabsTrigger>
                <TabsTrigger value="my" className="gap-2">
                  <Lock className="w-4 h-4" />
                  My Characters
                </TabsTrigger>
                <TabsTrigger value="public" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Community
                </TabsTrigger>
              </TabsList>

              <TabsContent value="library" className="space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search personas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "popular" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedCategory("popular"); setSearchQuery(""); }}
                    className="gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Popular
                  </Button>
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setSelectedCategory("all"); setSearchQuery(""); }}
                  >
                    All
                  </Button>
                  {PERSONA_CATEGORIES.map(cat => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setSelectedCategory(cat.id); setSearchQuery(""); }}
                      className="gap-1"
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </Button>
                  ))}
                </div>

                {/* Personas Grid */}
                {filteredPersonas.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Personas Found</h3>
                    <p className="text-muted-foreground">
                      Try a different search term or category.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredPersonas.map((persona) => (
                      <PersonaCard key={persona.id} persona={persona} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my">
                {myCharacters?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Custom Characters Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your own or save a persona from the library.
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
                    <h3 className="text-lg font-semibold mb-2">No Community Characters</h3>
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

      {/* Persona Preview Dialog */}
      <Dialog open={!!previewPersona} onOpenChange={(open) => !open && setPreviewPersona(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewPersona && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-3xl">
                    {previewPersona.avatarEmoji}
                  </div>
                  <div>
                    <DialogTitle className="text-xl flex items-center gap-2">
                      {previewPersona.name}
                      {previewPersona.isPopular && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {previewPersona.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {PERSONA_CATEGORIES.find(c => c.id === previewPersona.category)?.icon}{" "}
                    {PERSONA_CATEGORIES.find(c => c.id === previewPersona.category)?.name}
                  </Badge>
                  {previewPersona.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Prompt</Label>
                  <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {previewPersona.systemPrompt}
                    </pre>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleCopyPrompt(previewPersona.systemPrompt)}
                  className="w-full sm:w-auto"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSavePersonaAsCharacter(previewPersona)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Save as Custom
                </Button>
                <Button
                  onClick={() => {
                    handleUsePersonaInChat(previewPersona);
                    setPreviewPersona(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
