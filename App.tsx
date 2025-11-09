
import React, { useState, useCallback, useMemo } from 'react';
import { generateN8nWorkflow } from './services/geminiService';

// FIX: Add type for a node in an n8n workflow to resolve type errors in visualizer.
interface N8nNode {
    id: string;
    name: string;
    type: string;
    position: [number, number];
}

type Complexity = 'simple' | 'intermediate' | 'advanced';

// --- Icon Components ---
const RobotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM8.5 12c.83 0 1.5-.67 1.5-1.5S9.33 9 8.5 9 7 9.67 7 10.5 7.67 12 8.5 12zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 9 15.5 9s-1.5.67-1.5 1.5.67 1.5 1.5 1.5zM12 16.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5z" /></svg>
);
const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.06 2.65L16 6l-2.65 1.06L12 9.5 10.94 7.06 8.5 6l2.65-.94L12 2.5zm-4 5L6.94 9.56 4.5 10.5l2.44 1.06L8 14l1.06-2.44L11.5 10.5l-2.44-1.06L8 7.5zm8 5l-1.06 2.44L12.5 16l2.44.94L16 19.5l1.06-2.56L19.5 16l-2.44-.94L16 12.5z" /></svg>
);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor" ><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
);
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
);
const DiagramIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 15.5v-2h4v2H3zm5 0v-2h4v2H8zm5 0v-2h4v2h-4zm-10-5v-2h4v2H3zm5 0v-2h4v2H8zm5 0v-2h4v2h-4zm-5-5v-2h4v2H8zM3 3.5v2h18v-2H3z" /></svg>
);
const CodeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" /></svg>
);


// --- UI Components ---
const Header: React.FC = () => (
  <header className="p-4 border-b border-gray-700/50 flex-shrink-0">
    <div className="container mx-auto flex items-center gap-3"><RobotIcon className="w-8 h-8 text-brand-purple" /><h1 className="text-2xl font-bold text-gray-100 tracking-tight">n8n Workflow Generator</h1></div>
  </header>
);

