import React from 'react';
import { LabProvider, useLab } from './context/LabContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ResourceInspector } from './components/layout/ResourceInspector';
import { DashboardView } from './components/views/DashboardView';
import { InteractiveTopology } from './components/topology/InteractiveTopology';
import { VpcListView } from './components/views/VpcListView';
import { SubnetListView } from './components/views/SubnetListView';
import { RouteTablesView } from './components/views/RouteTablesView';
import { PeeringView } from './components/views/PeeringView';
import { SecurityGroupsView } from './components/views/SecurityGroupsView';
import { ConnectivityTerminalView } from './components/views/ConnectivityTerminalView';
import { FailureLabView } from './components/views/FailureLabView';
import { ActivityLogView } from './components/views/ActivityLogView';
import { ReportView } from './components/views/ReportView';

const MainContent: React.FC = () => {
  const { activeTab } = useLab();

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'topology' && <InteractiveTopology />}
        {activeTab === 'vpcs' && <VpcListView />}
        {activeTab === 'subnets' && <SubnetListView />}
        {activeTab === 'routes' && <RouteTablesView />}
        {activeTab === 'peering' && <PeeringView />}
        {activeTab === 'security' && <SecurityGroupsView />}
        {activeTab === 'connectivity' && <ConnectivityTerminalView />}
        {activeTab === 'failure-lab' && <FailureLabView />}
        {activeTab === 'activity' && <ActivityLogView />}
        {activeTab === 'report' && <ReportView />}
      </main>
      <ResourceInspector />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <LabProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
        <Sidebar />
        <MainContent />
      </div>
    </LabProvider>
  );
};

export default App;
