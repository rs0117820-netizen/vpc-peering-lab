import React, { useState } from 'react';
import {
  Layers,
  Edit2,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Info,
  Check,
  X,
  Plus
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { Vpc } from '../../types/network';

export const VpcListView: React.FC = () => {
  const { vpcs, subnets, updateVpcCidr, setInspectingItem, resetLab } = useLab();
  const [editingVpc, setEditingVpc] = useState<Vpc | null>(null);
  const [newCidr, setNewCidr] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStartEdit = (vpc: Vpc) => {
    setEditingVpc(vpc);
    setNewCidr(vpc.cidrBlock);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSaveCidr = () => {
    if (!editingVpc) return;
    const res = updateVpcCidr(editingVpc.id, newCidr);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update CIDR');
    } else {
      setSuccessMessage(`Successfully updated ${editingVpc.name} CIDR to ${newCidr}`);
      setTimeout(() => {
        setEditingVpc(null);
        setSuccessMessage(null);
      }, 1200);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Virtual Private Clouds (VPCs)</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {vpcs.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage virtual network boundaries, primary IPv4 CIDR blocks, and tenancy.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset VPCs to standard lab topology (10.10.0.0/16 and 10.20.0.0/16)?')) {
              resetLab();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Lab VPCs</span>
        </button>
      </div>

      {/* Educational Notice Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <div className="font-semibold text-slate-100">AWS Non-Overlapping CIDR Requirement</div>
          <p className="text-slate-400 leading-relaxed">
            In AWS, two VPCs cannot be peered if their IPv4 CIDR blocks overlap (e.g. attempting to peer two <code>10.0.0.0/16</code> VPCs). The simulator validates RFC1918 ranges and rejects overlapping subnets automatically.
          </p>
        </div>
      </div>

      {/* VPC Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">VPC ID</th>
                <th className="px-4 py-3">IPv4 CIDR</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Subnets</th>
                <th className="px-4 py-3">DNS Hostnames</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal text-slate-200">
              {vpcs.map(vpc => {
                const vpcSubnets = subnets.filter(s => s.vpcId === vpc.id);
                return (
                  <tr key={vpc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span>{vpc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{vpc.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {vpc.cidrBlock}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{vpc.region}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {vpcSubnets.length} subnets
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Enabled
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {vpc.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectingItem({ type: 'vpc', data: vpc })}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                          title="Inspect VPC Metadata"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(vpc)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] border border-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-amber-400" />
                          <span>Edit CIDR</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit CIDR Modal */}
      {editingVpc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Modify VPC CIDR — {editingVpc.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingVpc(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Primary IPv4 CIDR Block</label>
                <input
                  type="text"
                  value={newCidr}
                  onChange={e => setNewCidr(e.target.value)}
                  placeholder="e.g. 10.30.0.0/16"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 focus:outline-none focus:border-amber-400 text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Allowed AWS block size: /16 to /28. Must not overlap other VPC CIDRs.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>{successMessage}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingVpc(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCidr}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
