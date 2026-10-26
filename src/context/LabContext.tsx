import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Vpc,
  Subnet,
  RouteTable,
  RouteEntry,
  RouteTargetType,
  PeeringConnection,
  PeeringStatus,
  SecurityGroup,
  SecurityGroupRule,
  SimulatedHost,
  ActivityLogItem,
  StudentInfo,
  SimulationResult,
  ActivityCategory
} from '../types/network';
import {
  INITIAL_VPCS,
  INITIAL_SUBNETS,
  INITIAL_ROUTE_TABLES,
  INITIAL_PEERING,
  INITIAL_SECURITY_GROUPS,
  INITIAL_HOSTS,
  INITIAL_STUDENT_INFO,
  INITIAL_ACTIVITY_LOGS,
  loadLabState,
  saveLabState,
  clearLabStorage
} from '../utils/storage';
import { isValidCidr, doCidrsOverlap, isCidrContained } from '../utils/cidr';
import { runConnectivityTest } from '../utils/simulator';

export type TabId =
  | 'dashboard'
  | 'topology'
  | 'vpcs'
  | 'subnets'
  | 'routes'
  | 'peering'
  | 'security'
  | 'connectivity'
  | 'failure-lab'
  | 'activity'
  | 'report';

interface InspectedItem {
  type: 'vpc' | 'subnet' | 'routetable' | 'peering' | 'securitygroup' | 'host' | 'gateway';
  data: any;
}

