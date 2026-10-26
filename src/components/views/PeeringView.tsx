import React, { useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Trash2,
  Info,
  Clock,
  Layers,
  X,
  Play
} from 'lucide-react';
import { useLab } from '../../context/LabContext';

export const PeeringView: React.FC = () => {
  const {
    peering,
    vpcs,
    updatePeeringStatus,
    deletePeering,
    createPeering,
    setActiveTab,
    executeTest
  } = useLab();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [peerName, setPeerName] = useState('ewb-a-b-peer');
  const [requesterVpcId, setRequesterVpcId] = useState(vpcs[0]?.id || '');
  const [accepterVpcId, setAccepterVpcId] = useState(vpcs[1]?.id || '');
  const [createError, setCreateError] = useState<string | null>(null);

  const reqVpc = vpcs.find(v => v.id === peering.requesterVpcId) || vpcs[0];
  const accVpc = vpcs.find(v => v.id === peering.accepterVpcId) || vpcs[1];

  const handleCreateNew = () => {
    const res = createPeering(peerName, requesterVpcId, accepterVpcId);
    if (!res.success) {
      setCreateError(res.error || 'Failed to create peering connection');
    } else {
      setShowCreateModal(false);
      setCreateError(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">VPC Peering Connections</h1>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold capitalize ${
                peering.status === 'active'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {peering.status}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Network bridge enabling private IPv4 routing between isolated Virtual Private Clouds.
          </p>
        </div>

        {peering.status === 'deleted' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Peering Connection</span>
          </button>
        )}
      </div>

      {/* Main Peering Connection Details Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-lg ${
              peering.status === 'active'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
            }`}>
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{peering.name}</h2>
                <span className="font-mono text-xs text-slate-400">({peering.id})</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {peering.statusMessage || 'VPC Peering link between VPC A and VPC B'}
              </p>
            </div>
          </div>

          {/* Action buttons based on state */}
          <div className="flex items-center gap-2.5">
            {peering.status === 'pending-acceptance' && (
              <>
                <button
                  onClick={() => updatePeeringStatus('active')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-900/30 active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Request (Activate)</span>
                </button>
                <button
                  onClick={() => updatePeeringStatus('rejected')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 font-medium text-xs border border-slate-700 hover:border-red-800 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {peering.status === 'active' && (
              <>
                <button
                  onClick={() => {
                    executeTest('ping 10.20.1.10');
                    setActiveTab('connectivity');
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-sm"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Peering Ping</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete peering connection? Dependent routes will turn into blackholes.')) {
                      deletePeering();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-950 text-red-300 border border-red-800/60 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Connection</span>
                </button>
              </>
            )}

            {(peering.status === 'rejected' || peering.status === 'deleted') && (
              <button
                onClick={() => updatePeeringStatus('active')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Re-activate Peering</span>
              </button>
            )}
          </div>
        </div>

        {/* Requester vs Accepter Side-by-Side Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Requester Side */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
              Requester VPC
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">VPC Name:</span>
              <span className="font-bold text-white text-xs">{reqVpc?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">VPC ID:</span>
              <span className="font-mono text-slate-300 text-xs">{reqVpc?.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">IPv4 CIDR:</span>
              <span className="font-mono text-amber-400 font-bold text-xs">{reqVpc?.cidrBlock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Region:</span>
              <span className="font-mono text-slate-300 text-xs">ap-south-1 (Mumbai)</span>
            </div>
          </div>

          {/* Accepter Side */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
              Accepter VPC
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">VPC Name:</span>
              <span className="font-bold text-white text-xs">{accVpc?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">VPC ID:</span>
              <span className="font-mono text-slate-300 text-xs">{accVpc?.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">IPv4 CIDR:</span>
              <span className="font-mono text-purple-400 font-bold text-xs">{accVpc?.cidrBlock}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Region:</span>
              <span className="font-mono text-slate-300 text-xs">ap-south-1 (Mumbai)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Stage Steps Visualizer */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
          AWS VPC Peering Connection Lifecycle
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[11px]">
              1
            </div>
            <div>
              <div className="font-semibold text-slate-200">Request Initiated</div>
              <div className="text-[10px] text-slate-500">Requester VPC owner creates request</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            peering.status === 'pending-acceptance' ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[11px]">
              2
            </div>
            <div>
              <div className="font-semibold text-slate-200">Pending Acceptance</div>
              <div className="text-[10px] text-slate-500">Awaiting accepter confirmation</div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
            peering.status === 'active' ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
              3
            </div>
            <div>
              <div className="font-semibold text-slate-200">Active State</div>
              <div className="text-[10px] text-slate-500">Traffic flows across private wire</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[11px]">
              4
            </div>
            <div>
              <div className="font-semibold text-slate-200">Route Configuration</div>
              <div className="text-[10px] text-slate-500">Add routes in both route tables</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Peering Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">Create VPC Peering Connection</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Peering Connection Name</label>
                <input
                  type="text"
                  value={peerName}
                  onChange={e => setPeerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">VPC ID (Requester)</label>
                <select
                  value={requesterVpcId}
                  onChange={e => setRequesterVpcId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono"
                >
                  {vpcs.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.cidrBlock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">VPC ID (Accepter)</label>
                <select
                  value={accepterVpcId}
                  onChange={e => setAccepterVpcId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs font-mono"
                >
                  {vpcs.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.cidrBlock})
                    </option>
                  ))}
                </select>
              </div>

              {createError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Initiate Peering Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
