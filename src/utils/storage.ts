import {
  Vpc,
  Subnet,
  RouteTable,
  PeeringConnection,
  SecurityGroup,
  SimulatedHost,
  ActivityLogItem,
  StudentInfo,
  SimulationResult
} from '../types/network';

export const INITIAL_VPCS: Vpc[] = [
  {
    id: 'vpc-0a1b2c3d4e5f6001a',
    name: 'ewb-vpc-a',
    cidrBlock: '10.10.0.0/16',
    region: 'ap-south-1',
    state: 'available',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: 'ewb-vpc-a',
      Project: 'EWB-VPC-Peering',
      Role: 'Requester-VPC'
    },
    createdAt: '2026-10-26T08:00:00Z'
  },
  {
    id: 'vpc-0a1b2c3d4e5f6002b',
    name: 'ewb-vpc-b',
    cidrBlock: '10.20.0.0/16',
    region: 'ap-south-1',
    state: 'available',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: 'ewb-vpc-b',
      Project: 'EWB-VPC-Peering',
      Role: 'Accepter-VPC'
    },
    createdAt: '2026-10-26T08:05:00Z'
  }
];

export const INITIAL_SUBNETS: Subnet[] = [
  {
    id: 'subnet-01public0000000a',
    name: 'ewb-a-public',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    cidrBlock: '10.10.1.0/24',
    availabilityZone: 'ap-south-1a',
    type: 'public',
    routeTableId: 'rtb-01public0000000a',
    mapPublicIpOnLaunch: true,
    tags: {
      Name: 'ewb-a-public',
      Scope: 'Public-Facing-Bastion'
    }
  },
  {
    id: 'subnet-02private000000a',
    name: 'ewb-a-private',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    cidrBlock: '10.10.2.0/24',
    availabilityZone: 'ap-south-1a',
    type: 'private',
    routeTableId: 'rtb-02private000000a',
    mapPublicIpOnLaunch: false,
    tags: {
      Name: 'ewb-a-private',
      Scope: 'Private-Workload-A'
    }
  },
  {
    id: 'subnet-03private000000b',
    name: 'ewb-b-private',
    vpcId: 'vpc-0a1b2c3d4e5f6002b',
    cidrBlock: '10.20.1.0/24',
    availabilityZone: 'ap-south-1b',
    type: 'private',
    routeTableId: 'rtb-03private000000b',
    mapPublicIpOnLaunch: false,
    tags: {
      Name: 'ewb-b-private',
      Scope: 'Private-Workload-B'
    }
  }
];

export const INITIAL_ROUTE_TABLES: RouteTable[] = [
  {
    id: 'rtb-01public0000000a',
    name: 'ewb-rt-a-public',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    isMain: false,
    routes: [
      {
        id: 'r-01a-local',
        destinationCidr: '10.10.0.0/16',
        targetType: 'local',
        targetId: 'local',
        targetName: 'local',
        status: 'active'
      },
      {
        id: 'r-01a-igw',
        destinationCidr: '0.0.0.0/0',
        targetType: 'internet-gateway',
        targetId: 'igw-0192837465abc',
        targetName: 'ewb-igw-a',
        status: 'active'
      },
      {
        id: 'r-01a-peer',
        destinationCidr: '10.20.0.0/16',
        targetType: 'peering-connection',
        targetId: 'pcx-0123456789abcdef0',
        targetName: 'ewb-a-b-peer',
        status: 'active'
      }
    ],
    associatedSubnetIds: ['subnet-01public0000000a'],
    tags: { Name: 'ewb-rt-a-public' }
  },
  {
    id: 'rtb-02private000000a',
    name: 'ewb-rt-a-private',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    isMain: true,
    routes: [
      {
        id: 'r-02a-local',
        destinationCidr: '10.10.0.0/16',
        targetType: 'local',
        targetId: 'local',
        targetName: 'local',
        status: 'active'
      },
      {
        id: 'r-02a-peer',
        destinationCidr: '10.20.0.0/16',
        targetType: 'peering-connection',
        targetId: 'pcx-0123456789abcdef0',
        targetName: 'ewb-a-b-peer',
        status: 'active'
      }
    ],
    associatedSubnetIds: ['subnet-02private000000a'],
    tags: { Name: 'ewb-rt-a-private' }
  },
  {
    id: 'rtb-03private000000b',
    name: 'ewb-rt-b-private',
    vpcId: 'vpc-0a1b2c3d4e5f6002b',
    isMain: true,
    routes: [
      {
        id: 'r-03b-local',
        destinationCidr: '10.20.0.0/16',
        targetType: 'local',
        targetId: 'local',
        targetName: 'local',
        status: 'active'
      },
      {
        id: 'r-03b-peer',
        destinationCidr: '10.10.0.0/16',
        targetType: 'peering-connection',
        targetId: 'pcx-0123456789abcdef0',
        targetName: 'ewb-a-b-peer',
        status: 'active'
      }
    ],
    associatedSubnetIds: ['subnet-03private000000b'],
    tags: { Name: 'ewb-rt-b-private' }
  }
];

export const INITIAL_PEERING: PeeringConnection = {
  id: 'pcx-0123456789abcdef0',
  name: 'ewb-a-b-peer',
  requesterVpcId: 'vpc-0a1b2c3d4e5f6001a',
  accepterVpcId: 'vpc-0a1b2c3d4e5f6002b',
  status: 'pending-acceptance',
  statusMessage: 'Pending acceptance by owner of vpc-0a1b2c3d4e5f6002b',
  createdAt: '2026-10-26T08:10:00Z',
  tags: {
    Name: 'ewb-a-b-peer',
    Side: 'Requester/Accepter'
  }
};