interface LabContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  vpcs: Vpc[];
  subnets: Subnet[];
  routeTables: RouteTable[];
  peering: PeeringConnection;
  securityGroups: SecurityGroup[];
  hosts: SimulatedHost[];
  studentInfo: StudentInfo;
  activityLogs: ActivityLogItem[];
  latestTest: SimulationResult | null;
  inspectingItem: InspectedItem | null;
  setInspectingItem: (item: InspectedItem | null) => void;
  // Actions
  updateVpcCidr: (vpcId: string, newCidr: string) => { success: boolean; error?: string };
  updatePeeringStatus: (status: PeeringStatus) => void;
  deletePeering: () => void;
  createPeering: (name: string, requesterVpcId: string, accepterVpcId: string) => { success: boolean; error?: string };
  addRoute: (routeTableId: string, destinationCidr: string, targetType: RouteTargetType, targetId: string, targetName: string) => { success: boolean; error?: string };
  deleteRoute: (routeTableId: string, routeId: string) => void;
  addSecurityGroupRule: (sgId: string, rule: Omit<SecurityGroupRule, 'id'>) => { success: boolean; error?: string };
  removeSecurityGroupRule: (sgId: string, ruleId: string) => void;
  executeTest: (command: string, sourceHostId?: string) => SimulationResult;
  updateStudentInfo: (info: Partial<StudentInfo>) => void;
  resetLab: () => void;
  applyPreset: (presetName: 'default' | 'broken-peering' | 'missing-route' | 'sg-blocked') => void;
  logActivity: (category: ActivityCategory, title: string, description: string, severity?: ActivityLogItem['severity']) => void;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [vpcs, setVpcs] = useState<Vpc[]>(INITIAL_VPCS);
  const [subnets, setSubnets] = useState<Subnet[]>(INITIAL_SUBNETS);
  const [routeTables, setRouteTables] = useState<RouteTable[]>(INITIAL_ROUTE_TABLES);
  const [peering, setPeering] = useState<PeeringConnection>(INITIAL_PEERING);
  const [securityGroups, setSecurityGroups] = useState<SecurityGroup[]>(INITIAL_SECURITY_GROUPS);
  const [hosts, setHosts] = useState<SimulatedHost[]>(INITIAL_HOSTS);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(INITIAL_STUDENT_INFO);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOGS);
  const [latestTest, setLatestTest] = useState<SimulationResult | null>(null);
  const [inspectingItem, setInspectingItem] = useState<InspectedItem | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const saved = loadLabState();
    if (saved) {
      if (saved.vpcs) setVpcs(saved.vpcs);
      if (saved.subnets) setSubnets(saved.subnets);
      if (saved.routeTables) setRouteTables(saved.routeTables);
      if (saved.peering) setPeering(saved.peering);
      if (saved.securityGroups) setSecurityGroups(saved.securityGroups);
      if (saved.hosts) setHosts(saved.hosts);
      if (saved.studentInfo) setStudentInfo(saved.studentInfo);
      if (saved.activityLogs) setActivityLogs(saved.activityLogs);
      if (saved.latestTest) setLatestTest(saved.latestTest);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage on state changes
  useEffect(() => {
    if (!isInitialized) return;
    saveLabState({
      vpcs,
      subnets,
      routeTables,
      peering,
      securityGroups,
      hosts,
      studentInfo,
      activityLogs,
      latestTest
    });
  }, [vpcs, subnets, routeTables, peering, securityGroups, hosts, studentInfo, activityLogs, latestTest, isInitialized]);

  const logActivity = (
    category: ActivityCategory,
    title: string,
    description: string,
    severity: ActivityLogItem['severity'] = 'info'
  ) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      category,
      title,
      description,
      severity
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const updateVpcCidr = (vpcId: string, newCidr: string) => {
    const check = isValidCidr(newCidr);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    // Check overlap with other VPCs
    const otherVpcs = vpcs.filter(v => v.id !== vpcId);
    for (const other of otherVpcs) {
      if (doCidrsOverlap(newCidr, other.cidrBlock)) {
        return {
          success: false,
          error: `CIDR ${newCidr} overlaps with existing VPC '${other.name}' (${other.cidrBlock}). AWS VPC Peering strictly prohibits overlapping address spaces.`
        };
      }
    }

    setVpcs(prev =>
      prev.map(v => (v.id === vpcId ? { ...v, cidrBlock: newCidr } : v))
    );

    logActivity('vpc', 'VPC CIDR Modified', `Updated VPC ${vpcId} CIDR to ${newCidr}`, 'warning');
    return { success: true };
  };

  const updatePeeringStatus = (status: PeeringStatus) => {
    setPeering(prev => ({
      ...prev,
      status,
      statusMessage:
        status === 'active'
          ? 'Active and routing traffic between VPCs'
          : status === 'pending-acceptance'
          ? 'Pending acceptance by accepter VPC owner'
          : status === 'rejected'
          ? 'Peering connection was rejected by accepter'
          : 'Peering connection deleted'
    }));

    const sev = status === 'active' ? 'success' : status === 'rejected' ? 'error' : 'warning';
    logActivity('peering', `Peering Status Changed: ${status.toUpperCase()}`, `Peering connection '${peering.name}' is now ${status}.`, sev);
  };

  const deletePeering = () => {
    setPeering(prev => ({
      ...prev,
      status: 'deleted',
      statusMessage: 'Peering connection was terminated. Routes referencing it are now in blackhole status.'
    }));

    // Update routes target status to blackhole
    setRouteTables(prev =>
      prev.map(rt => ({
        ...rt,
        routes: rt.routes.map(r =>
          r.targetType === 'peering-connection' ? { ...r, status: 'blackhole' } : r
        )
      }))
    );

    logActivity('peering', 'Peering Connection Deleted', `Deleted peering link '${peering.name}'. Dependent routes entered blackhole state.`, 'error');
  };

  const createPeering = (name: string, requesterVpcId: string, accepterVpcId: string) => {
    if (requesterVpcId === accepterVpcId) {
      return { success: false, error: 'Cannot peer a VPC with itself.' };
    }

    const reqVpc = vpcs.find(v => v.id === requesterVpcId);
    const accVpc = vpcs.find(v => v.id === accepterVpcId);

    if (!reqVpc || !accVpc) {
      return { success: false, error: 'Invalid requester or accepter VPC selected.' };
    }

    if (doCidrsOverlap(reqVpc.cidrBlock, accVpc.cidrBlock)) {
      return {
        success: false,
        error: `Cannot create peering connection: CIDR blocks overlap (${reqVpc.cidrBlock} vs ${accVpc.cidrBlock}).`
      };
    }

    const newPeer: PeeringConnection = {
      id: `pcx-${Math.random().toString(36).substr(2, 17)}`,
      name: name || 'ewb-a-b-peer',
      requesterVpcId,
      accepterVpcId,
      status: 'pending-acceptance',
      statusMessage: `Peering request pending acceptance by owner of ${accVpc.name}`,
      createdAt: new Date().toISOString(),
      tags: { Name: name || 'ewb-a-b-peer' }
    };

    setPeering(newPeer);

    // Restore active route status
    setRouteTables(prev =>
      prev.map(rt => ({
        ...rt,
        routes: rt.routes.map(r =>
          r.targetType === 'peering-connection'
            ? { ...r, targetId: newPeer.id, targetName: newPeer.name, status: 'active' }
            : r
        )
      }))
    );

    logActivity('peering', 'Peering Request Initiated', `Created peering request '${newPeer.name}' from ${reqVpc.name} to ${accVpc.name}.`, 'info');
    return { success: true };
  };

  const addRoute = (
    routeTableId: string,
    destinationCidr: string,
    targetType: RouteTargetType,
    targetId: string,
    targetName: string
  ) => {
    const check = isValidCidr(destinationCidr);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    const rt = routeTables.find(r => r.id === routeTableId);
    if (!rt) return { success: false, error: 'Route table not found.' };

    if (rt.routes.some(r => r.destinationCidr === destinationCidr)) {
      return { success: false, error: `A route for destination ${destinationCidr} already exists in this route table.` };
    }

    const newRoute: RouteEntry = {
      id: `r-${Date.now().toString(36)}`,
      destinationCidr,
      targetType,
      targetId,
      targetName,
      status: 'active'
    };

    setRouteTables(prev =>
      prev.map(t => (t.id === routeTableId ? { ...t, routes: [...t.routes, newRoute] } : t))
    );

    logActivity('route', 'Route Entry Added', `Added route ${destinationCidr} -> ${targetName} to route table ${rt.name}`, 'info');
    return { success: true };
  };

  const deleteRoute = (routeTableId: string, routeId: string) => {
    const rt = routeTables.find(r => r.id === routeTableId);
    const targetRoute = rt?.routes.find(r => r.id === routeId);

    if (targetRoute?.targetType === 'local') {
      alert("AWS Protection: You cannot delete the default 'local' VPC route entry.");
      return;
    }

    setRouteTables(prev =>
      prev.map(t =>
        t.id === routeTableId
          ? { ...t, routes: t.routes.filter(r => r.id !== routeId) }
          : t
      )
    );

    if (rt && targetRoute) {
      logActivity('route', 'Route Entry Deleted', `Removed route ${targetRoute.destinationCidr} from ${rt.name}`, 'warning');
    }
  };

  const addSecurityGroupRule = (sgId: string, rule: Omit<SecurityGroupRule, 'id'>) => {
    const check = isValidCidr(rule.sourceCidr);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    // Security warning check: do not allow SSH from 0.0.0.0/0
    if (rule.protocol === 'tcp' && rule.portRange === '22' && (rule.sourceCidr === '0.0.0.0/0' || rule.sourceCidr === '0.0.0.0/1')) {
      return {
        success: false,
        error: "SECURITY VIOLATION: Never create an SSH rule allowing ingress from 0.0.0.0/0. Bastion and workload SSH must be restricted to a trusted /32 IPv4 address."
      };
    }

    const sg = securityGroups.find(s => s.id === sgId);
    if (!sg) return { success: false, error: 'Security group not found.' };

    const newRule: SecurityGroupRule = {
      ...rule,
      id: `sgr-${Date.now().toString(36)}`
    };

    setSecurityGroups(prev =>
      prev.map(s =>
        s.id === sgId
          ? {
              ...s,
              inboundRules: rule.type === 'inbound' ? [...s.inboundRules, newRule] : s.inboundRules,
              outboundRules: rule.type === 'outbound' ? [...s.outboundRules, newRule] : s.outboundRules
            }
          : s
      )
    );

    logActivity('security', 'Security Group Rule Added', `Added ${rule.type} rule: ${rule.protocol.toUpperCase()} ${rule.portRange} from ${rule.sourceCidr} in ${sg.name}`, 'info');
    return { success: true };
  };

  const removeSecurityGroupRule = (sgId: string, ruleId: string) => {
    const sg = securityGroups.find(s => s.id === sgId);
    const rule = sg?.inboundRules.find(r => r.id === ruleId) || sg?.outboundRules.find(r => r.id === ruleId);

    setSecurityGroups(prev =>
      prev.map(s =>
        s.id === sgId
          ? {
              ...s,
              inboundRules: s.inboundRules.filter(r => r.id !== ruleId),
              outboundRules: s.outboundRules.filter(r => r.id !== ruleId)
            }
          : s
      )
    );

    if (sg && rule) {
      logActivity('security', 'Security Group Rule Removed', `Removed ${rule.protocol.toUpperCase()} rule (${rule.sourceCidr}) from ${sg.name}`, 'warning');
    }
  };

  const executeTest = (command: string, sourceHostId?: string) => {
    const activeHostId = sourceHostId || hosts[1].id; // ewb-app-a
    const result = runConnectivityTest(command, activeHostId, {
      vpcs,
      subnets,
      routeTables,
      peering,
      securityGroups,
      hosts
    });

    setLatestTest(result);

    const title = result.success
      ? `Connectivity Test Passed: ${command}`
      : `Connectivity Test Failed: ${command}`;
    const desc = result.success
      ? `Successfully transmitted packets with 0% packet loss (Avg RTT: ${result.rttAvgMs}ms)`
      : result.failureReason || 'Packet transmission timed out.';

    logActivity('connectivity', title, desc, result.success ? 'success' : 'error');
    return result;
  };

  const updateStudentInfo = (info: Partial<StudentInfo>) => {
    setStudentInfo(prev => ({ ...prev, ...info }));
  };

  const resetLab = () => {
    clearLabStorage();
    setVpcs(INITIAL_VPCS);
    setSubnets(INITIAL_SUBNETS);
    setRouteTables(INITIAL_ROUTE_TABLES);
    setPeering(INITIAL_PEERING);
    setSecurityGroups(INITIAL_SECURITY_GROUPS);
    setHosts(INITIAL_HOSTS);
    setStudentInfo(INITIAL_STUDENT_INFO);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setLatestTest(null);
    setInspectingItem(null);
    logActivity('system', 'Lab Reset to Defaults', 'Restored pristine AWS VPC Peering laboratory environment.', 'info');
  };

  const applyPreset = (presetName: 'default' | 'broken-peering' | 'missing-route' | 'sg-blocked') => {
    if (presetName === 'default') {
      setPeering({ ...INITIAL_PEERING, status: 'active', statusMessage: 'Active and healthy' });
      setRouteTables(INITIAL_ROUTE_TABLES);
      setSecurityGroups(INITIAL_SECURITY_GROUPS);
      logActivity('system', 'Loaded Working Lab Preset', 'All route tables, active peering, and security rules applied.', 'success');
    } else if (presetName === 'broken-peering') {
      setPeering({ ...INITIAL_PEERING, status: 'pending-acceptance', statusMessage: 'Pending acceptance' });
      logActivity('peering', 'Preset: Pending Peering Connection', 'Peering set to pending acceptance for failure testing.', 'warning');
    } else if (presetName === 'missing-route') {
      // Remove return route from VPC B
      setPeering({ ...INITIAL_PEERING, status: 'active' });
      setRouteTables(prev =>
        prev.map(rt =>
          rt.name === 'ewb-rt-b-private'
            ? { ...rt, routes: rt.routes.filter(r => r.targetType !== 'peering-connection') }
            : rt
        )
      );
      logActivity('route', 'Preset: Missing Return Route', 'Deleted peering route from ewb-rt-b-private to trigger asymmetric routing drop.', 'error');
    } else if (presetName === 'sg-blocked') {
      // Remove ICMP rule from App B
      setPeering({ ...INITIAL_PEERING, status: 'active' });
      setSecurityGroups(prev =>
        prev.map(sg =>
          sg.name === 'ewb-app-b-sg'
            ? { ...sg, inboundRules: sg.inboundRules.filter(r => r.protocol !== 'icmp') }
            : sg
        )
      );
      logActivity('security', 'Preset: ICMP Blocked by SG', 'Removed ICMP ingress rule on ewb-app-b-sg to simulate security group firewall drop.', 'error');
    }
  };

  return (
    <LabContext.Provider
      value={{
        activeTab,
        setActiveTab,
        vpcs,
        subnets,
        routeTables,
        peering,
        securityGroups,
        hosts,
        studentInfo,
        activityLogs,
        latestTest,
        inspectingItem,
        setInspectingItem,
        updateVpcCidr,
        updatePeeringStatus,
        deletePeering,
        createPeering,
        addRoute,
        deleteRoute,
        addSecurityGroupRule,
        removeSecurityGroupRule,
        executeTest,
        updateStudentInfo,
        resetLab,
        applyPreset,
        logActivity
      }}
    >
      {children}
    </LabContext.Provider>
  );
};

export function useLab() {
  const context = useContext(LabContext);
  if (!context) {
    throw new Error('useLab must be used within a LabProvider');
  }
  return context;
}
