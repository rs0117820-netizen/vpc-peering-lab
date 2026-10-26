import React from 'react';
import {
  Grid,
  Eye,
  CheckCircle2,
  Lock,
  Globe,
  Info,
  Server
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { isCidrContained } from '../../utils/cidr';

export const SubnetListView: React.FC = () => {
  const { subnets, vpcs, routeTables, hosts, setInspectingItem } = useLab();

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Subnets & Network Segments</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {subnets.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage public and private subnet boundaries, AZ placement, and route table associations.
          </p>
        </div>
      </div>

      {/* Explanatory Box on AWS Subnet Reserved IPs */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-300">
          <div className="font-semibold text-slate-100">AWS Reserved Subnet Addresses</div>
          <p className="text-slate-400 leading-relaxed">
            In every AWS VPC subnet, Amazon reserves 5 IP addresses: <code>.0</code> (Network), <code>.1</code> (VPC Router/Gateway), <code>.2</code> (Amazon DNS), <code>.3</code> (Future use), and <code>.255</code> (Network broadcast). A <code>/24</code> subnet provides 251 usable host IPs.
          </p>
        </div>
      </div>

      {/* Subnet Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Subnet Name</th>
                <th className="px-4 py-3">Subnet ID</th>
                <th className="px-4 py-3">Parent VPC</th>
                <th className="px-4 py-3">IPv4 CIDR</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Availability Zone</th>
                <th className="px-4 py-3">Associated Route Table</th>
                <th className="px-4 py-3">Hosts</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-normal text-slate-200">
              {subnets.map(subnet => {
                const parentVpc = vpcs.find(v => v.id === subnet.vpcId);
                const rt = routeTables.find(r => r.id === subnet.routeTableId);
                const subnetHosts = hosts.filter(h => h.subnetId === subnet.id);
                const isContained = parentVpc ? isCidrContained(subnet.cidrBlock, parentVpc.cidrBlock) : false;

                return (
                  <tr key={subnet.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <Grid className={`w-4 h-4 ${subnet.type === 'public' ? 'text-amber-400' : 'text-purple-400'}`} />
                        <span>{subnet.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{subnet.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-slate-200">{parentVpc?.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({parentVpc?.cidrBlock})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-100 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {subnet.cidrBlock}
                        </span>
                        {isContained && (
                          <span title="Valid: Subnet falls inside parent VPC CIDR">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          subnet.type === 'public'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-purple-950 text-purple-400 border border-purple-800'
                        }`}
                      >
                        {subnet.type === 'public' ? (
                          <>
                            <Globe className="w-3 h-3 text-amber-400" /> Public
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-purple-400" /> Private
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{subnet.availabilityZone}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] text-indigo-400">
                        {rt?.name || subnet.routeTableId}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-mono text-slate-300 text-[11px]">
                        <Server className="w-3.5 h-3.5 text-slate-400" />
                        <span>{subnetHosts.length}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setInspectingItem({ type: 'subnet', data: subnet })}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Inspect Subnet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
