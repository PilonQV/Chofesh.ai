import { useState, useCallback, useMemo } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { MessageSquare, RefreshCw, Download, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AskDiaLinksProps {
  content: string;
  onAskFollowUp: (question: string) => void;
  onImageRegenerated?: (oldUrl: string, newUrl: string) => void;
}

// Keywords and concepts that should be clickable
const CLICKABLE_PATTERNS = [
  // Technical terms
  /\b(API|REST|GraphQL|WebSocket|OAuth|JWT|CORS|SSL|TLS|HTTP|HTTPS)\b/gi,
  // Programming concepts
  /\b(algorithm|function|variable|class|object|array|string|boolean|integer|float|recursion|iteration|callback|promise|async|await)\b/gi,
  // AI/ML terms
  /\b(machine learning|deep learning|neural network|transformer|LLM|GPT|embedding|vector|tokenization|fine-tuning|prompt engineering)\b/gi,
  // Database terms
  /\b(database|SQL|NoSQL|query|index|schema|migration|ORM|transaction|ACID)\b/gi,
  // Security terms
  /\b(encryption|authentication|authorization|vulnerability|XSS|CSRF|injection|firewall|hash)\b/gi,
  // Cloud/DevOps
  /\b(Docker|Kubernetes|container|microservice|serverless|CI\/CD|deployment|scaling|load balancer)\b/gi,
  // Frameworks/Libraries (common ones)
  /\b(React|Vue|Angular|Node\.js|Express|Django|Flask|Spring|Laravel)\b/gi,
];

// Extract clickable terms from content
function extractClickableTerms(content: string): Set<string> {
  const terms = new Set<string>();
  
  for (const pattern of CLICKABLE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => terms.add(match.toLowerCase()));
    }
  }
  
  return terms;
}

// Generate follow-up question for a term
function generateFollowUpQuestion(term: string): string {
  const lowerTerm = term.toLowerCase();
  
  // Customize questions based on term type
  if (/^(api|rest|graphql|websocket)$/i.test(term)) {
    return `Can you explain more about ${term} and how it works?`;
  }
  if (/^(react|vue|angular|node\.js|express)$/i.test(term)) {
    return `Tell me more about ${term} - what are its key features and when should I use it?`;
  }
  if (/^(machine learning|deep learning|neural network|llm|gpt)$/i.test(term)) {
    return `Can you explain ${term} in simple terms? How does it work?`;
  }
  if (/^(encryption|authentication|xss|csrf|injection)$/i.test(term)) {
    return `What is ${term} and how can I protect against related security issues?`;
  }
  if (/^(docker|kubernetes|container|microservice)$/i.test(term)) {
    return `Explain ${term} - what problem does it solve and how do I get started?`;
  }
  
  // Default question
  return `Tell me more about ${term}`;
}

// Check if content contains markdown images
function containsMarkdownImages(content: string): boolean {
  return /!\[.*?\]\(.*?\)/.test(content);
}

// Image component with hover actions
function ChatImage({ 
  imageUrl, 
  altText, 
  onRegenerate,
  isRegenerating 
}: { 
  imageUrl: string; 
  altText: string;
  onRegenerate?: (prompt: string) => void;
  isRegenerating?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Extract prompt from alt text (format: "prompt - 1" or just "prompt")
  const prompt = altText.replace(/\s*-\s*\d+$/, '').trim();
  
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };
  
  return (
    <div 
      className="my-4 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={imageUrl}
        alt={altText}
        className={`max-w-full h-auto rounded-lg shadow-lg transition-opacity ${isRegenerating ? 'opacity-50' : ''}`}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('a');
          fallback.href = imageUrl;
          fallback.target = '_blank';
          fallback.rel = 'noopener noreferrer';
          fallback.textContent = `View image: ${altText}`;
          fallback.className = 'text-primary underline';
          target.parentNode?.appendChild(fallback);
        }}
      />
      
      {/* Regenerating overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="flex items-center gap-2 bg-background/90 px-3 py-2 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Regenerating...</span>
          </div>
        </div>
      )}
      
      {/* Hover actions */}
      {isHovered && !isRegenerating && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onRegenerate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 bg-background/90 hover:bg-background"
                  onClick={() => onRegenerate(prompt)}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Regenerate (1 credit)</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-background/90 hover:bg-background"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Download</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      
      {altText && <p className="text-sm text-muted-foreground mt-2 italic">{altText}</p>}
    </div>
  );
}

