import { useState, useCallback, useMemo } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AskDiaLinksProps {
  content: string;
  onAskFollowUp: (question: string) => void;
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

export function AskDiaLinks({ content, onAskFollowUp }: AskDiaLinksProps) {
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);
  
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
