import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface AskDiaLinksProps {
  content: string;
  onAskFollowUp?: (question: string) => void;
}

export const AskDiaLinks: React.FC<AskDiaLinksProps> = ({ content, onAskFollowUp }) => {
  // Don't render if content is empty
  if (!content) return null;

  return (
    <div className="markdown-body w-full">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // Enables tables, strikethrough, etc.
        rehypePlugins={[rehypeRaw]} // Allows HTML in markdown
        components={{
          // Table wrapper with horizontal scroll
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 w-full">
              <table className="w-full border-collapse text-sm min-w-[300px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2 text-foreground/90 break-words">
              {children}
            </td>
          ),
          tr: ({ children }) => <tr className="border-b border-border hover:bg-muted/30">{children}</tr>,
          
          // Paragraphs with proper spacing
          p: ({ children }) => (
            <p className="mb-4 last:mb-0 leading-7 break-words text-foreground/90">
              {children}
            </p>
          ),
          
          // Headings
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">{children}</h3>,
          
          // Lists
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="break-words leading-7">{children}</li>,
          
          // Code blocks
          code: ({ children, className, node, ...props }: any) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary break-all" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm">
                <code className={`${className} break-all whitespace-pre-wrap`} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          
          // Links
          a: ({ children, href }: any) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={(e) => {
                if (onAskFollowUp && href?.startsWith('ask://')) {
                  e.preventDefault();
                  onAskFollowUp(href.replace('ask://', ''));
                }
              }}
            >
              {children}
            </a>
          ),
          
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-foreground/80">
              {children}
            </blockquote>
          ),
          
          // Horizontal rule
          hr: () => <hr className="my-6 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AskDiaLinks;
