import React from 'react';
import {
  LayoutDashboard,
  Network,
  Layers,
  Grid,
  Route,
  ArrowLeftRight,
  ShieldCheck,
  Terminal,
  FlaskConical,
  Clock,
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useLab, TabId } from '../../context/LabContext';

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, peering, resetLab, activityLogs } = useLab();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'topology', label: 'Network Topology', icon: Network, badge: 'Interactive', badgeColor: 'bg-purple-900/60 text-purple-300' },
    { id: 'vpcs', label: 'VPCs', icon: Layers, badge: '2', badgeColor: 'bg-slate-800 text-slate-300' },
    { id: 'subnets', label: 'Subnets', icon: Grid, badge: '3', badgeColor: 'bg-slate-800 text-slate-300' },
    { id: 'routes', label: 'Route Tables', icon: Route, badge: '3', badgeColor: 'bg-slate-800 text-slate-300' },
    {
      id: 'peering',
      label: 'Peering Connections',
      icon: ArrowLeftRight,
      badge: peering.status === 'active' ? 'Active' : peering.status === 'pending-acceptance' ? 'Pending' : 'Broken',
      badgeColor: peering.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
    },
    { id: 'security', label: 'Security Groups', icon: ShieldCheck, badge: '3', badgeColor: 'bg-slate-800 text-slate-300' },
    { id: 'connectivity', label: 'Connectivity Tests', icon: Terminal, badge: 'CLI', badgeColor: 'bg-blue-950 text-blue-400 border border-blue-800' },
    { id: 'failure-lab', label: 'Failure & Recovery Lab', icon: FlaskConical, badge: 'Guided', badgeColor: 'bg-amber-900/40 text-amber-300' },
    { id: 'activity', label: 'Activity Log', icon: Clock, badge: `${activityLogs.length}`, badgeColor: 'bg-slate-800 text-slate-300' },
    { id: 'report', label: 'Project Report', icon: FileText, badge: 'Export', badgeColor: 'bg-indigo-900/40 text-indigo-300' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen shrink-0 text-slate-300 select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-bold">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-100 text-sm tracking-tight">VPC Peering Lab</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              SIM
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">AWS Networking Simulator</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider px-3 mb-1">
          Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Lab State Summary Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 space-y-2">
        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Peering Status:</span>
            {peering.status === 'active' ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" /> {peering.status === 'pending-acceptance' ? 'Pending' : 'Inactive'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">AWS Region:</span>
            <span className="font-mono text-slate-300">ap-south-1</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset entire VPC Peering Lab back to initial configuration?')) {
              resetLab();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 transition-colors"
          title="Reset lab to default state"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Lab Environment</span>
        </button>
      </div>
    </aside>
  );
};
