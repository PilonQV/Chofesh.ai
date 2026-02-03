import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Loader2, Terminal, CheckCircle, XCircle, AlertTriangle, Undo2 } from 'lucide-react';

export default function MasterCommandAdmin() {
  const [command, setCommand] = useState('');
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeMutation = trpc.masterCommand.execute.useMutation();

  const handleExecute = async () => {
    console.log('[Master Command] Executing with:', { command: command.trim(), dryRun });
    
    if (!command.trim()) {
      alert('Please enter a command');
      return;
    }

    setIsExecuting(true);
    setResult(null);

    try {
      const res = await executeMutation.mutateAsync({
        command: command.trim(),
        dryRun,
        context: 'admin-panel',
      });
      setResult(res);
    } catch (error: any) {
      console.error('[MasterCommand Frontend] Error caught:', error);
      console.error('[MasterCommand Frontend] Error message:', error.message);
      console.error('[MasterCommand Frontend] Error data:', error.data);
      console.error('[MasterCommand Frontend] Full error object:', JSON.stringify(error, null, 2));
      setResult({
        success: false,
        error: error.message || 'Failed to execute command',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const exampleCommands = [
    'Add a dark mode toggle to the settings page',
    'Create a new FAQ section on the homepage',
    'Add a "Last updated" timestamp to the footer',
    'Fix the mobile menu not closing after navigation',
    'Add a loading skeleton to the chat interface',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Terminal className="w-10 h-10 text-purple-400" />
            Master Command
          </h1>
          <p className="text-gray-300">
            Self-modifying AI system - Give natural language commands to modify the codebase
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Command Input */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Command Input</h2>
                   {/* Authentication Notice */}
            <div className="mb-4 p-3 bg-purple-900/20 border border-purple-700/30 rounded-lg">
              <p className="text-sm text-purple-300">
                ✓ Authenticated as owner - Master Command access granted
              </p>
            </div>

            {/* Command Textarea */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Command
              </label>
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Describe what you want to change..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>



            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Preview Button */}
              <button
                onClick={() => {
                  setDryRun(true);
                  setTimeout(() => handleExecute(), 100);
                }}
                disabled={isExecuting}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isExecuting && dryRun ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Previewing...
                  </>
                ) : (
                  <>
                    <Terminal className="w-5 h-5" />
                    Preview Changes (Safe)
                  </>
                )}
              </button>

              {/* Execute Button */}
              <button
                onClick={() => {
                  if (confirm('⚠️ This will modify the codebase. Are you sure you want to execute this command?')) {
                    setDryRun(false);
                    setTimeout(() => handleExecute(), 100);
                  }
                }}
                disabled={isExecuting}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border-2 border-red-500/50"
              >
                {isExecuting && !dryRun ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5" />
                    Execute Command (Makes Changes)
                  </>
                )}
              </button>
            </div>

            {/* Example Commands */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Example Commands:</h3>
              <div className="space-y-2">
                {exampleCommands.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setCommand(example)}
                    className="w-full text-left px-3 py-2 bg-gray-900/50 hover:bg-gray-900 border border-gray-700 rounded text-sm text-gray-300 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results Panel */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <h2 className="text-xl font-semibold text-white mb-4">Results</h2>

            {!result && !isExecuting && (
              <div className="text-center py-12 text-gray-500">
                <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Enter a command and click execute to see results</p>
              </div>
            )}

            {isExecuting && (
              <div className="text-center py-12">
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-gray-300">Processing command...</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Status */}
                <div className={`flex items-center gap-3 p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-900/30 border border-green-500/30' 
                    : 'bg-red-900/30 border border-red-500/30'
                }`}>
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {result.success ? 'Success' : 'Failed'}
                    </p>
                    {result.error && (
                      <p className="text-sm text-red-300">{result.error}</p>
                    )}
                  </div>
                </div>

                {/* Plan */}
                {result.plan && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      Implementation Plan
                    </h3>
                    <div className="space-y-2">
                      {result.plan.steps.map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-purple-400 font-mono">{i + 1}.</span>
                          <div>
                            <p className="text-white font-medium">{step.action}</p>
                            <p className="text-gray-400">{step.description}</p>
                            {step.files && step.files.length > 0 && (
                              <p className="text-gray-500 text-xs mt-1">
                                Files: {step.files.join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Changes */}
                {result.changes && result.changes.length > 0 && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-semibold text-white mb-3">Code Changes</h3>
                    <div className="space-y-2">
                      {result.changes.map((change: any, i: number) => (
                        <div key={i} className="text-sm">
                          <p className="text-purple-400 font-mono">{change.file}</p>
                          <p className="text-gray-400">{change.type}: {change.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Logs */}
                {result.logs && result.logs.length > 0 && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 max-h-64 overflow-y-auto">
                    <h3 className="font-semibold text-white mb-3">Execution Logs</h3>
                    <div className="space-y-1 font-mono text-xs">
                      {result.logs.map((log: string, i: number) => (
                        <div key={i} className="text-gray-400">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deployment Info */}
                {result.deployment && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-semibold text-white mb-3">Deployment</h3>
                    <p className="text-gray-300 text-sm">
                      Checkpoint created: <span className="text-purple-400 font-mono">{result.deployment.checkpointId}</span>
                    </p>
                    <button className="mt-3 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm flex items-center gap-2 transition-colors">
                      <Undo2 className="w-4 h-4" />
                      Rollback to Previous
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-purple-500/10">
          <h2 className="text-lg font-semibold text-white mb-3">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <p className="font-semibold text-purple-400 mb-1">1. Parse</p>
              <p>AI analyzes your command and determines intent</p>
            </div>
            <div>
              <p className="font-semibold text-purple-400 mb-1">2. Plan</p>
              <p>Creates step-by-step implementation plan</p>
            </div>
            <div>
              <p className="font-semibold text-purple-400 mb-1">3. Execute</p>
              <p>Generates code, tests, and creates checkpoint</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
