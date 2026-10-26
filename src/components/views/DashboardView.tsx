import React from 'react';
import {
  Layers,
  Grid,
  Route,
  ArrowLeftRight,
  ShieldCheck,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileText,
  ExternalLink,
  Server,
  Network
} from 'lucide-react';
import { useLab } from '../../context/LabContext';

export const DashboardView: React.FC = () => {
  const {
    vpcs,
    subnets,
    routeTables,
    peering,
    securityGroups,
    hosts,
    activityLogs,
    latestTest,
    setActiveTab,
    executeTest
  } = useLab();

  const isPeeringActive = peering.status === 'active';
  const hasVpcARoutes = routeTables.find(r => r.name === 'ewb-rt-a-private')?.routes.some(r => r.targetType === 'peering-connection' && r.status === 'active');
  const hasVpcBRoutes = routeTables.find(r => r.name === 'ewb-rt-b-private')?.routes.some(r => r.targetType === 'peering-connection' && r.status === 'active');
  const allRoutesConfigured = Boolean(hasVpcARoutes && hasVpcBRoutes);

  const healthScore = (isPeeringActive ? 50 : 20) + (allRoutesConfigured ? 30 : 0) + 20;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-mono uppercase font-semibold">
                Lab Status: {isPeeringActive ? 'Active' : 'Action Required'}
              </span>
              <span className="text-xs text-slate-400 font-mono">Region: ap-south-1 (Mumbai)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              AWS VPC Peering Lab Dashboard
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Explore how two completely isolated Virtual Private Clouds (<code className="text-amber-400">10.10.0.0/16</code> and <code className="text-purple-400">10.20.0.0/16</code>) communicate securely via AWS private networking without internet transit.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('topology')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all shadow-sm"
            >
              <Network className="w-4 h-4 text-amber-400" />
              <span>Open Topology</span>
            </button>
            <button
              onClick={() => {
                executeTest('ping 10.20.1.10');
                setActiveTab('connectivity');
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Ping Test</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: VPCs */}
        <div
          onClick={() => setActiveTab('vpcs')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Virtual Private Clouds</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{vpcs.length}</div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-blue-400 font-mono">10.10.0.0/16</span>
            <span>&</span>
            <span className="text-purple-400 font-mono">10.20.0.0/16</span>
          </div>
        </div>

        {/* Metric 2: Subnets */}
        <div
          onClick={() => setActiveTab('subnets')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Configured Subnets</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{subnets.length}</div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-amber-400">1 Public (IGW)</span>
            <span>•</span>
            <span className="text-purple-400">2 Private</span>
          </div>
        </div>

        {/* Metric 3: Peering Status */}
        <div
          onClick={() => setActiveTab('peering')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Peering Connection</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${isPeeringActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
            <span className="capitalize">{peering.status}</span>
            <span className={`w-2 h-2 rounded-full ${isPeeringActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate font-mono">
            {peering.name} ({peering.id.substr(0, 12)}...)
          </div>
        </div>

        {/* Metric 4: Workloads */}
        <div
          onClick={() => setActiveTab('connectivity')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Simulated Workloads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{hosts.length} EC2</div>
          <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Bastion, App A, App B</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Health Indicator & Latest Test Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Network Health & Check List (1 col) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-200">Network Health Score</h2>
            <span className="text-lg font-mono font-bold text-emerald-400">{healthScore}%</span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                healthScore >= 90 ? 'bg-emerald-500' : healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Condition 1 */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              {isPeeringActive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-slate-200">Peering Connection Status</div>
                <div className="text-[11px] text-slate-400">
                  {isPeeringActive
                    ? 'Active state established across both VPC boundaries.'
                    : 'Peering connection is currently pending or inactive.'}
                </div>
              </div>
            </div>

            {/* Condition 2 */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              {allRoutesConfigured ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-slate-200">Bidirectional Route Propagation</div>
                <div className="text-[11px] text-slate-400">
                  {allRoutesConfigured
                    ? 'Both VPC A and VPC B have reciprocal routes targeting the peering link.'
                    : 'Missing route entry in VPC A or VPC B route table.'}
                </div>
              </div>
            </div>

            {/* Condition 3 */}
            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-slate-200">CIDR Non-Overlap Verification</div>
                <div className="text-[11px] text-slate-400">
                  VPC A (10.10.0.0/16) and VPC B (10.20.0.0/16) have zero overlapping IP space.
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('failure-lab')}
              className="w-full py-2 px-3 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800 text-indigo-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Launch Controlled Failure & Recovery Lab</span>
            </button>
          </div>
        </div>

        {/* Right Column: Latest Test Output & Quick Actions (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <h2 className="font-bold text-sm text-slate-200">Latest Connectivity Test Status</h2>
              </div>
              <button
                onClick={() => setActiveTab('connectivity')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <span>Open Terminal</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {latestTest ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono text-slate-400">Command: </span>
                    <span className="font-mono text-amber-400 font-semibold">{latestTest.command}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Timestamp: {new Date(latestTest.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        latestTest.success
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {latestTest.success ? 'SUCCESS (0% Loss)' : 'FAILED / TIMEOUT'}
                    </span>
                    {latestTest.success && (
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Avg RTT: {latestTest.rttAvgMs} ms
                      </div>
                    )}
                  </div>
                </div>

                {/* Snippet of terminal output */}
                <div className="p-3 rounded-xl bg-black font-mono text-[11px] text-emerald-400/90 border border-slate-800 space-y-0.5 overflow-x-auto">
                  {latestTest.outputLines.slice(0, 4).map((line, idx) => (
                    <div key={idx} className="whitespace-pre">{line}</div>
                  ))}
                  {latestTest.outputLines.length > 4 && (
                    <div className="text-slate-500 text-[10px]">
                      + {latestTest.outputLines.length - 4} more diagnostic lines...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-semibold text-slate-300">No connectivity test executed yet</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Simulate ICMP packets travelling through route tables, the peering bridge, and security groups.
                </p>
                <button
                  onClick={() => executeTest('ping 10.20.1.10')}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Run Baseline Ping (10.20.1.10)
                </button>
              </div>
            )}
          </div>

          {/* Quick Architecture Summary Footer */}
          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>Requester: <strong className="text-slate-200">ewb-vpc-a</strong></span>
              <span>Accepter: <strong className="text-slate-200">ewb-vpc-b</strong></span>
              <span>Link ID: <strong className="text-slate-200 font-mono">{peering.id}</strong></span>
            </div>
            <button
              onClick={() => setActiveTab('report')}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Project Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Simulation Activity Feed */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="font-bold text-sm text-slate-200">Recent Lab Activity</h2>
          </div>
          <button
            onClick={() => setActiveTab('activity')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            View Full Audit Log ({activityLogs.length})
          </button>
        </div>

        <div className="space-y-2">
          {activityLogs.slice(0, 4).map(log => (
            <div
              key={log.id}
              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    log.severity === 'success'
                      ? 'bg-emerald-400'
                      : log.severity === 'warning'
                      ? 'bg-amber-400'
                      : log.severity === 'error'
                      ? 'bg-red-400'
                      : 'bg-blue-400'
                  }`}
                />
                <div>
                  <span className="font-semibold text-slate-200">{log.title}</span>
                  <span className="text-slate-500 mx-2">—</span>
                  <span className="text-slate-400 text-[11px]">{log.description}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
