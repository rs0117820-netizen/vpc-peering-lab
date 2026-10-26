import {
  Vpc,
  Subnet,
  RouteTable,
  PeeringConnection,
  SecurityGroup,
  SimulatedHost,
  SimulationResult,
  HopStep
} from '../types/network';
import { isIpInCidr, findMatchingRoute } from './cidr';

export interface LabContextState {
  vpcs: Vpc[];
  subnets: Subnet[];
  routeTables: RouteTable[];
  peering: PeeringConnection;
  securityGroups: SecurityGroup[];
  hosts: SimulatedHost[];
}

export function runConnectivityTest(
  command: string,
  sourceHostId: string,
  state: LabContextState
): SimulationResult {
  const parts = command.trim().split(/\s+/);
  const tool = parts[0]?.toLowerCase() || '';
  const targetArg = parts[1] || '';
  const timestamp = new Date().toISOString();

  const sourceHost = state.hosts.find(h => h.id === sourceHostId) || state.hosts[1]; // default to ewb-app-a
  const sourceSubnet = state.subnets.find(s => s.id === sourceHost.subnetId);
  const sourceVpc = state.vpcs.find(v => v.id === sourceHost.vpcId);
  const sourceRt = state.routeTables.find(rt => rt.id === sourceSubnet?.routeTableId);
  const sourceSg = state.securityGroups.find(sg => sg.id === sourceHost.securityGroupId);

  // Handle special terminal commands
  if (tool === 'ip' && targetArg === 'route') {
    return handleIpRoute(sourceHost, sourceSubnet, sourceRt, state, timestamp);
  }

  if (tool === 'traceroute' || tool === 'tracepath') {
    return handleTraceroute(tool, targetArg, sourceHost, sourceSubnet, sourceRt, sourceSg, state, timestamp);
  }

  if (tool === 'curl') {
    return handleCurl(targetArg, sourceHost, sourceSubnet, sourceRt, sourceSg, state, timestamp);
  }

  if (tool === 'ssh') {
    return handleSsh(parts, sourceHost, state, timestamp);
  }

  // Default to ping
  const destinationIp = targetArg;
  const hops: HopStep[] = [];
  const outputLines: string[] = [];

  outputLines.push(`PING ${destinationIp} (${destinationIp}) 56(84) bytes of data.`);

  // Validation 0: Target IP syntax
  if (!destinationIp) {
    return {
      command,
      timestamp,
      success: false,
      sourceHost,
      destinationIp: 'unknown',
      packetLossPercent: 100,
      rttAvgMs: 0,
      hops: [],
      outputLines: ['Usage: ping <destination-ip> (e.g. ping 10.20.1.10)'],
      failureReason: 'Missing destination IP parameter.'
    };
  }

  // Find destination host if in lab
  const destinationHost = state.hosts.find(
    h => h.privateIp === destinationIp || (h.publicIp && h.publicIp === destinationIp)
  );
  const destSubnet = destinationHost ? state.subnets.find(s => s.id === destinationHost.subnetId) : undefined;
  const destVpc = destinationHost ? state.vpcs.find(v => v.id === destinationHost.vpcId) : undefined;
  const destRt = destSubnet ? state.routeTables.find(rt => rt.id === destSubnet.routeTableId) : undefined;
  const destSg = destinationHost ? state.securityGroups.find(sg => sg.id === destinationHost.securityGroupId) : undefined;

  // Hop 1: Source Host
  hops.push({
    step: 1,
    component: sourceHost.name,
    action: 'Generate Packet',
    details: `Source host ${sourceHost.name} (${sourceHost.privateIp}) sent ICMP echo request`,
    status: 'success'
  });

  // Check 1: Source Route Table Lookup
  if (!sourceRt) {
    hops.push({
      step: 2,
      component: 'Subnet Route Table',
      action: 'Route Lookup',
      details: 'Subnet has no route table associated',
      status: 'failed'
    });
    outputLines.push(`connect: Network is unreachable`);
    return {
      command,
      timestamp,
      success: false,
      sourceHost,
      destinationIp,
      destinationHost,
      packetLossPercent: 100,
      rttAvgMs: 0,
      hops,
      outputLines,
      failureReason: 'Source subnet is not associated with any route table.',
      troubleshootingTip: 'Associate a route table with subnet ' + (sourceSubnet?.name || 'source subnet')
    };
  }

  const matchedRoute = findMatchingRoute(sourceRt.routes, destinationIp);

  if (!matchedRoute) {
    hops.push({
      step: 2,
      component: sourceRt.name,
      action: 'Route Lookup',
      details: `No route matching ${destinationIp} in ${sourceRt.name}`,
      status: 'failed'
    });
    outputLines.push(`From ${sourceHost.privateIp} icmp_seq=1 Destination Net Unreachable`);
    outputLines.push(`--- ${destinationIp} ping statistics ---`);
    outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
    return {
      command,
      timestamp,
      success: false,
      sourceHost,
      destinationIp,
      destinationHost,
      packetLossPercent: 100,
      rttAvgMs: 0,
      hops,
      outputLines,
      failureReason: `No route exists in route table '${sourceRt.name}' matching destination IP ${destinationIp}.`,
      troubleshootingTip: `Add a route in '${sourceRt.name}' with destination '${destVpc?.cidrBlock || '10.20.0.0/16'}' targeting the VPC Peering connection '${state.peering.name}'.`
    };
  }

  hops.push({
    step: 2,
    component: sourceRt.name,
    action: 'Route Match',
    details: `Matched prefix ${matchedRoute.destinationCidr} -> Target: ${matchedRoute.targetName || matchedRoute.targetId}`,
    status: 'success'
  });

  // Check 2: Target Type & Peering Connection Status
  if (matchedRoute.targetType === 'peering-connection') {
    const isMatchingPeer = matchedRoute.targetId === state.peering.id || matchedRoute.targetName === state.peering.name;

    if (!isMatchingPeer || state.peering.status === 'deleted') {
      hops.push({
        step: 3,
        component: 'VPC Peering',
        action: 'Gateway Forward',
        details: 'Peering connection does not exist or has been deleted (Blackhole)',
        status: 'failed'
      });
      outputLines.push(`From ${sourceHost.privateIp} icmp_seq=1 Destination Host Unreachable`);
      outputLines.push(`--- ${destinationIp} ping statistics ---`);
      outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
      return {
        command,
        timestamp,
        success: false,
        sourceHost,
        destinationIp,
        destinationHost,
        packetLossPercent: 100,
        rttAvgMs: 0,
        hops,
        outputLines,
        failureReason: `Target VPC Peering Connection '${matchedRoute.targetName}' is deleted or invalid. Route is in 'blackhole' state.`,
        troubleshootingTip: 'Re-create the peering connection or update route target in the route table.'
      };
    }

    if (state.peering.status === 'pending-acceptance') {
      hops.push({
        step: 3,
        component: state.peering.name,
        action: 'Peering Bridge',
        details: 'Peering connection is in PENDING-ACCEPTANCE state. Traffic dropped.',
        status: 'failed'
      });
      outputLines.push(`Request timeout for icmp_seq 1`);
      outputLines.push(`Request timeout for icmp_seq 2`);
      outputLines.push(`Request timeout for icmp_seq 3`);
      outputLines.push(`Request timeout for icmp_seq 4`);
      outputLines.push(`--- ${destinationIp} ping statistics ---`);
      outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
      return {
        command,
        timestamp,
        success: false,
        sourceHost,
        destinationIp,
        destinationHost,
        packetLossPercent: 100,
        rttAvgMs: 0,
        hops,
        outputLines,
        failureReason: `VPC Peering Connection '${state.peering.name}' is in 'pending-acceptance' status. Accepter VPC has not accepted the connection request.`,
        troubleshootingTip: "Go to 'Peering Connections' tab and click 'Accept Request' to activate the peering link."
      };
    }

    if (state.peering.status === 'rejected') {
      hops.push({
        step: 3,
        component: state.peering.name,
        action: 'Peering Bridge',
        details: 'Peering connection was REJECTED by accepter VPC.',
        status: 'failed'
      });
      outputLines.push(`Request timeout for icmp_seq 1`);
      outputLines.push(`--- ${destinationIp} ping statistics ---`);
      outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
      return {
        command,
        timestamp,
        success: false,
        sourceHost,
        destinationIp,
        destinationHost,
        packetLossPercent: 100,
        rttAvgMs: 0,
        hops,
        outputLines,
        failureReason: `VPC Peering Connection '${state.peering.name}' was rejected.`,
        troubleshootingTip: 'Delete the rejected peering connection and create a new request.'
      };
    }

    hops.push({
      step: 3,
      component: state.peering.name,
      action: 'Peering Transit',
      details: `Traversed AWS private fiber backbone between ${sourceVpc?.name} and ${destVpc?.name || 'peer VPC'}`,
      status: 'success'
    });
  }

  // Check 3: Destination Host Existence
  if (!destinationHost) {
    hops.push({
      step: 4,
      component: 'Destination Subnet',
      action: 'ARP Resolution',
      details: `No active EC2 host found with IP ${destinationIp}`,
      status: 'failed'
    });
    outputLines.push(`From ${sourceHost.privateIp} icmp_seq=1 Destination Host Unreachable`);
    outputLines.push(`--- ${destinationIp} ping statistics ---`);
    outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
    return {
      command,
      timestamp,
      success: false,
      sourceHost,
      destinationIp,
      packetLossPercent: 100,
      rttAvgMs: 0,
      hops,
      outputLines,
      failureReason: `Destination IP ${destinationIp} does not correspond to any active simulated host.`,
      troubleshootingTip: 'Verify target IP address. Available private hosts are: 10.10.1.10 (Bastion), 10.10.2.10 (App A), 10.20.1.10 (App B).'
    };
  }

  // Check 4: Return Route Table Lookup (Asymmetric Routing Detection!)
  if (sourceVpc?.id !== destVpc?.id) {
    if (!destRt) {
      hops.push({
        step: 4,
        component: 'Destination Route Table',
        action: 'Return Route Lookup',
        details: 'Destination subnet has no route table associated',
        status: 'failed'
      });
      outputLines.push(`Request timeout for icmp_seq 1 (No return route)`);
      return {
        command,
        timestamp,
        success: false,
        sourceHost,
        destinationIp,
        destinationHost,
        packetLossPercent: 100,
        rttAvgMs: 0,
        hops,
        outputLines,
        failureReason: 'Destination subnet lacks a route table for return packets.',
        troubleshootingTip: 'Associate a route table with destination subnet.'
      };
    }

    const returnRoute = findMatchingRoute(destRt.routes, sourceHost.privateIp);
    if (!returnRoute || returnRoute.targetType !== 'peering-connection' || returnRoute.status === 'blackhole') {
      hops.push({
        step: 4,
        component: destRt.name,
        action: 'Return Route Lookup',
        details: `Missing return route back to ${sourceHost.privateIp} (${sourceVpc?.cidrBlock}) in ${destRt.name}`,
        status: 'failed'
      });
      outputLines.push(`Request timeout for icmp_seq 1`);
      outputLines.push(`Request timeout for icmp_seq 2`);
      outputLines.push(`Request timeout for icmp_seq 3`);
      outputLines.push(`Request timeout for icmp_seq 4`);
      outputLines.push(`--- ${destinationIp} ping statistics ---`);
      outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
      return {
        command,
        timestamp,
        success: false,
        sourceHost,
        destinationIp,
        destinationHost,
        packetLossPercent: 100,
        rttAvgMs: 0,
        hops,
        outputLines,
        failureReason: `Asymmetric routing failure: Route table '${destRt.name}' in destination VPC lacks a return route for '${sourceVpc?.cidrBlock}' pointing to '${state.peering.name}'.`,
        troubleshootingTip: `VPC Peering requires bidirectional routes! Add route '${sourceVpc?.cidrBlock}' -> '${state.peering.name}' in route table '${destRt.name}'.`
      };
    }

    hops.push({
      step: 4,
      component: destRt.name,
      action: 'Return Route Verified',
      details: `Return path verified: ${returnRoute.destinationCidr} -> ${returnRoute.targetName || returnRoute.targetId}`,
      status: 'success'
    });
  }

  // Check 5: Destination Security Group Inbound ICMP Rules
  if (destSg) {
    const allowsIcmp = destSg.inboundRules.some(rule => {
      if (rule.protocol !== 'icmp' && rule.protocol !== 'all') return false;
      return isIpInCidr(sourceHost.privateIp, rule.sourceCidr);
    });

    if (!allowsIcmp) {
      hops.push({
        step: 5,
        component: destSg.name,
        action: 'Security Group Inbound Evaluation',
        details: `BLOCKED by ${destSg.name}: No inbound rule permits ICMP from ${sourceHost.privateIp}`,
        status: 'failed'
      });
      outputLines.push(`Request timeout for icmp_seq 1`);
      outputLines.push(`Request timeout for icmp_seq 2`);
      outputLines.push(`Request timeout for icmp_seq 3`);
      outputLines.push(`Request timeout for icmp_seq 4`);
      outputLines.push(`--- ${destinationIp} ping statistics ---`);
      outputLines.push(`4 packets transmitted, 0 received, 100% packet loss`);
      return {
        command,
        timestamp,
        success: false,
        sourceHost,
        destinationIp,
        destinationHost,
        packetLossPercent: 100,
        rttAvgMs: 0,
        hops,
        outputLines,
        failureReason: `Destination Security Group '${destSg.name}' dropped traffic: No inbound rule allows ICMP protocol from source IP ${sourceHost.privateIp}.`,
        troubleshootingTip: `Add an inbound rule to Security Group '${destSg.name}' allowing ICMP Echo Request from '${sourceHost.privateIp}/32' or '${sourceVpc?.cidrBlock}'.`
      };
    }

    hops.push({
      step: 5,
      component: destSg.name,
      action: 'Security Group Permit',
      details: `Permitted: Inbound ICMP Echo Request matched allowed rule from ${sourceHost.privateIp}`,
      status: 'success'
    });
  }

  // Hop 6: Destination Host Echo Reply
  hops.push({
    step: 6,
    component: destinationHost.name,
    action: 'ICMP Echo Reply',
    details: `${destinationHost.name} processed echo and sent reply across peering link back to ${sourceHost.name}`,
    status: 'success'
  });

  // Successful ping output
  const rtt1 = (1.9 + Math.random() * 0.4).toFixed(2);
  const rtt2 = (1.7 + Math.random() * 0.3).toFixed(2);
  const rtt3 = (2.0 + Math.random() * 0.2).toFixed(2);
  const rtt4 = (1.8 + Math.random() * 0.3).toFixed(2);
  const avg = ((parseFloat(rtt1) + parseFloat(rtt2) + parseFloat(rtt3) + parseFloat(rtt4)) / 4).toFixed(3);

  outputLines.push(`64 bytes from ${destinationIp}: icmp_seq=1 ttl=64 time=${rtt1} ms`);
  outputLines.push(`64 bytes from ${destinationIp}: icmp_seq=2 ttl=64 time=${rtt2} ms`);
  outputLines.push(`64 bytes from ${destinationIp}: icmp_seq=3 ttl=64 time=${rtt3} ms`);
  outputLines.push(`64 bytes from ${destinationIp}: icmp_seq=4 ttl=64 time=${rtt4} ms`);
  outputLines.push(`--- ${destinationIp} ping statistics ---`);
  outputLines.push(`4 packets transmitted, 4 received, 0% packet loss, time 3003ms`);
  outputLines.push(`rtt min/avg/max/mdev = ${Math.min(+rtt1, +rtt2, +rtt3, +rtt4).toFixed(3)}/${avg}/${Math.max(+rtt1, +rtt2, +rtt3, +rtt4).toFixed(3)}/0.092 ms`);

  return {
    command,
    timestamp,
    success: true,
    sourceHost,
    destinationIp,
    destinationHost,
    packetLossPercent: 0,
    rttAvgMs: parseFloat(avg),
    hops,
    outputLines
  };
}

