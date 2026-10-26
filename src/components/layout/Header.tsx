import React, { useState } from 'react';
import {
  Globe,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLab, TabId } from '../../context/LabContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    peering,
    executeTest,
    applyPreset,
    resetLab,
    latestTest
  } = useLab();
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showSimInfo, setShowSimInfo] = useState(false);
  const [isRunningQuickPing, setIsRunningQuickPing] = useState(false);

  const getPageTitle = (tab: TabId) => {
    switch (tab) {
      case 'dashboard':
        return 'VPC Dashboard & Architecture Summary';
      case 'topology':
        return 'Interactive Network Topology Visualizer';
      case 'vpcs':
        return 'Virtual Private Clouds (VPCs)';
      case 'subnets':
        return 'Subnets & IP CIDR Allocation';
      case 'routes':
        return 'Route Tables & Destination Targets';
      case 'peering':
        return 'VPC Peering Connections (Requester / Accepter)';
      case 'security':
        return 'Security Groups & Ingress Firewalls';
      case 'connectivity':
        return 'Terminal Connectivity Testing (Ping / Traceroute / IP Route)';
      case 'failure-lab':
        return 'Guided Failure & Recovery Laboratory';
      case 'activity':
        return 'Activity Log & Simulation Events';
      case 'report':
        return 'Engineering Project Report Generator';
      default:
        return 'AWS VPC Peering Lab';
    }
  };

  const handleQuickPing = () => {
    setIsRunningQuickPing(true);
    setTimeout(() => {
      executeTest('ping 10.20.1.10');
      setIsRunningQuickPing(false);
      setActiveTab('connectivity');
    }, 400);
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10 select-none">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">VPC Peering Lab</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-slate-100 font-semibold text-sm tracking-tight">{getPageTitle(activeTab)}</h1>
        </div>

        {/* Peering Pill */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
            peering.status === 'active'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-400'
              : 'bg-amber-950/60 border-amber-800/80 text-amber-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${peering.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span>Peer: {peering.status}</span>
        </div>
      </div>

      {/* Right Action Tools */}
      <div className="flex items-center gap-3">
        {/* Simulation Notice Badge */}
        <div className="relative">
          <button
            onClick={() => setShowSimInfo(!showSimInfo)}
            className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 px-2.5 py-1 rounded hover:bg-amber-950/60 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="font-medium hidden md:inline">Simulation Mode</span>
            <span className="text-[10px] text-amber-400/80 hidden lg:inline">(Zero AWS Cost)</span>
          </button>

          {showSimInfo && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-3.5 text-xs z-50">
              <div className="flex items-start gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="font-semibold text-slate-100">Realistic Local Simulator</div>
              </div>
              <p className="text-slate-300 leading-relaxed mb-2">
                This project simulates AWS VPC networking behavior purely in the client browser. No cloud credentials or paid resources are deployed.
              </p>
              <div className="p-2 bg-slate-950 rounded text-[11px] text-slate-400 border border-slate-800">
                Matches AWS RFC1918 CIDR routing, ENI security groups, and non-transitive VPC peering rules.
              </div>
              <button
                onClick={() => setShowSimInfo(false)}
                className="mt-2.5 w-full py-1 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Preset Lab Scenarios Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="flex items-center gap-1.5 text-xs text-slate-200 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded border border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Lab Scenarios</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showPresetMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1.5 text-xs z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Load Test Scenarios
              </div>
              <button
                onClick={() => {
                  applyPreset('default');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
              >
                <span>Working Baseline (Active)</span>
                <span className="text-[10px] text-emerald-400 font-mono">200 OK</span>
              </button>
              <button
                onClick={() => {
                  applyPreset('broken-peering');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
              >
                <span>Pending Peering Request</span>
                <span className="text-[10px] text-amber-400 font-mono">Pending</span>
              </button>
              <button
                onClick={() => {
                  applyPreset('missing-route');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
              >
                <span>Missing Return Route</span>
                <span className="text-[10px] text-red-400 font-mono">Drop</span>
              </button>
              <button
                onClick={() => {
                  applyPreset('sg-blocked');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between text-slate-200"
              >
                <span>Security Group ICMP Block</span>
                <span className="text-[10px] text-red-400 font-mono">Drop</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Ping Button */}
        <button
          onClick={handleQuickPing}
          disabled={isRunningQuickPing}
          className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded transition-all shadow-sm shadow-amber-500/20 active:scale-95 disabled:opacity-50"
          title="Run instant simulated ping from App A (10.10.2.10) to App B (10.20.1.10)"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isRunningQuickPing ? 'animate-spin' : ''}`} />
          <span>{isRunningQuickPing ? 'Pinging...' : 'Quick Ping Test'}</span>
        </button>

        {/* Region Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px]">ap-south-1</span>
          <span className="text-slate-500 text-[10px]">(Mumbai)</span>
        </div>
      </div>
    </header>
  );
};
