/**
 * Search with AI Component
 * 
 * Provides Perplexity-style search with AI-generated summaries and citations
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Globe,
  Loader2,
  ExternalLink,
  BookOpen,
  Sparkles,
  X,
} from "lucide-react";

interface Source {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

interface SearchResult {
  query: string;
  summary: string;
  sources: Source[];
  citations: string[];
}

interface SearchWithAIProps {
  onInsertResult?: (result: string) => void;
  className?: string;
}

export function SearchWithAI({ onInsertResult, className }: SearchWithAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchMutation = trpc.webSearch.searchWithCitations.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsSearching(false);
      setError(null);
    },
    onError: (err) => {
      setError(err.message || "Search failed. Please try again.");
      setIsSearching(false);
    },
  });

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);
    
    searchMutation.mutate({
      query: query.trim(),
      maxSources: 5,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleInsert = () => {
    if (result && onInsertResult) {
      // Format the result with citations
      const formattedResult = `**Search Results for: "${result.query}"**\n\n${result.summary}\n\n**Sources:**\n${result.sources.map((s, i) => `[${i + 1}] ${s.title} - ${s.url}`).join("\n")}`;
      onInsertResult(formattedResult);
      setIsOpen(false);
    }
  };

  // Render summary with clickable citations
  const renderSummaryWithCitations = (summary: string, sources: Source[]) => {
    // Replace [1], [2], etc. with clickable links
    const parts = summary.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const sourceIndex = parseInt(match[1]) - 1;
        const source = sources[sourceIndex];
        if (source) {
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors mx-0.5"
                >
                  {match[1]}
                </a>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-medium text-sm">{source.title}</p>
                <p className="text-xs text-muted-foreground truncate">{source.url}</p>
              </TooltipContent>
            </Tooltip>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={`p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ${className}`}
            >
              <Globe className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Search the web with AI</TooltipContent>
        </Tooltip>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Search with AI
          </DialogTitle>
          <DialogDescription>
            Get AI-powered answers with sources from the web
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="pl-9"
              disabled={isSearching}
            />
          </div>
          <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Globe className="w-12 h-12 text-primary animate-pulse" />
              <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-bounce" />
            </div>
            <p className="text-muted-foreground">Searching the web and generating answer...</p>
          </div>
        )}

        {/* Results */}
        {result && !isSearching && (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4">
              {/* AI Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">AI Summary</span>
                </div>
                <div className="text-sm leading-relaxed">
                  {renderSummaryWithCitations(result.summary, result.sources)}
                </div>
              </div>

              {/* Sources */}
              {result.sources.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Sources ({result.sources.length})
                  </h4>
                  <div className="space-y-2">
                    {result.sources.map((source, index) => (
                      <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0">
                            {index + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                              {source.title}
                            </h5>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {source.snippet}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">{new URL(source.url).hostname}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Insert Button */}
              {onInsertResult && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleInsert} variant="outline" size="sm">
                    Insert into chat
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {!result && !isSearching && !error && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Ask a question to search the web with AI
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Get answers with inline citations from trusted sources
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SearchWithAI;
