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

  // If content has no markdown but has newlines, convert to markdown paragraphs
  const processedContent = content.includes('\n') && !content.includes('<p>')
    ? content.split('\n\n').map(p => p.trim()).filter(p => p).join('\n\n')
    : content;

  return (
    <div className="markdown-content w-full text-[15px] text-foreground/95 leading-7">
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
            <h2 className="text-lg font-semibold mt-8 mb-4 text-foreground border-b border-border/50 pb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-6 mb-3 text-foreground/90">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 text-foreground">
              {children}
            </h4>
          ),
          
          // PARAGRAPHS - Enhanced with inline styles for fallback
          p: ({ children }) => (
            <p 
              className="mb-5 last:mb-0 leading-[1.8] break-words"
              style={{ 
                marginBottom: '1.2em', 
                marginTop: 0,
                lineHeight: 1.8 
              }}
            >
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
            <li className="mb-2 leading-7 break-words marker:text-muted-foreground">
              {children}
            </li>
          ),
          
          // CODE
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code 
                  className="bg-white/10 px-1.5 py-0.5 rounded text-[0.85em] font-mono text-blue-300"
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
            <strong className="font-semibold text-foreground">
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
          
          // TEXT NODE - Handle plain text with double newlines
          text: ({ value }: any) => {
            // If text has double newlines, split into paragraphs manually
            if (value && typeof value === 'string' && value.includes('\n\n')) {
              return (
                <>
                  {value.split('\n\n').map((paragraph: string, i: number) => (
                    <p 
                      key={i} 
                      style={{ 
                        marginBottom: '1.2em', 
                        lineHeight: 1.8 
                      }}
                    >
                      {paragraph}
                    </p>
                  ))}
                </>
              );
            }
            return <>{value}</>;
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default AskDiaLinks;