interface PromptInputProps { onGenerate: (prompt: string, complexity: Complexity) => void; isLoading: boolean; }
const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [complexity, setComplexity] = useState<Complexity>('intermediate');
  
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (prompt.trim() && !isLoading) { onGenerate(prompt, complexity); } };
  const examplePrompts = ["A workflow that gets a new user from a webhook, enriches the user data with Clearbit, and then adds them to a Mailchimp list.", "Create a workflow that listens for a new row in a Google Sheet, sends the data to an OpenAI prompt, and saves the result back to the same row in a different column.", "A simple cron job that runs every morning at 9 AM, fetches the weather for New York from an API, and sends a summary to a Discord channel."];
  const handleExampleClick = (example: string) => { setPrompt(example); };

  const complexityOptions: { id: Complexity; label: string; description: string }[] = [
    { id: 'simple', label: 'Simple', description: 'A direct, linear workflow.' },
    { id: 'intermediate', label: 'Intermediate', description: 'Includes logic and data steps.' },
    { id: 'advanced', label: 'Advanced', description: 'Robust, with error handling.' },
  ];

  return (
    <div className="p-6 flex flex-col h-full bg-brand-surface rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <label htmlFor="prompt" className="text-lg font-semibold text-gray-200 mb-2">Describe your n8n workflow</label>
        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., When a new Stripe payment succeeds, send a custom thank you email via SendGrid..." className="w-full flex-grow p-3 bg-gray-800/50 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-brand-purple focus:border-brand-purple transition-shadow duration-300 resize-none" rows={10} />
        
        <div className="mt-4">
          <label className="text-md font-semibold text-gray-200 mb-2 block">Complexity</label>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-800/50 p-1">
            {complexityOptions.map((option) => (
              <button key={option.id} type="button" onClick={() => setComplexity(option.id)} className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${complexity === option.id ? 'bg-brand-purple text-white shadow' : 'text-gray-300 hover:bg-gray-700'}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading || !prompt.trim()} className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-purple text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-purple-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed">
          {isLoading ? (<><div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>Generating...</>) : (<><SparklesIcon className="w-5 h-5" />Generate Workflow</>)}
        </button>
      </form>
      <div className="mt-6">
          <h3 className="text-md font-semibold text-gray-400 mb-2">Or try an example:</h3>
          <div className="space-y-2">{examplePrompts.map((p, i) => (<button key={i} onClick={() => handleExampleClick(p)} className="text-left text-sm text-purple-400 hover:text-purple-300 bg-gray-800/30 p-2 rounded-md w-full transition-colors">{p}</button>))}</div>
      </div>
    </div>
  );
};

// --- Output Components ---
interface WorkflowVisualizerProps { jsonString: string; }

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ jsonString }) => {
    const data = useMemo(() => {
        try {
            // FIX: Remove markdown stripping, as responseMimeType: 'application/json' will be used.
            const parsed = JSON.parse(jsonString);
            if (!parsed.nodes || !parsed.connections) return null;

            // FIX: Explicitly type `nodes` to resolve property access errors.
            const nodes: N8nNode[] = parsed.nodes;
            const connections = [];
            const nodeMap = new Map(nodes.map(n => [n.id, n]));

            for (const sourceId in parsed.connections) {
                if (Object.prototype.hasOwnProperty.call(parsed.connections, sourceId)) {
                    const outputs = parsed.connections[sourceId];
                    const sourceNode = nodeMap.get(sourceId);
                    if (!sourceNode) continue;

                    for (const outputName in outputs) {
                        if (Object.prototype.hasOwnProperty.call(outputs, outputName)) {
                            const targets = outputs[outputName][0];
                            for (const target of targets) {
                                const targetNode = nodeMap.get(target.node);
                                if (targetNode) {
                                    connections.push({ from: sourceNode.position, to: targetNode.position });
                                }
                            }
                        }
                    }
                }
            }
            return { nodes, connections };
        } catch (e) {
            return null;
        }
    }, [jsonString]);

    if (!data) {
        return <div className="text-center text-gray-500 flex items-center justify-center h-full">Waiting for valid workflow JSON...</div>;
    }

    const { nodes, connections } = data;
    if (nodes.length === 0) return null;

    const PADDING = 100;
    const minX = Math.min(...nodes.map(n => n.position[0])) - PADDING;
    const minY = Math.min(...nodes.map(n => n.position[1])) - PADDING;
    const maxX = Math.max(...nodes.map(n => n.position[0])) + PADDING + 200; // +200 for node width
    const maxY = Math.max(...nodes.map(n => n.position[1])) + PADDING + 60; // +60 for node height

    return (
        <div className="w-full h-full overflow-auto bg-gray-900/70 rounded-md p-2">
            <svg width="100%" height="100%" viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}>
                <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#6c3af5" />
                    </marker>
                </defs>
                {connections.map((conn, i) => (
                    <path key={i} d={`M ${conn.from[0] + 200},${conn.from[1] + 30} C ${conn.from[0] + 300},${conn.from[1] + 30} ${conn.to[0] - 100},${conn.to[1] + 30} ${conn.to[0]},${conn.to[1] + 30}`} stroke="#6c3af5" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
                ))}
                {nodes.map(node => (
                    <g key={node.id} transform={`translate(${node.position[0]}, ${node.position[1]})`}>
                        <rect width="200" height="60" rx="8" fill="#1e1e1e" stroke="#4a4a4a" strokeWidth="1" />
                        <text x="10" y="25" fill="#f3f4f6" fontSize="14" fontWeight="bold">{node.name}</text>
                        <text x="10" y="45" fill="#a0a0a0" fontSize="12">{node.type}</text>
                    </g>
                ))}
            </svg>
        </div>
    );
};


interface JsonOutputProps { jsonString: string; isStreaming: boolean; error: string | null; finalJson: string | null; }