function handleIpRoute(
  sourceHost: SimulatedHost,
  sourceSubnet: Subnet | undefined,
  sourceRt: RouteTable | undefined,
  state: LabContextState,
  timestamp: string
): SimulationResult {
  const outputLines: string[] = [];
  outputLines.push(`[${sourceHost.name}@ip-${sourceHost.privateIp.replace(/\./g, '-')} ~]$ ip route show`);
  
  if (sourceRt) {
    for (const route of sourceRt.routes) {
      if (route.targetType === 'local') {
        outputLines.push(`${route.destinationCidr} dev eth0 proto kernel scope link src ${sourceHost.privateIp}`);
      } else if (route.targetType === 'peering-connection') {
        outputLines.push(`${route.destinationCidr} via 10.10.2.1 dev eth0 (aws-vpc-peer: ${route.targetName || route.targetId})`);
      } else if (route.targetType === 'internet-gateway') {
        outputLines.push(`default via 10.10.1.1 dev eth0 (aws-igw: ${route.targetName || route.targetId})`);
      }
    }
  } else {
    outputLines.push('default dev eth0 scope link');
  }

  return {
    command: 'ip route',
    timestamp,
    success: true,
    sourceHost,
    destinationIp: 'local-kernel',
    packetLossPercent: 0,
    rttAvgMs: 0.1,
    hops: [
      {
        step: 1,
        component: sourceHost.name,
        action: 'Query Kernel Routing Table',
        details: 'Displayed local network interfaces and AWS route table derivations',
        status: 'success'
      }
    ],
    outputLines
  };
}

