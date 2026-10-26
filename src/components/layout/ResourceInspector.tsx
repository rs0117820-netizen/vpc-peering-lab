import React from 'react';
import {
  X,
  Layers,
  Grid,
  Route,
  ArrowLeftRight,
  ShieldCheck,
  Server,
  Globe,
  Tag,
  Copy,
  Check
} from 'lucide-react';
import { useLab } from '../../context/LabContext';

export const ResourceInspector: React.FC = () => {
  const { inspectingItem, setInspectingItem, vpcs, subnets, routeTables, securityGroups } = useLab();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!inspectingItem) return null;

  const { type, data } = inspectingItem;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const getIcon = () => {
    switch (type) {
      case 'vpc':
        return Layers;
      case 'subnet':
        return Grid;
      case 'routetable':
        return Route;
      case 'peering':
        return ArrowLeftRight;
      case 'securitygroup':
        return ShieldCheck;
      case 'host':
        return Server;
      case 'gateway':
        return Globe;
      default:
        return Layers;
    }
  };

  const Icon = getIcon();

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
              {type.toUpperCase()} Details
            </div>
            <div className="text-sm font-bold text-slate-100 truncate max-w-[200px]">
              {data.name || data.id}
            </div>
          </div>
        </div>
        <button
          onClick={() => setInspectingItem(null)}
          className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Resource Identifier Card */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Resource ID:</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-200">
              <span className="text-[11px] truncate max-w-[170px]">{data.id}</span>
              <button
                onClick={() => copyToClipboard(data.id, 'id')}
                className="text-slate-500 hover:text-amber-400 transition-colors"
                title="Copy ID"
              >
                {copiedKey === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {data.cidrBlock && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">IPv4 CIDR Block:</span>
              <span className="font-mono text-amber-400 font-semibold">{data.cidrBlock}</span>
            </div>
          )}

          {data.privateIp && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Private IPv4:</span>
              <span className="font-mono text-emerald-400 font-semibold">{data.privateIp}</span>
            </div>
          )}

          {data.publicIp && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Public IPv4:</span>
              <span className="font-mono text-blue-400 font-semibold">{data.publicIp}</span>
            </div>
          )}

          {data.status && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  data.status === 'active' || data.status === 'running' || data.status === 'available'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {data.status}
              </span>
            </div>
          )}
        </div>

        {/* Component Specific Details */}
        {type === 'vpc' && (
          <div className="space-y-3">
            <div className="text-slate-300 font-semibold text-xs border-b border-slate-800 pb-1">
              VPC Configuration
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">DNS Hostnames:</span>
                <span className="text-emerald-400">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DNS Resolution:</span>
                <span className="text-emerald-400">Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tenancy:</span>
                <span>default</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Subnets in VPC:</span>
                <span>{subnets.filter(s => s.vpcId === data.id).length} subnets</span>
              </div>
            </div>
          </div>
        )}

        {type === 'subnet' && (
          <div className="space-y-3">
            <div className="text-slate-300 font-semibold text-xs border-b border-slate-800 pb-1">
              Subnet Routing & Placement
            </div>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Subnet Scope:</span>
                <span className={`font-semibold ${data.type === 'public' ? 'text-amber-400' : 'text-purple-400'}`}>
                  {data.type.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Availability Zone:</span>
                <span className="font-mono">{data.availabilityZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Route Table ID:</span>
                <span className="font-mono text-[11px] text-slate-400">{data.routeTableId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auto-assign Public IP:</span>
                <span>{data.mapPublicIpOnLaunch ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        )}

        {type === 'peering' && (
          <div className="space-y-3">
            <div className="text-slate-300 font-semibold text-xs border-b border-slate-800 pb-1">
              Peering Relationship
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-slate-400">Requester VPC:</div>
              <div className="font-mono text-emerald-400">{data.requesterVpcId} (ewb-vpc-a)</div>
              <div className="text-slate-400 pt-1">Accepter VPC:</div>
              <div className="font-mono text-blue-400">{data.accepterVpcId} (ewb-vpc-b)</div>
              {data.statusMessage && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 mt-1">
                  {data.statusMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {type === 'routetable' && (
          <div className="space-y-2">
            <div className="text-slate-300 font-semibold text-xs border-b border-slate-800 pb-1">
              Simulated Route Entries ({data.routes?.length || 0})
            </div>
            <div className="space-y-1.5">
              {data.routes?.map((r: any, idx: number) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center text-[11px]">
                  <div>
                    <span className="font-mono text-slate-200">{r.destinationCidr}</span>
                    <div className="text-slate-500 text-[10px]">Target: {r.targetName || r.targetId}</div>
                  </div>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${r.status === 'active' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'securitygroup' && (
          <div className="space-y-2">
            <div className="text-slate-300 font-semibold text-xs border-b border-slate-800 pb-1">
              Inbound Rules ({data.inboundRules?.length || 0})
            </div>
            <div className="space-y-1.5">
              {data.inboundRules?.map((r: any, idx: number) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5 text-[11px]">
                  <div className="flex justify-between font-mono text-slate-200">
                    <span className="text-amber-400">{r.protocol.toUpperCase()} {r.portRange}</span>
                    <span className="text-slate-400">{r.sourceCidr}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">{r.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {data.tags && Object.keys(data.tags).length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-xs">
              <Tag className="w-3.5 h-3.5" />
              <span>Resource Tags</span>
            </div>
            <div className="space-y-1">
              {Object.entries(data.tags).map(([k, v]) => (
                <div key={k} className="flex justify-between p-1.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px]">
                  <span className="text-slate-400">{k}:</span>
                  <span className="text-slate-200">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
