import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Server,
  Lock
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { SecurityGroup, SecurityGroupRule } from '../../types/network';

export const SecurityGroupsView: React.FC = () => {
  const { securityGroups, vpcs, addSecurityGroupRule, removeSecurityGroupRule, setInspectingItem } = useLab();
  const [selectedSgForAdd, setSelectedSgForAdd] = useState<SecurityGroup | null>(null);
  const [protocol, setProtocol] = useState<'tcp' | 'udp' | 'icmp' | 'all'>('icmp');
  const [portRange, setPortRange] = useState('ALL');
  const [sourceCidr, setSourceCidr] = useState('10.10.2.10/32');
  const [description, setDescription] = useState('Allow ICMP echo request');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleOpenAddModal = (sg: SecurityGroup) => {
    setSelectedSgForAdd(sg);
    setErrorNotice(null);
    if (sg.name.includes('bastion')) {
      setProtocol('tcp');
      setPortRange('22');
      setSourceCidr('203.0.113.50/32');
      setDescription('Trusted admin IP management');
    } else {
      setProtocol('icmp');
      setPortRange('ALL');
      setSourceCidr('10.10.2.10/32');
      setDescription('ICMP Echo Request from peered workload');
    }
  };

  const handleSaveRule = () => {
    if (!selectedSgForAdd) return;

    const res = addSecurityGroupRule(selectedSgForAdd.id, {
      type: 'inbound',
      protocol,
      portRange,
      sourceCidr,
      description
    });

    if (!res.success) {
      setErrorNotice(res.error || 'Failed to add rule');
    } else {
      setSelectedSgForAdd(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Security Groups & Firewall Rules</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {securityGroups.length} groups
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Stateful virtual firewalls filtering ingress and egress traffic at the EC2 ENI level.
          </p>
        </div>
      </div>

      {/* Critical Security Callout Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-600/40 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <div className="font-bold text-amber-300">AWS Security Principle: Never Allow 0.0.0.0/0 for SSH</div>
          <p className="text-slate-400 leading-relaxed">
            Opening TCP Port 22 to the world (<code className="text-red-400">0.0.0.0/0</code>) exposes servers to brute-force attacks. Bastion jump hosts must always be locked down to a trusted IPv4 <code className="text-emerald-400">/32</code> address. Workloads in private subnets should only accept SSH from the bastion's private IP (<code className="text-emerald-400">10.10.1.10/32</code>).
          </p>
        </div>
      </div>

      {/* Security Groups List */}
      <div className="space-y-6">
        {securityGroups.map(sg => {
          const parentVpc = vpcs.find(v => v.id === sg.vpcId);

          return (
            <div
              key={sg.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl"
            >
              {/* SG Header */}
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{sg.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{sg.id}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>VPC: <strong className="text-slate-300">{parentVpc?.name}</strong></span>
                      <span>•</span>
                      <span>{sg.description}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddModal(sg)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Inbound Rule</span>
                  </button>
                </div>
              </div>

              {/* Inbound Rules Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800/80 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Protocol</th>
                      <th className="px-4 py-2.5">Port Range</th>
                      <th className="px-4 py-2.5">Source CIDR</th>
                      <th className="px-4 py-2.5">Description</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-normal text-slate-200">
                    {sg.inboundRules.map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 capitalize text-slate-300 font-semibold text-[11px]">
                          {rule.type}
                        </td>
                        <td className="px-4 py-3 font-mono uppercase font-bold text-amber-400">
                          {rule.protocol}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-200">
                          {rule.portRange}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                            {rule.sourceCidr}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {rule.description}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeSecurityGroupRule(sg.id, rule.id)}
                            className="p-1 rounded hover:bg-red-950/50 text-slate-500 hover:text-red-400 transition-colors"
                            title="Remove Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sg.inboundRules.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-slate-500 italic">
                          No inbound rules configured. Default AWS behavior: all inbound traffic is blocked.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Rule Modal */}
      {selectedSgForAdd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm">
                  Add Inbound Rule to {selectedSgForAdd.name}
                </h3>
              </div>
              <button onClick={() => setSelectedSgForAdd(null)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Protocol</label>
                  <select
                    value={protocol}
                    onChange={e => {
                      const p = e.target.value as any;
                      setProtocol(p);
                      if (p === 'icmp') setPortRange('ALL');
                      if (p === 'tcp') setPortRange('22');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-xs"
                  >
                    <option value="icmp">ICMP (Ping)</option>
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="all">All Traffic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Port Range</label>
                  <input
                    type="text"
                    value={portRange}
                    onChange={e => setPortRange(e.target.value)}
                    placeholder="22 or ALL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source IPv4 CIDR</label>
                <input
                  type="text"
                  value={sourceCidr}
                  onChange={e => setSourceCidr(e.target.value)}
                  placeholder="e.g. 10.10.2.10/32"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 font-mono text-slate-100 text-xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be valid CIDR format. SSH rules allowing 0.0.0.0/0 are strictly rejected.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Rule purpose"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs"
                />
              </div>

              {errorNotice && (
                <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>{errorNotice}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedSgForAdd(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