function handleTraceroute(
  tool: string,
  targetArg: string,
  sourceHost: SimulatedHost,
  sourceSubnet: Subnet | undefined,
  sourceRt: RouteTable | undefined,
  sourceSg: SecurityGroup | undefined,
  state: LabContextState,
  timestamp: string
): SimulationResult {
  const destinationIp = targetArg;
  const pingResult = runConnectivityTest(`ping ${destinationIp}`, sourceHost.id, state);
  const outputLines: string[] = [];
  outputLines.push(`traceroute to ${destinationIp} (${destinationIp}), 30 hops max, 60 byte packets`);

  if (pingResult.success) {
    outputLines.push(` 1  10.10.2.1 (AWS Subnet Gateway)  0.421 ms  0.312 ms  0.289 ms`);
    outputLines.push(` 2  peering.vpc.internal (${state.peering.name})  1.145 ms  1.082 ms  1.012 ms`);
    outputLines.push(` 3  ${destinationIp} (${pingResult.destinationHost?.name || 'peer-host'})  1.842 ms  1.791 ms  1.810 ms`);
  } else {
    outputLines.push(` 1  10.10.2.1 (AWS Subnet Gateway)  0.421 ms  0.312 ms  0.289 ms`);
    outputLines.push(` 2  * * *`);
    outputLines.push(` 3  * * *`);
  }

  return {
    ...pingResult,
    command: `${tool} ${destinationIp}`,
    outputLines
  };
}

