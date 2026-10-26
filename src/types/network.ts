// AWS VPC Peering Lab - TypeScript Domain Models

export type VpcId = string;
export type SubnetId = string;
export type RouteTableId = string;
export type PeeringConnectionId = string;
export type SecurityGroupId = string;
export type HostId = string;

export interface Vpc {
  id: VpcId;
  name: string;
  cidrBlock: string;
  region: string;
  state: 'available' | 'pending' | 'modifying';
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
  tags: Record<string, string>;
  createdAt: string;
}

export type SubnetType = 'public' | 'private';

export interface Subnet {
  id: SubnetId;
  name: string;
  vpcId: VpcId;
  cidrBlock: string;
  availabilityZone: string;
  type: SubnetType;
  routeTableId: RouteTableId;
  mapPublicIpOnLaunch: boolean;
  tags: Record<string, string>;
}

export type RouteTargetType = 'local' | 'internet-gateway' | 'peering-connection' | 'nat-gateway' | 'blackhole';

export interface RouteEntry {
  id: string;
  destinationCidr: string;
  targetType: RouteTargetType;
  targetId: string; // e.g. 'local', 'ewb-igw-a', 'ewb-a-b-peer'
  targetName?: string;
  status: 'active' | 'blackhole';
}

export interface RouteTable {
  id: RouteTableId;
  name: string;
  vpcId: VpcId;
  isMain: boolean;
  routes: RouteEntry[];
  associatedSubnetIds: SubnetId[];
  tags: Record<string, string>;
}

export type PeeringStatus = 'pending-acceptance' | 'active' | 'rejected' | 'deleted';

export interface PeeringConnection {
  id: PeeringConnectionId;
  name: string;
  requesterVpcId: VpcId;
  accepterVpcId: VpcId;
  status: PeeringStatus;
  statusMessage?: string;
  createdAt: string;
  tags: Record<string, string>;
}

export interface SecurityGroupRule {
  id: string;
  type: 'inbound' | 'outbound';
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  portRange: string; // e.g. "22", "80", "ALL"
  sourceCidr: string; // e.g. "10.10.1.10/32", "0.0.0.0/0"
  description: string;
}

export interface SecurityGroup {
  id: SecurityGroupId;
  name: string;
  vpcId: VpcId;
  description: string;
  inboundRules: SecurityGroupRule[];
  outboundRules: SecurityGroupRule[];
  tags: Record<string, string>;
}

export interface SimulatedHost {
  id: HostId;
  name: string;
  vpcId: VpcId;
  subnetId: SubnetId;
  privateIp: string;
  publicIp?: string;
  securityGroupId: SecurityGroupId;
  type: 'bastion' | 'workload';
  os: string;
  status: 'running' | 'stopped';
}

export interface HopStep {
  step: number;
  component: string;
  action: string;
  details: string;
  status: 'success' | 'failed' | 'warning';
}

export interface SimulationResult {
  command: string;
  timestamp: string;
  success: boolean;
  sourceHost: SimulatedHost;
  destinationIp: string;
  destinationHost?: SimulatedHost;
  packetLossPercent: number;
  rttAvgMs: number;
  hops: HopStep[];
  outputLines: string[];
  failureReason?: string;
  troubleshootingTip?: string;
}

export type ActivityCategory = 'peering' | 'route' | 'security' | 'vpc' | 'subnet' | 'connectivity' | 'system';

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  metadata?: Record<string, any>;
}

export interface StudentInfo {
  studentName: string;
  studentIdOrRoll: string;
  institution: string;
  submissionDate: string;
  mentorOrInstructor: string;
  personalNotes: string;
}