const JsonOutput: React.FC<JsonOutputProps> = ({ jsonString, isStreaming, error, finalJson }) => {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'visual' | 'json'>('visual');

  const handleCopy = () => {
    if (finalJson) {
      navigator.clipboard.writeText(JSON.stringify(JSON.parse(finalJson), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
      if (finalJson) {
          try {
              const parsed = JSON.parse(finalJson);
              const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${parsed.name || 'workflow'}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
          } catch(e) {
              console.error("Failed to parse and download JSON", e);
          }
      }
  }
  
  const getButtonClass = (buttonView: 'visual' | 'json') =>
    `px-3 py-1 text-sm font-medium rounded-md flex items-center gap-1.5 transition-colors ${
      view === buttonView
        ? 'bg-purple-600/50 text-white'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
    }`;


  let content;
  if (isStreaming && !jsonString) { // Initial loading state before first chunk
    content = (<div className="space-y-4 animate-pulse-fast"><div className="h-6 bg-gray-700 rounded w-1/4"></div><div className="h-4 bg-gray-700 rounded w-1/2"></div><div className="h-4 bg-gray-700 rounded w-3/4"></div></div>);
  } else if (error) {
    content = (<div className="text-red-400 bg-red-900/30 p-4 rounded-md"><p className="font-bold">An error occurred:</p><p className="mt-2 text-sm">{error}</p></div>);
  } else if (jsonString) {
    content = view === 'visual' ? (
        <WorkflowVisualizer jsonString={finalJson || jsonString} />
    ) : (
      <pre className="h-full w-full overflow-auto bg-gray-900/70 p-4 rounded-md">
        <code className="text-sm text-green-300 whitespace-pre-wrap">{jsonString}</code>
      </pre>
    );
  } else {
    content = (<div className="text-center text-gray-500 flex flex-col items-center justify-center h-full"><SparklesIcon className="w-16 h-16 text-gray-600 mb-4" /><p className="text-lg">Your generated n8n workflow will appear here.</p><p className="text-sm">Describe what you want to build and click "Generate".</p></div>);
  }

  return (
    <div className="p-6 bg-brand-surface rounded-lg shadow-lg h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <button onClick={() => setView('visual')} className={getButtonClass('visual')}><DiagramIcon className="w-4 h-4" /> Visual</button>
                <button onClick={() => setView('json')} className={getButtonClass('json')}><CodeIcon className="w-4 h-4" /> JSON</button>
            </div>
            {finalJson && (
                 <div className="flex items-center gap-2">
                    <button onClick={handleDownload} className="bg-gray-700 hover:bg-gray-600 text-gray-200 py-1 px-2 rounded-md text-sm flex items-center gap-1.5 transition-colors"><DownloadIcon className="w-4 h-4" />Download</button>
                    <button onClick={handleCopy} className="bg-gray-700 hover:bg-gray-600 text-gray-200 py-1 px-2 rounded-md text-sm flex items-center gap-1.5 transition-colors">{copied ? <CheckIcon className="w-4 h-4 text-green-400"/> : <CopyIcon className="w-4 h-4" />}{copied ? 'Copied!' : 'Copy'}</button>
                </div>
            )}
        </div>
        <div className="flex-grow min-h-0">{content}</div>
    </div>
  );
};


// --- Main App Component ---
const App: React.FC = () => {
  const [streamingJson, setStreamingJson] = useState<string>('');
  const [finalJson, setFinalJson] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (prompt: string, complexity: Complexity) => {
    setIsLoading(true);
    setError(null);
    setStreamingJson('');
    setFinalJson(null);
    try {
      const result = await generateN8nWorkflow(prompt, complexity, (chunk) => {
        setStreamingJson((prev) => prev + chunk);
      });
      setFinalJson(result);
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="h-screen bg-brand-dark text-white font-sans flex flex-col">
      <Header />
      <main className="flex-grow p-4 md:p-8 grid grid-cols-1 grid-rows-2 lg:grid-cols-5 lg:grid-rows-1 gap-8 overflow-hidden">
        <div className="lg:col-span-2 min-h-0 overflow-y-auto">
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
         <div className="lg:col-span-3 min-h-0">
           <JsonOutput jsonString={streamingJson} isStreaming={isLoading} error={error} finalJson={finalJson} />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm flex-shrink-0"><p>Powered by Google Gemini</p></footer>
    </div>
  );
};

export default App;