function handleCurl(
  targetArg: string,
  sourceHost: SimulatedHost,
  sourceSubnet: Subnet | undefined,
  sourceRt: RouteTable | undefined,
  sourceSg: SecurityGroup | undefined,
  state: LabContextState,
  timestamp: string
): SimulationResult {
  const cleanedTarget = targetArg.replace(/^https?:\/\//, '').split(':')[0];
  const pingResult = runConnectivityTest(`ping ${cleanedTarget}`, sourceHost.id, state);
  const outputLines: string[] = [];

  if (pingResult.success) {
    outputLines.push(`HTTP/1.1 200 OK`);
    outputLines.push(`Server: nginx/1.24.0 (Amazon Linux)`);
    outputLines.push(`Content-Type: text/html; charset=UTF-8`);
    outputLines.push(`Date: ${new Date().toUTCString()}`);
    outputLines.push(``);
    outputLines.push(`<!DOCTYPE html>`);
    outputLines.push(`<html>`);
    outputLines.push(`<head><title>Hello from ${pingResult.destinationHost?.name || cleanedTarget}</title></head>`);
    outputLines.push(`<body><h1>Success! Connected via AWS VPC Peering</h1>`);
    outputLines.push(`<p>Client IP: ${sourceHost.privateIp} | Server IP: ${cleanedTarget}</p>`);
    outputLines.push(`</body></html>`);
  } else {
    outputLines.push(`curl: (7) Failed to connect to ${targetArg} port 80: Connection timed out`);
  }

  return {
    ...pingResult,
    command: `curl ${targetArg}`,
    outputLines
  };
}

function handleSsh(
  parts: string[],
  sourceHost: SimulatedHost,
  state: LabContextState,
  timestamp: string
): SimulationResult {
  const destIp = parts.find(p => /^\d+\.\d+\.\d+\.\d+$/.test(p.split('@')[1] || p))?.split('@')[1] || parts[parts.length - 1];
  const pingResult = runConnectivityTest(`ping ${destIp}`, sourceHost.id, state);
  const outputLines: string[] = [];

  if (pingResult.success) {
    // Check if destination host's SG permits port 22 from sourceHost.privateIp
    const destHost = pingResult.destinationHost;
    const destSg = state.securityGroups.find(sg => sg.id === destHost?.securityGroupId);
    const allowsSsh = destSg?.inboundRules.some(
      r => (r.protocol === 'tcp' || r.protocol === 'all') && (r.portRange === '22' || r.portRange === 'ALL') && isIpInCidr(sourceHost.privateIp, r.sourceCidr)
    );

    if (allowsSsh) {
      outputLines.push(`Authenticated to ${destHost?.name} (${destIp}) using "ewb-keypair.pem".`);
      outputLines.push(`Last login: ${new Date().toUTCString()} from ${sourceHost.privateIp}`);
      outputLines.push(`   __|  __|_  )   Amazon Linux 2023`);
      outputLines.push(`   _|  (     /    https://aws.amazon.com/linux/amazon-linux-2023/`);
      outputLines.push(`  ___|\\___|___|`);
      outputLines.push(`[ec2-user@${destHost?.name} ~]$ `);
      return {
        ...pingResult,
        command: parts.join(' '),
        outputLines
      };
    } else {
      outputLines.push(`ssh: connect to host ${destIp} port 22: Connection refused / security group blocked`);
      return {
        ...pingResult,
        success: false,
        command: parts.join(' '),
        outputLines,
        failureReason: `Port 22 SSH traffic blocked by destination Security Group '${destSg?.name}'.`,
        troubleshootingTip: `Ensure inbound rule allows TCP 22 from ${sourceHost.privateIp}/32.`
      };
    }
  } else {
    outputLines.push(`ssh: connect to host ${destIp} port 22: Connection timed out`);
    return {
      ...pingResult,
      command: parts.join(' '),
      outputLines
    };
  }
}
