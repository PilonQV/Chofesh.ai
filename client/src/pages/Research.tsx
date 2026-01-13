import { useState, useRef, useEffect } from "react";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; url: string }>;
  codeExecutions?: Array<{ code: string; output: string }>;
}

export default function Research() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("groq/compound");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Groq Compound API via tRPC
      const response = await trpc.research.mutate({
        query: input,
        model: selectedModel,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        sources: response.sources,
        codeExecutions: response.codeExecutions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Research error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error while researching. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>AI Research - Chofesh</title>
        <meta name="description" content="Research with AI-powered web search and code execution" />
      </Helmet>

      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🔬 AI Research
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Powered by Groq Compound - Web Search + Code Execution
              </p>
            </div>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="groq/compound">Groq Compound (Full)</option>
              <option value="groq/compound-mini">Groq Compound Mini</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-5xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔬</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  AI-Powered Research
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Ask me anything. I can search the web and execute code to find answers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  <button
                    onClick={() => setInput("What are the latest developments in AI?")}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      Latest AI News
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Get current information from the web
                    </div>
                  </button>
                  <button
                    onClick={() => setInput("Calculate the Fibonacci sequence up to 10")}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left"
                  >
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      Code Execution
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Run code to solve problems
                    </div>
                  </button>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-3xl ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  } rounded-lg p-4 shadow-sm`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold mb-2">Sources:</div>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {idx + 1}. {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Code Executions */}
                  {message.codeExecutions && message.codeExecutions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-semibold mb-2">Code Executed:</div>
                      {message.codeExecutions.map((exec, idx) => (
                        <div key={idx} className="mb-4">
                          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm overflow-x-auto">
                            <code>{exec.code}</code>
                          </pre>
                          {exec.output && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold mb-1">Output:</div>
                              <pre className="bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                                {exec.output}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything... I can search the web and run code!"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isLoading ? "Researching..." : "Research"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
