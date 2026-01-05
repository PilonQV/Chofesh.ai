import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Loader2, 
  Copy, 
  Download,
  Bug,
  Zap,
  Code2,
  FileWarning,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";

interface ReviewIssue {
  severity: "critical" | "warning" | "info";
  category: "security" | "performance" | "style" | "bug";
  line?: number;
  title: string;
  description: string;
  suggestion?: string;
  code?: string;
}

interface ReviewResult {
  summary: string;
  score: number;
  issues: ReviewIssue[];
  recommendations: string[];
}

const LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

export default function CodeReview() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("auto");
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const reviewMutation = trpc.codeReview.analyze.useMutation();

  const handleReview = useCallback(async () => {
    if (!code.trim()) return;
    
    setIsReviewing(true);
    setResult(null);
    
    try {
      const response = await reviewMutation.mutateAsync({
        code,
        language: language === "auto" ? undefined : language,
      });
      
      setResult(response);
    } catch (error) {
      console.error("Review failed:", error);
    } finally {
      setIsReviewing(false);
    }
  }, [code, language, reviewMutation]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "security":
        return <Shield className="w-4 h-4" />;
      case "performance":
        return <Zap className="w-4 h-4" />;
      case "style":
        return <Code2 className="w-4 h-4" />;
      case "bug":
        return <Bug className="w-4 h-4" />;
      default:
        return <FileWarning className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <ShieldCheck className="w-8 h-8 text-green-500" />;
    if (score >= 60) return <Shield className="w-8 h-8 text-yellow-500" />;
    return <ShieldAlert className="w-8 h-8 text-red-500" />;
  };

  const filteredIssues = result?.issues.filter(issue => {
    if (activeTab === "all") return true;
    if (activeTab === "critical") return issue.severity === "critical";
    if (activeTab === "security") return issue.category === "security";
    if (activeTab === "performance") return issue.category === "performance";
    return true;
  }) || [];

  const exportReport = () => {
    if (!result) return;
    
    const report = `# Code Review Report

## Summary
${result.summary}

## Score: ${result.score}/100

## Issues Found (${result.issues.length})

${result.issues.map((issue, i) => `
### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
- **Category:** ${issue.category}
${issue.line ? `- **Line:** ${issue.line}` : ""}
- **Description:** ${issue.description}
${issue.suggestion ? `- **Suggestion:** ${issue.suggestion}` : ""}
${issue.code ? `\`\`\`\n${issue.code}\n\`\`\`` : ""}
`).join("\n")}

## Recommendations
${result.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n")}
`;

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code-review-report.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <Shield className="w-16 h-16 text-primary" />
        <h1 className="text-2xl font-bold">Code Review</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Get AI-powered code reviews with security scanning, performance analysis, and actionable suggestions.
        </p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign in to continue</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="font-semibold">Code Review</h1>
            </div>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paste Your Code</CardTitle>
                <CardDescription>
                  Enter code to analyze for security vulnerabilities, performance issues, and best practices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleReview} 
                    disabled={!code.trim() || isReviewing}
                    className="flex-1"
                  >
                    {isReviewing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Review Code
                      </>
                    )}
                  </Button>
                </div>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {!result && !isReviewing && (
              <Card className="h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8">
                  <Shield className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Review</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Paste your code and click "Review Code" to get a comprehensive analysis including security vulnerabilities, performance issues, and style recommendations.
                  </p>
                </div>
              </Card>
            )}

            {isReviewing && (
              <Card className="h-full flex items-center justify-center min-h-[500px]">
                <div className="text-center p-8">
                  <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analyzing Code...</h3>
                  <p className="text-muted-foreground text-sm">
                    Checking for security vulnerabilities, performance issues, and best practices.
                  </p>
                </div>
              </Card>
            )}

            {result && (
              <>
                {/* Score Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-6">
                      {getScoreIcon(result.score)}
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                            {result.score}
                          </span>
                          <span className="text-muted-foreground">/100</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{result.summary}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-2">
                          <Badge variant="destructive">
                            {result.issues.filter(i => i.severity === "critical").length} Critical
                          </Badge>
                          <Badge className="bg-yellow-500">
                            {result.issues.filter(i => i.severity === "warning").length} Warnings
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Issues Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All ({result.issues.length})</TabsTrigger>
                        <TabsTrigger value="critical">
                          Critical ({result.issues.filter(i => i.severity === "critical").length})
                        </TabsTrigger>
                        <TabsTrigger value="security">
                          Security ({result.issues.filter(i => i.category === "security").length})
                        </TabsTrigger>
                        <TabsTrigger value="performance">
                          Performance ({result.issues.filter(i => i.category === "performance").length})
                        </TabsTrigger>
                      </TabsList>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {filteredIssues.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <p>No issues found in this category!</p>
                          </div>
                        ) : (
                          filteredIssues.map((issue, index) => (
                            <div 
                              key={index} 
                              className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {getSeverityIcon(issue.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-medium">{issue.title}</span>
                                    {getSeverityBadge(issue.severity)}
                                    <Badge variant="outline" className="gap-1">
                                      {getCategoryIcon(issue.category)}
                                      {issue.category}
                                    </Badge>
                                    {issue.line && (
                                      <Badge variant="outline">Line {issue.line}</Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {issue.description}
                                  </p>
                                  {issue.suggestion && (
                                    <div className="text-sm bg-primary/10 text-primary p-2 rounded mt-2">
                                      <strong>Suggestion:</strong> {issue.suggestion}
                                    </div>
                                  )}
                                  {issue.code && (
                                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                                      <code>{issue.code}</code>
                                    </pre>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {result.recommendations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
