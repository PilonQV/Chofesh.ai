import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface AskDiaLinksProps {
  content: string;
  onAskFollowUp?: (question: string) => void;
}

export const AskDiaLinks: React.FC<AskDiaLinksProps> = ({ content, onAskFollowUp }) => {
  if (!content || typeof content !== 'string') return null;

  // Debug: Check if content contains markdown
  console.log('AskDiaLinks content:', content.substring(0, 100));

  return (
    <div className="markdown-content w-full text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        skipHtml={false}
        components={{
          // HEADINGS - Fix the ## showing as text
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 text-foreground">
              {children}
            </h4>
          ),
          
          // PARAGRAPHS
          p: ({ children }) => (
            <p className="mb-4 last:mb-0 leading-7 break-words text-foreground/90">
              {children}
            </p>
          ),
          
          // TABLES
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/80 font-semibold text-foreground">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-4 py-2 text-left whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-4 py-2 break-words">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-b-0 hover:bg-muted/20">
              {children}
            </tr>
          ),
          
          // LISTS
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4 space-y-1 marker:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1 marker:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="break-words leading-7 mb-1">
              {children}
            </li>
          ),
          
          // CODE
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary break-all"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded-lg overflow-hidden bg-gray-950 border border-gray-800">
                <pre className="p-4 overflow-x-auto text-sm text-gray-100">
                  <code className={`${className} font-mono`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          
          // LINKS
          a: ({ href, children }: any) => {
            const isAskLink = href?.startsWith('ask://');
            return (
              <a
                href={href}
                target={isAskLink ? undefined : "_blank"}
                rel={isAskLink ? undefined : "noopener noreferrer"}
                className="text-primary hover:underline break-all cursor-pointer"
                onClick={(e) => {
                  if (isAskLink && onAskFollowUp) {
                    e.preventDefault();
                    onAskFollowUp(decodeURIComponent(href.replace('ask://', '')));
                  }
                }}
              >
                {children}
              </a>
            );
          },
          
          // BLOCKQUOTE
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4 text-foreground/80 bg-muted/20 py-2 pr-4 rounded-r">
              {children}
            </blockquote>
          ),
          
          // STRONG/BOLD
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">
              {children}
            </strong>
          ),
          
          // EM/ITALIC
          em: ({ children }) => (
            <em className="italic text-foreground/90">
              {children}
            </em>
          ),
          
          // HR
          hr: () => <hr className="my-6 border-border" />,
          
          // IMAGES
          img: ({ src, alt }: any) => (
            <img 
              src={src} 
              alt={alt} 
              className="max-w-full h-auto rounded-lg my-4 border border-border"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AskDiaLinks;