// Render content with inline images that have regenerate capability
function RenderWithImages({ 
  content, 
  onImageRegenerated 
}: { 
  content: string;
  onImageRegenerated?: (oldUrl: string, newUrl: string) => void;
}) {
  const [regeneratingUrls, setRegeneratingUrls] = useState<Set<string>>(new Set());
  
  const regenerateMutation = trpc.images.regenerateSingle.useMutation({
    onSuccess: (data, variables) => {
      setRegeneratingUrls(prev => {
        const next = new Set(prev);
        next.delete(variables.originalUrl);
        return next;
      });
      if (onImageRegenerated) {
        onImageRegenerated(variables.originalUrl, data.url);
      }
      toast.success('Image regenerated! (1 credit used)');
    },
    onError: (error) => {
      setRegeneratingUrls(new Set());
      toast.error(error.message || 'Failed to regenerate image');
    },
  });
  
  const handleRegenerate = (imageUrl: string, prompt: string) => {
    setRegeneratingUrls(prev => new Set(prev).add(imageUrl));
    regenerateMutation.mutate({ prompt, originalUrl: imageUrl });
  };
  
  const parts: React.ReactNode[] = [];
  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = imageRegex.exec(content)) !== null) {
    // Add text before the image
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      parts.push(<Streamdown key={`text-${key++}`}>{textBefore}</Streamdown>);
    }

    // Add the image with regenerate capability
    const altText = match[1];
    const imageUrl = match[2];
    parts.push(
      <ChatImage
        key={`img-${key++}`}
        imageUrl={imageUrl}
        altText={altText}
        onRegenerate={(prompt) => handleRegenerate(imageUrl, prompt)}
        isRegenerating={regeneratingUrls.has(imageUrl)}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last image
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    parts.push(<Streamdown key={`text-${key++}`}>{remainingText}</Streamdown>);
  }

  return <>{parts}</>;
}

export function AskDiaLinks({ content, onAskFollowUp, onImageRegenerated }: AskDiaLinksProps) {
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);
  
  // If content contains markdown images, render them specially with regenerate capability
  if (containsMarkdownImages(content)) {
    return (
      <div className="ask-dia-links">
        <RenderWithImages content={content} onImageRegenerated={onImageRegenerated} />
      </div>
    );
  }
  
  const clickableTerms = useMemo(() => extractClickableTerms(content), [content]);
  
  const handleTermClick = useCallback((term: string) => {
    const question = generateFollowUpQuestion(term);
    onAskFollowUp(question);
  }, [onAskFollowUp]);
  
  // If no clickable terms, just render with Streamdown
  if (clickableTerms.size === 0) {
    return <Streamdown>{content}</Streamdown>;
  }
  
  // Create a pattern to match all clickable terms
  const allTermsPattern = new RegExp(
    `\\b(${Array.from(clickableTerms).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
    'gi'
  );
  
  // Split content and wrap clickable terms
  const parts = content.split(allTermsPattern);
  
  return (
    <div className="ask-dia-links">
      {parts.map((part, index) => {
        const isClickable = clickableTerms.has(part.toLowerCase());
        
        if (isClickable) {
          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleTermClick(part)}
                  onMouseEnter={() => setHoveredTerm(part)}
                  onMouseLeave={() => setHoveredTerm(null)}
                  className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 underline decoration-dotted underline-offset-2 cursor-pointer transition-colors"
                >
                  {part}
                  <MessageSquare className="w-3 h-3 opacity-50" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">Click to ask: "{generateFollowUpQuestion(part)}"</p>
              </TooltipContent>
            </Tooltip>
          );
        }
        
        // For non-clickable parts, render with Streamdown for markdown support
        return <Streamdown key={index}>{part}</Streamdown>;
      })}
    </div>
  );
}

export default AskDiaLinks;
