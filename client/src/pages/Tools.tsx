import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import {
  Youtube,
  Globe,
  Calculator,
  ArrowRightLeft,
  Clock,
  DollarSign,
  FileText,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Sparkles,
  Code,
  Regex,
  Braces,
  GitCompare,
  Database,
  Send,
} from "lucide-react";

export default function Tools() {
  const [activeTab, setActiveTab] = useState("youtube");
  

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Smart Tools</h1>
          <p className="text-muted-foreground mt-1">
            Productivity tools powered by AI
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-1">
            <TabsTrigger value="youtube" className="flex items-center gap-2 py-2">
              <Youtube className="h-4 w-4" />
              <span className="hidden sm:inline">YouTube</span>
            </TabsTrigger>
            <TabsTrigger value="scraper" className="flex items-center gap-2 py-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">URL</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2 py-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Math</span>
            </TabsTrigger>
            <TabsTrigger value="converter" className="flex items-center gap-2 py-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Convert</span>
            </TabsTrigger>
            <TabsTrigger value="regex" className="flex items-center gap-2 py-2">
              <Regex className="h-4 w-4" />
              <span className="hidden sm:inline">Regex</span>
            </TabsTrigger>
            <TabsTrigger value="json" className="flex items-center gap-2 py-2">
              <Braces className="h-4 w-4" />
              <span className="hidden sm:inline">JSON</span>
            </TabsTrigger>
            <TabsTrigger value="diff" className="flex items-center gap-2 py-2">
              <GitCompare className="h-4 w-4" />
              <span className="hidden sm:inline">Diff</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2 py-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* YouTube Summarizer */}
          <TabsContent value="youtube">
            <YouTubeSummarizer />
          </TabsContent>

          {/* URL Scraper */}
          <TabsContent value="scraper">
            <UrlScraper />
          </TabsContent>

          {/* Calculator */}
          <TabsContent value="calculator">
            <MathCalculator />
          </TabsContent>

          {/* Unit Converter */}
          <TabsContent value="converter">
            <UnitConverter />
          </TabsContent>

          {/* Regex Tester */}
          <TabsContent value="regex">
            <RegexTester />
          </TabsContent>

          {/* JSON Formatter */}
          <TabsContent value="json">
            <JsonFormatter />
          </TabsContent>

          {/* Diff Viewer */}
          <TabsContent value="diff">
            <DiffViewer />
          </TabsContent>

          {/* API Tester */}
          <TabsContent value="api">
            <ApiTester />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// YouTube Summarizer Component