export const INITIAL_SECURITY_GROUPS: SecurityGroup[] = [
  {
    id: 'sg-01bastion00000001',
    name: 'ewb-bastion-sg',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    description: 'Security group for Bastion jump host - SSH strictly restricted to trusted admin IP',
    inboundRules: [
      {
        id: 'sgr-bastion-ssh',
        type: 'inbound',
        protocol: 'tcp',
        portRange: '22',
        sourceCidr: '203.0.113.25/32',
        description: 'SSH management from authorized corporate admin IP only'
      }
    ],
    outboundRules: [
      {
        id: 'sgr-bastion-out',
        type: 'outbound',
        protocol: 'all',
        portRange: 'ALL',
        sourceCidr: '0.0.0.0/0',
        description: 'Allow all outbound traffic'
      }
    ],
    tags: { Name: 'ewb-bastion-sg' }
  },
  {
    id: 'sg-02appa00000000002',
    name: 'ewb-app-a-sg',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    description: 'Security group for Workload App A in VPC A private subnet',
    inboundRules: [
      {
        id: 'sgr-appa-ssh',
        type: 'inbound',
        protocol: 'tcp',
        portRange: '22',
        sourceCidr: '10.10.1.10/32',
        description: 'SSH ingress exclusively from Bastion host'
      },
      {
        id: 'sgr-appa-icmp',
        type: 'inbound',
        protocol: 'icmp',
        portRange: 'ALL',
        sourceCidr: '10.20.1.10/32',
        description: 'ICMP echo request from App B for bidirectional latency diagnosis'
      }
    ],
    outboundRules: [
      {
        id: 'sgr-appa-out',
        type: 'outbound',
        protocol: 'all',
        portRange: 'ALL',
        sourceCidr: '0.0.0.0/0',
        description: 'Allow all outbound traffic'
      }
    ],
    tags: { Name: 'ewb-app-a-sg' }
  },
  {
    id: 'sg-03appb00000000003',
    name: 'ewb-app-b-sg',
    vpcId: 'vpc-0a1b2c3d4e5f6002b',
    description: 'Security group for Workload App B in VPC B private subnet',
    inboundRules: [
      {
        id: 'sgr-appb-ssh',
        type: 'inbound',
        protocol: 'tcp',
        portRange: '22',
        sourceCidr: '10.10.1.10/32',
        description: 'SSH ingress from Bastion host in VPC A'
      },
      {
        id: 'sgr-appb-icmp',
        type: 'inbound',
        protocol: 'icmp',
        portRange: 'ALL',
        sourceCidr: '10.10.2.10/32',
        description: 'ICMP echo request from App A across VPC Peering'
      }
    ],
    outboundRules: [
      {
        id: 'sgr-appb-out',
        type: 'outbound',
        protocol: 'all',
        portRange: 'ALL',
        sourceCidr: '0.0.0.0/0',
        description: 'Allow all outbound traffic'
      }
    ],
    tags: { Name: 'ewb-app-b-sg' }
  }
];

export const INITIAL_HOSTS: SimulatedHost[] = [
  {
    id: 'host-bastion-01',
    name: 'ewb-bastion',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    subnetId: 'subnet-01public0000000a',
    privateIp: '10.10.1.10',
    publicIp: '13.234.112.45',
    securityGroupId: 'sg-01bastion00000001',
    type: 'bastion',
    os: 'Amazon Linux 2023 (x86_64)',
    status: 'running'
  },
  {
    id: 'host-app-a-02',
    name: 'ewb-app-a',
    vpcId: 'vpc-0a1b2c3d4e5f6001a',
    subnetId: 'subnet-02private000000a',
    privateIp: '10.10.2.10',
    securityGroupId: 'sg-02appa00000000002',
    type: 'workload',
    os: 'Amazon Linux 2023 (x86_64)',
    status: 'running'
  },
  {
    id: 'host-app-b-03',
    name: 'ewb-app-b',
    vpcId: 'vpc-0a1b2c3d4e5f6002b',
    subnetId: 'subnet-03private000000b',
    privateIp: '10.20.1.10',
    securityGroupId: 'sg-03appb00000000003',
    type: 'workload',
    os: 'Amazon Linux 2023 (x86_64)',
    status: 'running'
  }
];

export const INITIAL_STUDENT_INFO: StudentInfo = {
  studentName: 'Rohan',
  studentIdOrRoll: 'AWS-NET-2026-001',
  institution: 'Department of Computer Science & Cloud Infrastructure',
  submissionDate: new Date().toISOString().split('T')[0],
  mentorOrInstructor: 'Cloud Networking Faculty',
  personalNotes: 'Demonstrated AWS VPC Peering, route table propagation, and SG security controls in isolated private subnets without AWS charges.'
};

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-26T08:00:00Z',
    category: 'vpc',
    title: 'VPC ewb-vpc-a Provisioned',
    description: 'VPC A created with CIDR 10.10.0.0/16 in ap-south-1 (Mumbai).',
    severity: 'info'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-26T08:05:00Z',
    category: 'vpc',
    title: 'VPC ewb-vpc-b Provisioned',
    description: 'VPC B created with non-overlapping CIDR 10.20.0.0/16 in ap-south-1 (Mumbai).',
    severity: 'info'
  },
  {
    id: 'log-3',
    timestamp: '2026-10-26T08:10:00Z',
    category: 'peering',
    title: 'Peering Request Created',
    description: 'Peering request ewb-a-b-peer initiated from VPC A to VPC B. Status: Pending Acceptance.',
    severity: 'warning'
  }
];

const STORAGE_KEY = 'aws_vpc_peering_lab_state_v1';

export function loadLabState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse saved lab state:', e);
    return null;
  }
}

export function saveLabState(state: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save lab state:', e);
  }
}

export function clearLabStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear lab storage:', e);
  }
}
