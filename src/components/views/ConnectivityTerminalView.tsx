import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Server,
  ArrowRight,
  Info,
  CornerDownLeft
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { SimulationResult } from '../../types/network';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

export const ConnectivityTerminalView: React.FC = () => {
  const { hosts, executeTest, latestTest } = useLab();
  const [selectedHostId, setSelectedHostId] = useState(hosts[1]?.id || 'host-app-a-02'); // ewb-app-a
  const [commandInput, setCommandInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      type: 'system',
      text: 'AWS Linux 2023 Kernel Shell (Simulated EC2 Terminal)'
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Connected to ewb-app-a (10.10.2.10) in VPC A private subnet. Type "help" for commands.'
    }
  ]);

  const activeHost = hosts.find(h => h.id === selectedHostId) || hosts[1];
  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to input history
    setCommandHistory(prev => [trimmed, ...prev]);
    setHistoryIndex(-1);

    const userPrompt = `[ec2-user@${activeHost.name} ~]$ ${trimmed}`;

    if (trimmed === 'clear') {
      setTerminalLines([]);
      setCommandInput('');
      return;
    }

    if (trimmed === 'help') {
      setTerminalLines(prev => [
        ...prev,
        { id: `in-${Date.now()}`, type: 'input', text: userPrompt },
        { id: `out-1-${Date.now()}`, type: 'output', text: 'Available simulated AWS networking commands:' },
        { id: `out-2-${Date.now()}`, type: 'output', text: '  ping <ip>         - Test ICMP echo packet flow across VPC peering (e.g. ping 10.20.1.10)' },
        { id: `out-3-${Date.now()}`, type: 'output', text: '  traceroute <ip>   - Trace hop-by-hop packet route through subnet, peering & destination' },
        { id: `out-4-${Date.now()}`, type: 'output', text: '  ip route          - Show Linux routing table derived from current AWS Route Tables' },
        { id: `out-5-${Date.now()}`, type: 'output', text: '  curl <ip>         - Test HTTP reachability' },
        { id: `out-6-${Date.now()}`, type: 'output', text: '  ssh <ip>          - Test SSH ingress evaluation' },
        { id: `out-7-${Date.now()}`, type: 'output', text: '  clear             - Clear terminal screen' }
      ]);
      setCommandInput('');
      return;
    }

    // Run simulation
    const res = executeTest(trimmed, activeHost.id);

    const newOutputs: TerminalLine[] = [
      { id: `in-${Date.now()}`, type: 'input', text: userPrompt },
      ...res.outputLines.map((line, idx) => ({
        id: `out-${Date.now()}-${idx}`,
        type: (res.success ? 'output' : 'error') as 'output' | 'error',
        text: line
      }))
    ];

    setTerminalLines(prev => [...prev, ...newOutputs]);
    setCommandInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runCommand(commandInput);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput('');
      }
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Connectivity Test Simulator</h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800 text-xs font-mono">
              Terminal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Execute simulated network commands to test route table resolution, peering transit, and security groups.
          </p>
        </div>

        {/* Source EC2 Host Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Source EC2:</span>
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {hosts.map(h => (
              <button
                key={h.id}
                onClick={() => {
                  setSelectedHostId(h.id);
                  setTerminalLines(prev => [
                    ...prev,
                    {
                      id: `switch-${Date.now()}`,
                      type: 'system',
                      text: `[Switched source host to ${h.name} (${h.privateIp})]`
                    }
                  ]);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium font-mono transition-all ${
                  selectedHostId === h.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {h.name} ({h.privateIp})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Command Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
        <span className="text-slate-500 text-[11px] font-mono">Quick Run:</span>
        <button
          onClick={() => runCommand('ping 10.20.1.10')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 font-mono text-[11px] transition-colors"
        >
          ping 10.20.1.10 (App B)
        </button>
        <button
          onClick={() => runCommand('traceroute 10.20.1.10')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 font-mono text-[11px] transition-colors"
        >
          traceroute 10.20.1.10
        </button>
        <button
          onClick={() => runCommand('ip route')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 font-mono text-[11px] transition-colors"
        >
          ip route show
        </button>
        <button
          onClick={() => runCommand('ping 10.10.2.10')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-[11px] transition-colors"
        >
          ping 10.10.2.10 (App A)
        </button>
        <button
          onClick={() => runCommand('ssh -i ewb.pem ec2-user@10.20.1.10')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 font-mono text-[11px] transition-colors"
        >
          ssh ec2-user@10.20.1.10
        </button>
      </div>

      {/* Terminal Viewport Container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 min-h-[360px] rounded-2xl bg-black border border-slate-800 shadow-2xl flex flex-col overflow-hidden font-mono text-xs cursor-text"
      >
        {/* Terminal Titlebar */}
        <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] text-slate-400 font-semibold ml-2">
              ec2-user@{activeHost.name}: ~ ({activeHost.privateIp})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>AWS Private VPC Peering Shell</span>
          </div>
        </div>

        {/* Terminal Output Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-1 custom-scrollbar text-slate-300 select-text">
          {terminalLines.map(line => {
            if (line.type === 'system') {
              return (
                <div key={line.id} className="text-slate-500 italic text-[11px]">
                  # {line.text}
                </div>
              );
            }
            if (line.type === 'input') {
              return (
                <div key={line.id} className="text-amber-400 font-bold pt-1">
                  {line.text}
                </div>
              );
            }
            if (line.type === 'error') {
              return (
                <div key={line.id} className="text-red-400 whitespace-pre font-mono">
                  {line.text}
                </div>
              );
            }
            return (
              <div key={line.id} className="text-emerald-400 whitespace-pre font-mono">
                {line.text}
              </div>
            );
          })}
          <div ref={terminalBottomRef} />
        </div>

        {/* Command Input Row */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 shrink-0">
          <span className="text-amber-400 font-bold select-none shrink-0">
            [ec2-user@{activeHost.name} ~]$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={commandInput}
            onChange={e => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type ping 10.20.1.10..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-slate-100 text-xs"
            autoFocus
          />
          <button
            onClick={() => runCommand(commandInput)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title="Execute"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Diagnostic Evaluation Breakdown Card */}
      {latestTest && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shrink-0 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">Simulation Packet Route Inspector</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  latestTest.success
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950 text-red-400 border border-red-800'
                }`}
              >
                {latestTest.success ? '200 OK / REACHABLE' : 'PACKET DROPPED'}
              </span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">
              Destination: {latestTest.destinationIp}
            </span>
          </div>

          {/* Hop Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {latestTest.hops.map(hop => (
              <div
                key={hop.step}
                className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                  hop.status === 'success'
                    ? 'bg-slate-950 border-emerald-900/60 text-slate-200'
                    : 'bg-red-950/40 border-red-800 text-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-400">Step {hop.step}</span>
                  {hop.status === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <div className="font-bold truncate text-slate-100">{hop.component}</div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {hop.details}
                </div>
              </div>
            ))}
          </div>

          {/* Remediation Tip if Failed */}
          {!latestTest.success && latestTest.troubleshootingTip && (
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-700/50 text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Recommended Fix: </strong>
                <span>{latestTest.troubleshootingTip}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
