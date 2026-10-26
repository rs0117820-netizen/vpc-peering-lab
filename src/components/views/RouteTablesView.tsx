import React, { useState } from 'react';
import {
  Route,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  Layers,
  ArrowLeftRight,
  Globe
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { RouteTable, RouteTargetType } from '../../types/network';

export const RouteTablesView: React.FC = () => {
  const { routeTables, vpcs, subnets, peering, addRoute, deleteRoute, setInspectingItem } = useLab();
  const [selectedRtForAdd, setSelectedRtForAdd] = useState<RouteTable | null>(null);
  const [destCidr, setDestCidr] = useState('');
  const [targetType, setTargetType] = useState<RouteTargetType>('peering-connection');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenAddModal = (rt: RouteTable) => {
    setSelectedRtForAdd(rt);
    setDestCidr('');
    setTargetType('peering-connection');
    setErrorMessage(null);
  };

  const handleSaveRoute = () => {
    if (!selectedRtForAdd) return;

    let targetId = '';
    let targetName = '';

    if (targetType === 'peering-connection') {
      targetId = peering.id;
      targetName = peering.name;
    } else if (targetType === 'internet-gateway') {
      targetId = 'igw-0192837465abc';
      targetName = 'ewb-igw-a';
    } else {
      targetId = 'local';
      targetName = 'local';
    }

    const res = addRoute(selectedRtForAdd.id, destCidr, targetType, targetId, targetName);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to add route');
    } else {
      setSelectedRtForAdd(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Route Tables & Propagation</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {routeTables.length} tables
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Define IPv4 packet routing targets across local subnets, Internet Gateways, and the Peering link.
          </p>
        </div>
      </div>

      {/* Explanatory Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <div className="font-semibold text-slate-100">AWS Non-Transitive Routing Principle</div>
          <p className="text-slate-400 leading-relaxed">
            VPC Peering does <strong>not</strong> propagate routes automatically. Both VPCs must contain explicit route table entries pointing the peer VPC's CIDR block to the VPC peering connection ID (<code className="text-emerald-400">{peering.id}</code>). If either route is missing, packets are dropped.
          </p>
        </div>
      </div>

      {/* Route Tables List */}
      <div className="space-y-6">
        {routeTables.map(rt => {
          const parentVpc = vpcs.find(v => v.id === rt.vpcId);
          const associatedSubnets = subnets.filter(s => s.routeTableId === rt.id);

          return (
            <div
              key={rt.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl"
            >
              {/* Route Table Header Bar */}
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                    <Route className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{rt.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{rt.id}</span>
                      {rt.isMain && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono bg-blue-950 text-blue-400 border border-blue-800">
                          Main
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>VPC: <strong className="text-slate-300">{parentVpc?.name}</strong> ({parentVpc?.cidrBlock})</span>
                      <span>•</span>
                      <span>Subnets: <strong className="text-slate-300">{associatedSubnets.map(s => s.name).join(', ') || 'None'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddModal(rt)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Route</span>
                  </button>
                </div>
              </div>

              {/* Routes Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Destination CIDR</th>
                      <th className="px-4 py-2.5">Target Type</th>
                      <th className="px-4 py-2.5">Target Name / ID</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-normal text-slate-200">
                    {rt.routes.map(route => (
                      <tr key={route.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-100">
                          <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {route.destinationCidr}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize text-slate-300">
                          {route.targetType.replace('-', ' ')}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-300">
                          <div className="flex items-center gap-1.5">
                            {route.targetType === 'peering-connection' && (
                              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            {route.targetType === 'internet-gateway' && (
                              <Globe className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            {route.targetType === 'local' && (
                              <Layers className="w-3.5 h-3.5 text-blue-400" />
                            )}
                            <span>{route.targetName || route.targetId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              route.status === 'active'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-red-950 text-red-400 border border-red-800'
                            }`}
                          >
                            {route.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {route.targetType !== 'local' ? (
                            <button
                              onClick={() => deleteRoute(rt.id, route.id)}
                              className="p-1 rounded hover:bg-red-950/50 text-slate-500 hover:text-red-400 transition-colors"
                              title="Delete Route"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-mono">Immutable</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Route Modal */}
      {selectedRtForAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Add Route to {selectedRtForAdd.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRtForAdd(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Destination CIDR</label>
                <input
                  type="text"
                  value={destCidr}
                  onChange={e => setDestCidr(e.target.value)}
                  placeholder="e.g. 10.20.0.0/16 or 0.0.0.0/0"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target</label>
                <select
                  value={targetType}
                  onChange={e => setTargetType(e.target.value as RouteTargetType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-400 text-xs font-mono"
                >
                  <option value="peering-connection">Peering Connection ({peering.name})</option>
                  <option value="internet-gateway">Internet Gateway (ewb-igw-a)</option>
                </select>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedRtForAdd(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRoute}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Create Route
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
