import React, { useState } from 'react';
import {
  Clock,
  Filter,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { ActivityCategory } from '../../types/network';

export const ActivityLogView: React.FC = () => {
  const { activityLogs, resetLab } = useLab();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = activityLogs.filter(log => {
    const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> SUCCESS
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
            <AlertTriangle className="w-3 h-3" /> WARNING
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
            <XCircle className="w-3 h-3" /> FAILED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            <Info className="w-3 h-3" /> INFO
          </span>
        );
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activityLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vpc_peering_activity_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Simulation Activity & Audit Log</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
              {filteredLogs.length} events
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of peering requests, route table updates, security group changes, and connectivity tests.
          </p>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-xs">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'peering', 'route', 'security', 'connectivity', 'vpc', 'system'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search activity events..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-sans"
          />
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filteredLogs.map(log => (
          <div
            key={log.id}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-slate-100 text-sm">{log.title}</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  {log.category}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{log.description}</p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
              {getSeverityBadge(log.severity)}
              <span className="text-[11px] font-mono text-slate-500">
                {new Date(log.timestamp).toLocaleTimeString()} · {new Date(log.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
            No activity log events match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
