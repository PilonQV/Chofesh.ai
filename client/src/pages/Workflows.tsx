import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Workflow,
  Play,
  Save,
  Plus,
  Trash2,
  Settings,
  MessageSquare,
  GitBranch,
  ArrowRight,
  FileInput,
  FileOutput,
  Sparkles,
  Loader2,
  Sun,
  Moon,
  ArrowLeft,
  MoreVertical,
  Copy,
  Download,
  Upload,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Node types for the workflow
type NodeType = "input" | "ai" | "condition" | "output" | "transform";

interface WorkflowNodeData {
  [key: string]: unknown;
  label: string;
  type: NodeType;
  config: Record<string, unknown>;
  status?: "idle" | "running" | "success" | "error";
  result?: string;
}

// Custom node components
const InputNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] ${
      selected ? "border-primary" : "border-blue-500/50"
    }`}>
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      <div className="flex items-center gap-2 mb-2">
        <FileInput className="w-4 h-4 text-blue-500" />
        <span className="font-medium text-sm">Input</span>
        {data.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground truncate">{(data.config as { prompt?: string })?.prompt || "Enter your input..."}</p>
    </div>
  );
};

const AINode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] ${
      selected ? "border-primary" : "border-purple-500/50"
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500" />
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="font-medium text-sm">AI Process</span>
        {data.status === "running" && <Loader2 className="w-4 h-4 animate-spin text-purple-500 ml-auto" />}
        {data.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
        {data.status === "error" && <XCircle className="w-4 h-4 text-red-500 ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground truncate">{(data.config as { instruction?: string })?.instruction || "AI instruction..."}</p>
    </div>
  );
};

const ConditionNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] ${
      selected ? "border-primary" : "border-yellow-500/50"
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-yellow-500" />
      <Handle type="source" position={Position.Right} id="true" style={{ top: "30%" }} className="w-3 h-3 bg-green-500" />
      <Handle type="source" position={Position.Right} id="false" style={{ top: "70%" }} className="w-3 h-3 bg-red-500" />
      <div className="flex items-center gap-2 mb-2">
        <GitBranch className="w-4 h-4 text-yellow-500" />
        <span className="font-medium text-sm">Condition</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{(data.config as { condition?: string })?.condition || "If condition..."}</p>
      <div className="flex justify-between mt-2 text-[10px]">
        <span className="text-green-500">True →</span>
        <span className="text-red-500">False →</span>
      </div>
    </div>
  );
};

const OutputNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] ${
      selected ? "border-primary" : "border-green-500/50"
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500" />
      <div className="flex items-center gap-2 mb-2">
        <FileOutput className="w-4 h-4 text-green-500" />
        <span className="font-medium text-sm">Output</span>
        {data.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
      </div>
      {data.result ? (
        <p className="text-xs text-muted-foreground line-clamp-3">{data.result as string}</p>
      ) : (
        <p className="text-xs text-muted-foreground">Result will appear here...</p>
      )}
    </div>
  );
};

const TransformNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 rounded-lg border-2 bg-card min-w-[180px] ${
      selected ? "border-primary" : "border-orange-500/50"
    }`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500" />
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-orange-500" />
        <span className="font-medium text-sm">Transform</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{(data.config as { transform?: string })?.transform || "Transform data..."}</p>
    </div>
  );
};

const nodeTypes = {
  input: InputNode,
  ai: AINode,
  condition: ConditionNode,
  output: OutputNode,
  transform: TransformNode,
};

// Default workflow template
const defaultNodes: Node<WorkflowNodeData>[] = [
  {
    id: "1",
    type: "input",
    position: { x: 50, y: 150 },
    data: { label: "Input", type: "input", config: { prompt: "Enter your text here" }, status: "idle" },
  },
  {
    id: "2",
    type: "ai",
    position: { x: 300, y: 150 },
    data: { label: "AI Process", type: "ai", config: { instruction: "Summarize the input text" }, status: "idle" },
  },
  {
    id: "3",
    type: "output",
    position: { x: 550, y: 150 },
    data: { label: "Output", type: "output", config: {}, status: "idle" },
  },
];

const defaultEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", markerEnd: { type: MarkerType.ArrowClosed } },
  { id: "e2-3", source: "2", target: "3", markerEnd: { type: MarkerType.ArrowClosed } },
];

interface SavedWorkflow {
  id: string;
  name: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  createdAt: string;
}

export default function Workflows() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  
  // Workflow state
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // UI state
  const [isRunning, setIsRunning] = useState(false);
  const [workflowName, setWorkflowName] = useState("My Workflow");
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [nodeConfig, setNodeConfig] = useState<Record<string, unknown>>({});
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== "undefined") {
      return !localStorage.getItem("workflowsOnboardingDone");
    }
    return true;
  });
  
  const chatMutation = trpc.chat.send.useMutation();
  
  // Load saved workflows from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("savedWorkflows");
      if (saved) {
        try {
          setSavedWorkflows(JSON.parse(saved));
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, setLocation]);
  
  // Handle edge connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
    [setEdges]
  );
  
  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<WorkflowNodeData>) => {
    setSelectedNode(node);
    setNodeConfig(node.data.config);
    setConfigDialogOpen(true);
  }, []);
  
  // Add new node
  const addNode = useCallback((type: NodeType) => {
    const newNode: Node<WorkflowNodeData> = {
      id: `node-${Date.now()}`,
      type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        type,
        config: type === "input" ? { prompt: "" } :
                type === "ai" ? { instruction: "" } :
                type === "condition" ? { condition: "" } :
                type === "transform" ? { transform: "" } : {},
        status: "idle",
      },
    };
    setNodes((nds) => [...nds, newNode]);
    toast.success(`Added ${type} node`);
  }, [setNodes]);
  
  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      setConfigDialogOpen(false);
      toast.success("Node deleted");
    }
  }, [selectedNode, setNodes, setEdges]);
  
  // Update node config
  const updateNodeConfig = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id
            ? { ...n, data: { ...n.data, config: nodeConfig } }
            : n
        )
      );
      setConfigDialogOpen(false);
      toast.success("Node updated");
    }
  }, [selectedNode, nodeConfig, setNodes]);
  
  // Save workflow
  const saveWorkflow = useCallback(() => {
    const workflow: SavedWorkflow = {
      id: Date.now().toString(),
      name: workflowName,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [...savedWorkflows, workflow];
    setSavedWorkflows(updated);
    localStorage.setItem("savedWorkflows", JSON.stringify(updated));
    toast.success("Workflow saved");
  }, [workflowName, nodes, edges, savedWorkflows]);
  
  // Load workflow
  const loadWorkflow = useCallback((workflow: SavedWorkflow) => {
    setNodes(workflow.nodes);
    setEdges(workflow.edges);
    setWorkflowName(workflow.name);
    toast.success(`Loaded "${workflow.name}"`);
  }, [setNodes, setEdges]);
  
  // Delete workflow
  const deleteWorkflow = useCallback((id: string) => {
    const updated = savedWorkflows.filter((w) => w.id !== id);
    setSavedWorkflows(updated);
    localStorage.setItem("savedWorkflows", JSON.stringify(updated));
    toast.success("Workflow deleted");
  }, [savedWorkflows]);
  
  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    setIsRunning(true);
    
    // Reset all node statuses
    setNodes((nds) =>
      nds.map((n) => ({ ...n, data: { ...n.data, status: "idle", result: undefined } }))
    );
    
    try {
      // Find input node
      const inputNode = nodes.find((n) => n.data.type === "input");
      if (!inputNode) {
        toast.error("No input node found");
        setIsRunning(false);
        return;
      }
      
      // Get input value
      const inputValue = (inputNode.data.config as { prompt?: string })?.prompt || "";
      if (!inputValue.trim()) {
        toast.error("Please enter input text");
        setIsRunning(false);
        return;
      }
      
      // Mark input as success
      setNodes((nds) =>
        nds.map((n) =>
          n.id === inputNode.id ? { ...n, data: { ...n.data, status: "success" } } : n
        )
      );
      
      // Execute workflow in order (simplified - follows edges)
      let currentValue = inputValue;
      const visited = new Set<string>([inputNode.id]);
      const queue = [inputNode.id];
      
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        const outgoingEdges = edges.filter((e) => e.source === currentId);
        
        for (const edge of outgoingEdges) {
          if (visited.has(edge.target)) continue;
          visited.add(edge.target);
          
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!targetNode) continue;
          
          // Process based on node type
          if (targetNode.data.type === "ai") {
            // Mark as running
            setNodes((nds) =>
              nds.map((n) =>
                n.id === targetNode.id ? { ...n, data: { ...n.data, status: "running" } } : n
              )
            );
            
            // Call AI
            const instruction = (targetNode.data.config as { instruction?: string })?.instruction || "Process this text";
            try {
              const response = await chatMutation.mutateAsync({
                messages: [
                  { role: "system", content: instruction },
                  { role: "user", content: currentValue },
                ],
                routingMode: "auto",
              });
              
              currentValue = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
              
              // Mark as success
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === targetNode.id ? { ...n, data: { ...n.data, status: "success" } } : n
                )
              );
            } catch (error) {
              // Mark as error
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === targetNode.id ? { ...n, data: { ...n.data, status: "error" } } : n
                )
              );
              throw error;
            }
          } else if (targetNode.data.type === "output") {
            // Set output result
            setNodes((nds) =>
              nds.map((n) =>
                n.id === targetNode.id
                  ? { ...n, data: { ...n.data, status: "success", result: currentValue } }
                  : n
              )
            );
          } else if (targetNode.data.type === "transform") {
            // Simple transform (uppercase, lowercase, etc.)
            const transform = (targetNode.data.config as { transform?: string })?.transform || "";
            if (transform.toLowerCase().includes("uppercase")) {
              currentValue = currentValue.toUpperCase();
            } else if (transform.toLowerCase().includes("lowercase")) {
              currentValue = currentValue.toLowerCase();
            }
            setNodes((nds) =>
              nds.map((n) =>
                n.id === targetNode.id ? { ...n, data: { ...n.data, status: "success" } } : n
              )
            );
          }
          
          queue.push(edge.target);
        }
      }
      
      toast.success("Workflow completed!");
    } catch (error) {
      toast.error("Workflow execution failed");
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  }, [nodes, edges, setNodes, chatMutation]);
  
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
  
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-12 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-3">
          <Link href="/chat">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="h-8 w-48 text-sm font-medium border-none bg-transparent focus-visible:ring-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => addNode("input")}>
                <FileInput className="w-4 h-4 mr-2 text-blue-500" />
                Input Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode("ai")}>
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                AI Process Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode("transform")}>
                <Zap className="w-4 h-4 mr-2 text-orange-500" />
                Transform Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode("condition")}>
                <GitBranch className="w-4 h-4 mr-2 text-yellow-500" />
                Condition Node
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addNode("output")}>
                <FileOutput className="w-4 h-4 mr-2 text-green-500" />
                Output Node
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Load
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {savedWorkflows.length === 0 ? (
                <DropdownMenuItem disabled>No saved workflows</DropdownMenuItem>
              ) : (
                savedWorkflows.map((w) => (
                  <DropdownMenuItem key={w.id} className="flex items-center justify-between">
                    <span onClick={() => loadWorkflow(w)} className="flex-1 cursor-pointer">
                      {w.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-6 h-6 ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkflow(w.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" onClick={saveWorkflow}>
            <Save className="w-4 h-4 mr-1" />
            Save
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={executeWorkflow}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Run
              </>
            )}
          </Button>
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>
      
      {/* Workflow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-muted/20"
        >
          <Controls />
          <Background gap={20} />
          <Panel position="bottom-left" className="bg-card p-3 rounded-lg border shadow-lg">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Tips:</strong></p>
              <p>• Click a node to configure it</p>
              <p>• Drag from handles to connect nodes</p>
              <p>• Click "Run" to execute the workflow</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>
      
      {/* Node Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNode?.data.type === "input" && <FileInput className="w-5 h-5 text-blue-500" />}
              {selectedNode?.data.type === "ai" && <Sparkles className="w-5 h-5 text-purple-500" />}
              {selectedNode?.data.type === "condition" && <GitBranch className="w-5 h-5 text-yellow-500" />}
              {selectedNode?.data.type === "output" && <FileOutput className="w-5 h-5 text-green-500" />}
              {selectedNode?.data.type === "transform" && <Zap className="w-5 h-5 text-orange-500" />}
              Configure {String((selectedNode?.data as unknown as WorkflowNodeData)?.type || '').charAt(0).toUpperCase()}{String((selectedNode?.data as unknown as WorkflowNodeData)?.type || '').slice(1)} Node
            </DialogTitle>
            <DialogDescription>
              Set up this node's behavior in the workflow.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedNode?.data.type === "input" && (
              <div className="space-y-2">
                <Label>Input Text</Label>
                <Textarea
                  value={(nodeConfig as { prompt?: string })?.prompt || ""}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, prompt: e.target.value })}
                  placeholder="Enter the text to process..."
                  rows={4}
                />
              </div>
            )}
            
            {selectedNode?.data.type === "ai" && (
              <div className="space-y-2">
                <Label>AI Instruction</Label>
                <Textarea
                  value={(nodeConfig as { instruction?: string })?.instruction || ""}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, instruction: e.target.value })}
                  placeholder="e.g., Summarize this text, Translate to Spanish, Extract key points..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This instruction tells the AI how to process the incoming data.
                </p>
              </div>
            )}
            
            {selectedNode?.data.type === "condition" && (
              <div className="space-y-2">
                <Label>Condition</Label>
                <Input
                  value={(nodeConfig as { condition?: string })?.condition || ""}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, condition: e.target.value })}
                  placeholder="e.g., contains 'error', length > 100"
                />
                <p className="text-xs text-muted-foreground">
                  Define when to take the "True" path vs "False" path.
                </p>
              </div>
            )}
            
            {selectedNode?.data.type === "transform" && (
              <div className="space-y-2">
                <Label>Transformation</Label>
                <Select
                  value={(nodeConfig as { transform?: string })?.transform || ""}
                  onValueChange={(v) => setNodeConfig({ ...nodeConfig, transform: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select transformation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uppercase">Convert to UPPERCASE</SelectItem>
                    <SelectItem value="lowercase">Convert to lowercase</SelectItem>
                    <SelectItem value="trim">Trim whitespace</SelectItem>
                    <SelectItem value="reverse">Reverse text</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedNode?.data.type === "output" && (
              <div className="space-y-2">
                <Label>Output Preview</Label>
                <div className="p-3 rounded-lg bg-muted min-h-[100px]">
                  {selectedNode.data.result ? (
                    <p className="text-sm whitespace-pre-wrap">{selectedNode.data.result as string}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Run the workflow to see output here.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={deleteSelectedNode}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Node
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateNodeConfig}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={(open) => {
        setShowOnboarding(open);
        if (!open) {
          localStorage.setItem("workflowsOnboardingDone", "true");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="w-5 h-5 text-primary" />
              Welcome to AI Workflows!
            </DialogTitle>
            <DialogDescription>
              Build powerful automations by connecting AI nodes visually.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileInput className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h4 className="font-medium">Input Node</h4>
                <p className="text-sm text-muted-foreground">Start your workflow with text input. This is where your data enters.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <h4 className="font-medium">AI Process Node</h4>
                <p className="text-sm text-muted-foreground">Process data with AI. Summarize, translate, analyze, or transform.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <FileOutput className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h4 className="font-medium">Output Node</h4>
                <p className="text-sm text-muted-foreground">Collect results from your workflow. View the final processed output.</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="font-medium mb-1">Quick Start:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Drag nodes from the toolbar to the canvas</li>
                <li>Connect nodes by dragging from one handle to another</li>
                <li>Click a node to configure its settings</li>
                <li>Click "Run Workflow" to execute</li>
              </ol>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowOnboarding(false);
              localStorage.setItem("workflowsOnboardingDone", "true");
            }}>
              Get Started
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