function YouTubeSummarizer() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState<any>(null);
  

  const extractMutation = trpc.tools.youtube.extractVideoId.useQuery(
    { url },
    { enabled: false }
  );

  const summarizeMutation = trpc.tools.youtube.summarize.useMutation({
    onSuccess: (data) => {
      setSummary(data);
      toast.success("Video summarized successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSummarize = () => {
    if (!url) {
      toast.error("Please enter a YouTube URL");
      return;
    }
    summarizeMutation.mutate({ url });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          YouTube Summarizer
        </CardTitle>
        <CardDescription>
          Paste a YouTube URL to get an AI-generated summary with key points
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSummarize} disabled={summarizeMutation.isPending}>
            {summarizeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2">Summarize</span>
          </Button>
        </div>

        {summary && (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">{summary.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{summary.channel}</p>
              <Separator className="my-4" />
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown>{summary.summary}</Streamdown>
              </div>
              {summary.keyPoints && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Key Points</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {summary.keyPoints.map((point: string, i: number) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// URL Scraper Component
function UrlScraper() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  

  const analyzeMutation = trpc.tools.scraper.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("URL analyzed successfully!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleAnalyze = () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    analyzeMutation.mutate({ url });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-500" />
          URL Analyzer
        </CardTitle>
        <CardDescription>
          Extract and analyze content from any webpage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending}>
            {analyzeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="ml-2">Analyze</span>
          </Button>
        </div>

        {result && (
          <div className="space-y-4 mt-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  result.sentiment === "positive" ? "default" :
                  result.sentiment === "negative" ? "destructive" : "secondary"
                }>
                  {result.sentiment}
                </Badge>
              </div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm">{result.summary}</p>
              
              <Separator className="my-4" />
              
              <h4 className="font-medium mb-2">Key Points</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {result.keyPoints?.map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>

              <Separator className="my-4" />
              
              <h4 className="font-medium mb-2">Topics</h4>
              <div className="flex flex-wrap gap-2">
                {result.topics?.map((topic: string, i: number) => (
                  <Badge key={i} variant="outline">{topic}</Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Math Calculator Component
function MathCalculator() {
  const [expression, setExpression] = useState("");
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<"simple" | "advanced">("simple");
  

  const evaluateQuery = trpc.tools.math.evaluate.useQuery(
    { expression },
    { enabled: false }
  );

  const solveMutation = trpc.tools.math.solve.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Problem solved!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleCalculate = async () => {
    if (mode === "simple") {
      const res = await evaluateQuery.refetch();
      if (res.data) {
        setResult(res.data);
      }
    } else {
      if (!problem) {
        toast.error("Please enter a math problem");
        return;
      }
      solveMutation.mutate({ problem });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-green-500" />
          Math Calculator
        </CardTitle>
        <CardDescription>
          Calculate expressions or solve complex math problems step-by-step
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "simple" ? "default" : "outline"}
            onClick={() => setMode("simple")}
            size="sm"
          >
            Simple
          </Button>
          <Button
            variant={mode === "advanced" ? "default" : "outline"}
            onClick={() => setMode("advanced")}
            size="sm"
          >
            Step-by-Step
          </Button>
        </div>

        {mode === "simple" ? (
          <div className="flex gap-2">
            <Input
              placeholder="2 + 2 * 3, sqrt(16), sin(45)"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="flex-1 font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            />
            <Button onClick={handleCalculate} disabled={evaluateQuery.isFetching}>
              =
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Solve for x: 2x + 5 = 15"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              rows={3}
            />
            <Button onClick={handleCalculate} disabled={solveMutation.isPending} className="w-full">
              {solveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Solve Step-by-Step
            </Button>
          </div>
        )}

        {result && (
          <div className="p-4 bg-muted rounded-lg mt-4">
            <div className="text-2xl font-mono font-bold text-center mb-2">
              {result.result}
            </div>
            {result.steps && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {result.steps.map((step: string, i: number) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {result.latex && (
              <div className="mt-4 p-2 bg-background rounded font-mono text-sm overflow-x-auto">
                {result.latex}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Unit Converter Component
function UnitConverter() {
  const [converterType, setConverterType] = useState<"units" | "currency" | "timezone">("units");
  const [value, setValue] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [result, setResult] = useState<any>(null);
  

  const unitCategories = {
    length: ["m", "km", "cm", "mm", "mi", "yd", "ft", "in"],
    weight: ["kg", "g", "mg", "lb", "oz", "ton"],
    temperature: ["c", "f", "k"],
    volume: ["l", "ml", "gal", "qt", "pt", "cup", "floz"],
    time: ["s", "ms", "min", "h", "d", "wk"],
    data: ["b", "kb", "mb", "gb", "tb"],
  };

  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "MXN", "BRL", "KRW", "ILS"];
  const timezones = ["UTC", "EST", "EDT", "CST", "CDT", "MST", "MDT", "PST", "PDT", "CET", "JST", "IST"];

  const unitsQuery = trpc.tools.converter.units.useQuery(
    { value: parseFloat(value) || 0, fromUnit, toUnit },
    { enabled: false }
  );

  const currencyQuery = trpc.tools.converter.currency.useQuery(
    { amount: parseFloat(value) || 0, fromCurrency: fromUnit, toCurrency: toUnit },
    { enabled: false }
  );

  const timezoneQuery = trpc.tools.converter.timezone.useQuery(
    { time: value, fromTimezone: fromUnit, toTimezone: toUnit },
    { enabled: false }
  );

  const handleConvert = async () => {
    if (!value || !fromUnit || !toUnit) {
      toast.error("Please fill in all fields");
      return;
    }

    let res;
    if (converterType === "units") {
      res = await unitsQuery.refetch();
    } else if (converterType === "currency") {
      res = await currencyQuery.refetch();
    } else {
      res = await timezoneQuery.refetch();
    }

    if (res.data) {
      setResult(res.data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-purple-500" />
          Unit Converter
        </CardTitle>
        <CardDescription>
          Convert between units, currencies, and timezones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={converterType === "units" ? "default" : "outline"}
            onClick={() => { setConverterType("units"); setResult(null); }}
            size="sm"
          >
            <ArrowRightLeft className="h-4 w-4 mr-1" />
            Units
          </Button>
          <Button
            variant={converterType === "currency" ? "default" : "outline"}
            onClick={() => { setConverterType("currency"); setResult(null); }}
            size="sm"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Currency
          </Button>
          <Button
            variant={converterType === "timezone" ? "default" : "outline"}
            onClick={() => { setConverterType("timezone"); setResult(null); }}
            size="sm"
          >
            <Clock className="h-4 w-4 mr-1" />
            Timezone
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>{converterType === "timezone" ? "Time" : "Value"}</Label>
            <Input
              placeholder={converterType === "timezone" ? "12:00 PM" : "100"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              type={converterType === "timezone" ? "text" : "number"}
            />
          </div>
          <div>
            <Label>From</Label>
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {converterType === "units" && Object.entries(unitCategories).map(([cat, units]) => (
                  <div key={cat}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">{cat}</div>
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </div>
                ))}
                {converterType === "currency" && currencies.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                {converterType === "timezone" && timezones.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>To</Label>
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {converterType === "units" && Object.entries(unitCategories).map(([cat, units]) => (
                  <div key={cat}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">{cat}</div>
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </div>
                ))}
                {converterType === "currency" && currencies.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                {converterType === "timezone" && timezones.map(tz => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleConvert} className="w-full">
          Convert
        </Button>

        {result && (
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-2xl font-bold">
              {converterType === "timezone" ? (
                <>
                  {result.from?.time} {result.from?.timezone} = {result.to?.time} {result.to?.timezone}
                </>
              ) : (
                result.formula
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Regex Tester Component
function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState("g");
  const [testString, setTestString] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleTest = () => {
    setError("");
    setMatches([]);
    
    if (!pattern) return;
    
    try {
      const regex = new RegExp(pattern, flags);
      const found = testString.match(regex);
      setMatches(found || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Regex className="h-5 w-5 text-orange-500" />
          Regex Tester
        </CardTitle>
        <CardDescription>
          Test and debug regular expressions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Label>Pattern</Label>
            <Input
              placeholder="[a-z]+@[a-z]+\.[a-z]+"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="font-mono"
            />
          </div>
          <div>
            <Label>Flags</Label>
            <Input
              placeholder="gi"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <div>
          <Label>Test String</Label>
          <Textarea
            placeholder="Enter text to test against the pattern..."
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            rows={4}
          />
        </div>

        <Button onClick={handleTest} className="w-full">
          Test Pattern
        </Button>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {matches.length > 0 && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Matches ({matches.length})</h4>
            <div className="flex flex-wrap gap-2">
              {matches.map((match, i) => (
                <Badge key={i} variant="secondary" className="font-mono">
                  {match}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {pattern && matches.length === 0 && !error && (
          <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
            No matches found
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// JSON Formatter Component
function JsonFormatter() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleMinify = () => {
    setError("");
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Braces className="h-5 w-5 text-yellow-500" />
          JSON Formatter
        </CardTitle>
        <CardDescription>
          Format, validate, and minify JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Input JSON</Label>
          <Textarea
            placeholder='{"key": "value"}'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleFormat} className="flex-1">
            Format (Pretty)
          </Button>
          <Button onClick={handleMinify} variant="outline" className="flex-1">
            Minify
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            <strong>Invalid JSON:</strong> {error}
          </div>
        )}

        {output && !error && (
          <div className="relative">
            <Label>Output</Label>
            <Textarea
              value={output}
              readOnly
              rows={10}
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-8 right-2"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


// Diff Viewer Component
function DiffViewer() {
  const [text1, setText1] = useState("");
  const [text2, setText2] = useState("");
  const [diff, setDiff] = useState<{ type: string; value: string }[]>([]);

  const handleCompare = () => {
    // Simple line-by-line diff
    const lines1 = text1.split("\n");
    const lines2 = text2.split("\n");
    const result: { type: string; value: string }[] = [];

    const maxLen = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLen; i++) {
      const line1 = lines1[i] || "";
      const line2 = lines2[i] || "";

      if (line1 === line2) {
        result.push({ type: "same", value: line1 });
      } else {
        if (line1) result.push({ type: "removed", value: line1 });
        if (line2) result.push({ type: "added", value: line2 });
      }
    }

    setDiff(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-cyan-500" />
          Diff Viewer
        </CardTitle>
        <CardDescription>
          Compare two code snippets or text blocks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Original</Label>
            <Textarea
              placeholder="Paste original text here..."
              value={text1}
              onChange={(e) => setText1(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label>Modified</Label>
            <Textarea
              placeholder="Paste modified text here..."
              value={text2}
              onChange={(e) => setText2(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <Button onClick={handleCompare} className="w-full">
          Compare
        </Button>

        {diff.length > 0 && (
          <div className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
            {diff.map((line, i) => (
              <div
                key={i}
                className={`px-2 ${
                  line.type === "added"
                    ? "bg-green-500/20 text-green-400"
                    : line.type === "removed"
                    ? "bg-red-500/20 text-red-400"
                    : ""
                }`}
              >
                <span className="mr-2 opacity-50">
                  {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                </span>
                {line.value || " "}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// API Tester Component
function ApiTester() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);

  const handleSend = async () => {
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      let parsedHeaders = {};
      try {
        parsedHeaders = JSON.parse(headers);
      } catch {
        // Ignore header parse errors
      }

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      const contentType = res.headers.get("content-type") || "";
      let data;

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        data,
      });
    } catch (error: any) {
      setResponse({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-indigo-500" />
          API Tester
        </CardTitle>
        <CardDescription>
          Send HTTP requests and inspect responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="https://api.example.com/endpoint"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 font-mono"
          />
          <Button onClick={handleSend} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2">Send</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Headers (JSON)</Label>
            <Textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea
              placeholder='{"key": "value"}'
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="font-mono text-sm"
              disabled={method === "GET" || method === "HEAD"}
            />
          </div>
        </div>

        {response && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {response.status && (
                <Badge
                  variant={response.status < 400 ? "default" : "destructive"}
                  className="text-sm"
                >
                  {response.status} {response.statusText}
                </Badge>
              )}
              {responseTime > 0 && (
                <span className="text-sm text-muted-foreground">
                  {responseTime}ms
                </span>
              )}
            </div>

            {response.error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {response.error}
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg">
                <Label className="mb-2 block">Response</Label>
                <pre className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                  {typeof response.data === "object"
                    ? JSON.stringify(response.data, null, 2)
                    : response.data}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
