import React, { useState, useEffect } from 'react';
import {
  Layers,
  Globe,
  Lock,
  Server,
  Route,
  ArrowLeftRight,
  ShieldAlert,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useLab } from '../../context/LabContext';

export const InteractiveTopology: React.FC = () => {
  const {
    vpcs,
    subnets,
    routeTables,
    peering,
    securityGroups,
    hosts,
    setInspectingItem,
    executeTest,
    latestTest
  } = useLab();

  const [zoomLevel, setZoomLevel] = useState(1);
  const [animatingTraffic, setAnimatingTraffic] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const vpcA = vpcs.find(v => v.name === 'ewb-vpc-a') || vpcs[0];
  const vpcB = vpcs.find(v => v.name === 'ewb-vpc-b') || vpcs[1];

  const subPublicA = subnets.find(s => s.name === 'ewb-a-public');
  const subPrivateA = subnets.find(s => s.name === 'ewb-a-private');
  const subPrivateB = subnets.find(s => s.name === 'ewb-b-private');

  const bastionHost = hosts.find(h => h.name === 'ewb-bastion');
  const appAHost = hosts.find(h => h.name === 'ewb-app-a');
  const appBHost = hosts.find(h => h.name === 'ewb-app-b');

  const rtPublicA = routeTables.find(r => r.name === 'ewb-rt-a-public');
  const rtPrivateA = routeTables.find(r => r.name === 'ewb-rt-a-private');
  const rtPrivateB = routeTables.find(r => r.name === 'ewb-rt-b-private');

  // Check health conditions
  const hasRouteA = rtPrivateA?.routes.some(r => r.destinationCidr === vpcB?.cidrBlock && r.status === 'active');
  const hasRouteB = rtPrivateB?.routes.some(r => r.destinationCidr === vpcA?.cidrBlock && r.status === 'active');
  const isPeerActive = peering.status === 'active';
  const isHealthy = isPeerActive && hasRouteA && hasRouteB;

  const triggerAnimation = () => {
    setAnimatingTraffic(true);
    setAnimationStep(1);

    // Run actual test in background to get real simulation result
    const testRes = executeTest('ping 10.20.1.10');

    // Step 1: Start at App A
    setTimeout(() => {
      setAnimationStep(2); // Route Table A
      setTimeout(() => {
        if (!hasRouteA) {
          setAnimationStep(99); // Error at Route Table A
          setTimeout(() => setAnimatingTraffic(false), 2500);
          return;
        }

        setAnimationStep(3); // Peering Connection
        setTimeout(() => {
          if (!isPeerActive) {
            setAnimationStep(98); // Error at Peering Link
            setTimeout(() => setAnimatingTraffic(false), 2500);
            return;
          }

          setAnimationStep(4); // Route Table B
          setTimeout(() => {
            if (!hasRouteB) {
              setAnimationStep(97); // Error at Return Route Table B
              setTimeout(() => setAnimatingTraffic(false), 2500);
              return;
            }

            setAnimationStep(5); // App B Security Group
            setTimeout(() => {
              if (!testRes.success) {
                setAnimationStep(96); // Error at Security Group / Host
                setTimeout(() => setAnimatingTraffic(false), 2500);
                return;
              }

              setAnimationStep(6); // Destination App B reached, echo reply!
              setTimeout(() => {
                setAnimationStep(7); // Echo Reply completed!
                setTimeout(() => {
                  setAnimatingTraffic(false);
                  setAnimationStep(0);
                }, 1500);
              }, 1000);
            }, 800);
          }, 800);
        }, 800);
      }, 800);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 select-none overflow-hidden relative">
      {/* Topology Control Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">Interactive Architecture Map</span>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1.5 ${
                isHealthy
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {isHealthy ? 'Topology Healthy (Bidirectional Peering)' : 'Configuration Alert (Check Peer/Routes)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, prev - 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Test Traffic Flow Button */}
          <button
            onClick={triggerAnimation}
            disabled={animatingTraffic}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-md shadow-purple-900/30 active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${animatingTraffic ? 'animate-spin' : ''}`} />
            <span>{animatingTraffic ? 'Simulating Traffic...' : 'Trace Packet Flow (App A → App B)'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 overflow-auto p-8 flex items-center justify-center custom-scrollbar">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="transition-transform duration-200 ease-out flex items-stretch gap-10 min-w-[950px]"
        >
          {/* ===================== VPC A CONTAINER ===================== */}
          <div
            onClick={() => setInspectingItem({ type: 'vpc', data: vpcA })}
            className={`flex-1 rounded-2xl p-5 border-2 transition-all cursor-pointer relative bg-gradient-to-b from-slate-900/90 to-slate-950 ${
              hoveredComponent === 'vpc-a'
                ? 'border-blue-400 shadow-xl shadow-blue-500/10'
                : 'border-blue-600/50 hover:border-blue-500/80 shadow-lg'
            }`}
          >
            {/* VPC Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span>{vpcA.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                      Requester
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-blue-400">{vpcA.cidrBlock}</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Region: ap-south-1</div>
            </div>

            {/* Subnets Layout inside VPC A */}
            <div className="mt-4 space-y-4">
              {/* Public Subnet A */}
              {subPublicA && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    setInspectingItem({ type: 'subnet', data: subPublicA });
                  }}
                  className="rounded-xl p-4 bg-amber-950/10 border border-amber-500/30 hover:border-amber-400/60 transition-all relative"
                >
                  {/* Internet Gateway connected to Public Subnet */}
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      setInspectingItem({
                        type: 'gateway',
                        data: {
                          id: 'igw-0192837465abc',
                          name: 'ewb-igw-a',
                          vpcId: vpcA.id,
                          status: 'attached',
                          tags: { Name: 'ewb-igw-a' }
                        }
                      });
                    }}
                    className="absolute -top-3 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-amber-500/50 text-[10px] font-semibold text-amber-400 shadow-md hover:bg-slate-800 transition-colors"
                  >
                    <Globe className="w-3 h-3 text-amber-400" />
                    <span>ewb-igw-a (IGW)</span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-bold text-slate-200">{subPublicA.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                        Public
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{subPublicA.cidrBlock}</span>
                  </div>

                  {/* Bastion Host Box */}
                  {bastionHost && (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setInspectingItem({ type: 'host', data: bastionHost });
                      }}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 flex items-center justify-between transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">{bastionHost.name}</div>
                          <div className="font-mono text-[10px] text-slate-400">
                            Priv: {bastionHost.privateIp} | Pub: {bastionHost.publicIp}
                          </div>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                        SSH 22 Only
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Private Subnet A */}
              {subPrivateA && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    setInspectingItem({ type: 'subnet', data: subPrivateA });
                  }}
                  className={`rounded-xl p-4 bg-purple-950/10 border transition-all relative ${
                    animationStep === 1 || animationStep === 2
                      ? 'border-purple-400 ring-2 ring-purple-500/30'
                      : 'border-purple-500/30 hover:border-purple-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-bold text-slate-200">{subPrivateA.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-purple-500/20 text-purple-300">
                        Private Subnet
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{subPrivateA.cidrBlock}</span>
                  </div>

                  {/* Workload Host A */}
                  {appAHost && (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setInspectingItem({ type: 'host', data: appAHost });
                      }}
                      className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                        animationStep === 1
                          ? 'bg-purple-900/60 border-purple-400 shadow-lg shadow-purple-500/20 scale-102'
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-purple-600/30 flex items-center justify-center text-purple-300">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                            <span>{appAHost.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <div className="font-mono text-[11px] text-purple-300 font-bold">
                            {appAHost.privateIp}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Workload A</span>
                    </div>
                  )}

                  {/* Attached Route Table Badge */}
                  {rtPrivateA && (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setInspectingItem({ type: 'routetable', data: rtPrivateA });
                      }}
                      className={`mt-2.5 p-2 rounded bg-slate-950 border flex items-center justify-between text-[11px] font-mono transition-all ${
                        animationStep === 2
                          ? 'border-purple-400 bg-purple-950/40 text-purple-200 shadow-md'
                          : animationStep === 99
                          ? 'border-red-500 bg-red-950/40 text-red-300 animate-pulse'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Route className="w-3.5 h-3.5 text-purple-400" />
                        <span>{rtPrivateA.name}</span>
                      </div>
                      <span className={hasRouteA ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                        {hasRouteA ? 'Route: 10.20.0.0/16 → Peer' : 'Missing Route!'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ===================== PEERING CONNECTION BRIDGE ===================== */}
          <div className="w-48 flex flex-col items-center justify-center shrink-0 relative my-auto">
            {/* Top Peering Info Pill */}
            <div
              onClick={() => setInspectingItem({ type: 'peering', data: peering })}
              className={`px-3 py-1.5 rounded-xl border flex flex-col items-center text-center cursor-pointer transition-all shadow-lg z-10 ${
                peering.status === 'active'
                  ? 'bg-slate-900 border-emerald-500/60 hover:border-emerald-400 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-slate-900 border-amber-500/60 hover:border-amber-400 text-amber-300'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                <span>{peering.name}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate max-w-[130px]">{peering.id}</div>
              <div className="mt-1">
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold ${
                    peering.status === 'active'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {peering.status}
                </span>
              </div>
            </div>

            {/* Connecting Wire Animation / Status SVG */}
            <div className="w-full h-20 relative flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 192 80">
                <defs>
                  <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Background Track Line */}
                <path
                  d="M 0 40 L 192 40"
                  stroke={peering.status === 'active' ? '#10b981' : '#f59e0b'}
                  strokeWidth="3"
                  strokeDasharray={peering.status === 'active' ? 'none' : '6 4'}
                  strokeOpacity={peering.status === 'active' ? '0.6' : '0.4'}
                />

                {/* Animated Traffic Packet */}
                {animatingTraffic && (
                  <circle
                    cx={
                      animationStep === 1
                        ? 20
                        : animationStep === 2
                        ? 60
                        : animationStep === 3
                        ? 96
                        : animationStep === 4
                        ? 135
                        : animationStep >= 5
                        ? 172
                        : 96
                    }
                    cy="40"
                    r="6"
                    fill={animationStep >= 90 ? '#ef4444' : '#10b981'}
                    className="transition-all duration-500 ease-in-out shadow-lg"
                  >
                    <animate attributeName="r" values="5;7;5" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
              </svg>

              {/* In-Transit Label */}
              <div className="absolute text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                AWS Private Fiber
              </div>
            </div>

            {/* Visual Error Callout during animation */}
            {animationStep >= 90 && (
              <div className="absolute -bottom-8 px-2 py-1 rounded bg-red-950 border border-red-800 text-[10px] text-red-300 font-semibold shadow-lg text-center animate-bounce">
                Packet Dropped Here!
              </div>
            )}
          </div>

          {/* ===================== VPC B CONTAINER ===================== */}
          <div
            onClick={() => setInspectingItem({ type: 'vpc', data: vpcB })}
            className={`flex-1 rounded-2xl p-5 border-2 transition-all cursor-pointer relative bg-gradient-to-b from-slate-900/90 to-slate-950 ${
              hoveredComponent === 'vpc-b'
                ? 'border-purple-400 shadow-xl shadow-purple-500/10'
                : 'border-purple-600/50 hover:border-purple-500/80 shadow-lg'
            }`}
          >
            {/* VPC Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span>{vpcB.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800 font-mono">
                      Accepter
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-purple-400">{vpcB.cidrBlock}</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Region: ap-south-1</div>
            </div>

            {/* Subnets Layout inside VPC B */}
            <div className="mt-4 space-y-4">
              {/* Note: No IGW in VPC B */}
              <div className="p-2 rounded bg-slate-950/60 border border-dashed border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <span>Internet Gateway: None (Private-Only VPC)</span>
                <span className="text-[10px] font-mono text-emerald-400">Strictly Isolated</span>
              </div>

              {/* Private Subnet B */}
              {subPrivateB && (
                <div
                  onClick={e => {
                    e.stopPropagation();
                    setInspectingItem({ type: 'subnet', data: subPrivateB });
                  }}
                  className={`rounded-xl p-4 bg-emerald-950/10 border transition-all relative ${
                    animationStep === 4 || animationStep === 5
                      ? 'border-emerald-400 ring-2 ring-emerald-500/30'
                      : 'border-emerald-500/30 hover:border-emerald-400/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold text-slate-200">{subPrivateB.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-emerald-500/20 text-emerald-300">
                        Private Subnet
                      </span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{subPrivateB.cidrBlock}</span>
                  </div>

                  {/* Workload Host B */}
                  {appBHost && (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setInspectingItem({ type: 'host', data: appBHost });
                      }}
                      className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                        animationStep === 5 || animationStep === 6
                          ? 'bg-emerald-900/60 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-102'
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-emerald-600/30 flex items-center justify-center text-emerald-300">
                          <Server className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 text-xs flex items-center gap-1.5">
                            <span>{appBHost.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          </div>
                          <div className="font-mono text-[11px] text-emerald-300 font-bold">
                            {appBHost.privateIp}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Workload B</span>
                    </div>
                  )}

                  {/* Attached Route Table Badge */}
                  {rtPrivateB && (
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setInspectingItem({ type: 'routetable', data: rtPrivateB });
                      }}
                      className={`mt-2.5 p-2 rounded bg-slate-950 border flex items-center justify-between text-[11px] font-mono transition-all ${
                        animationStep === 4
                          ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 shadow-md'
                          : animationStep === 97
                          ? 'border-red-500 bg-red-950/40 text-red-300 animate-pulse'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Route className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{rtPrivateB.name}</span>
                      </div>
                      <span className={hasRouteB ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                        {hasRouteB ? 'Route: 10.10.0.0/16 → Peer' : 'Missing Return Route!'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Educational Architecture Legend */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/50" />
            <span className="text-slate-400">Public Subnet (with IGW)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/50" />
            <span className="text-slate-400">Private Subnet (RFC1918)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
            <span className="text-slate-400">Active Peering Bridge</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Click any component to inspect AWS metadata in real time
        </div>
      </div>
    </div>
  );
};
