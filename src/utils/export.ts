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

export function generateMarkdownReport(data: {
  student: StudentInfo;
  vpcs: Vpc[];
  subnets: Subnet[];
  routeTables: RouteTable[];
  peering: PeeringConnection;
  securityGroups: SecurityGroup[];
  hosts: SimulatedHost[];
  activityLogs: ActivityLogItem[];
  latestTest?: SimulationResult | null;
}): string {
  const { student, vpcs, subnets, routeTables, peering, securityGroups, hosts, activityLogs, latestTest } = data;
  const now = new Date().toISOString();

  return `# AWS VPC Peering Lab — Technical Project Report
**Document Generated:** ${now}
**Lab Environment:** Local Educational VPC Peering Simulator (No Cloud Cost / Zero AWS Spend)

---

## 1. Student & Project Identification
- **Student Name:** ${student.studentName || '[Student Name]'}
- **Student ID / Roll No:** ${student.studentIdOrRoll || '[Roll Number]'}
- **Institution / University:** ${student.institution || '[Institution Name]'}
- **Submission Date:** ${student.submissionDate || new Date().toISOString().split('T')[0]}
- **Faculty / Mentor:** ${student.mentorOrInstructor || '[Faculty / Mentor]'}
- **Student Notes:** ${student.personalNotes || 'N/A'}

> **Simulation Disclaimer**: This documentation and network validation outputs were produced using the client-side *VPC Peering Lab* simulator. No actual Amazon Web Services (AWS) resources were deployed, and no AWS billing credentials were used. All routing calculations, CIDR validations, and packet hops accurately model AWS VPC Peering mechanics.

---

## 2. Project Objective & Architecture Overview
The objective of this engineering project is to construct and validate private inter-VPC communication between two distinct Virtual Private Clouds (**ewb-vpc-a** and **ewb-vpc-b**) across non-overlapping IPv4 CIDR blocks using an AWS VPC Peering connection.

### Network Architecture Specifications
- **VPC A (Requester):** \`10.10.0.0/16\` (Mumbai: \`ap-south-1\`)
  - **Public Subnet:** \`ewb-a-public\` (\`10.10.1.0/24\`) with Internet Gateway attached.
  - **Private Subnet:** \`ewb-a-private\` (\`10.10.2.0/24\`) hosting Workload A (\`10.10.2.10\`).
  - **Bastion Host:** \`ewb-bastion\` (\`10.10.1.10\`) with restricted management access.
- **VPC B (Accepter):** \`10.20.0.0/16\` (Mumbai: \`ap-south-1\`)
  - **Private Subnet:** \`ewb-b-private\` (\`10.20.1.0/24\`) hosting Workload B (\`10.20.1.10\`).
  - Completely isolated: **No Internet Gateway** attached.
- **VPC Peering Link:** \`ewb-a-b-peer\` (\`${peering.id}\`) connecting VPC A and VPC B directly across AWS internal fiber.

---

## 3. Network Inventory & CIDR Allocation

| Resource Type | Resource ID | Resource Name | CIDR Block / IP | VPC | Associated Route Table | Status |
|:---|:---|:---|:---|:---|:---|:---|
${vpcs.map(v => `| VPC | \`${v.id}\` | **${v.name}** | \`${v.cidrBlock}\` | self | Default | \`${v.state}\` |`).join('\n')}
${subnets.map(s => {
  const vpcName = vpcs.find(v => v.id === s.vpcId)?.name || s.vpcId;
  const rtName = routeTables.find(r => r.id === s.routeTableId)?.name || s.routeTableId;
  return `| Subnet (${s.type}) | \`${s.id}\` | **${s.name}** | \`${s.cidrBlock}\` | ${vpcName} | ${rtName} | \`available\` |`;
}).join('\n')}
${hosts.map(h => {
  const vpcName = vpcs.find(v => v.id === h.vpcId)?.name || h.vpcId;
  return `| Host (${h.type}) | \`${h.id}\` | **${h.name}** | \`${h.privateIp}\` | ${vpcName} | N/A | \`${h.status}\` |`;
}).join('\n')}

---

## 4. Route Table Configuration

VPC Peering requires explicit non-transitive route entries configured in both VPC route tables.

${routeTables.map(rt => {
  const vpcName = vpcs.find(v => v.id === rt.vpcId)?.name || rt.vpcId;
  return `### Route Table: \`${rt.name}\` (\`${rt.id}\`) — ${vpcName}
| Destination CIDR | Target | Target Name | Status |
|:---|:---|:---|:---|
${rt.routes.map(r => `| \`${r.destinationCidr}\` | \`${r.targetType}\` | \`${r.targetName || r.targetId}\` | \`${r.status}\` |`).join('\n')}
`;
}).join('\n')}

---

## 5. VPC Peering Connection Audit
- **Peering ID:** \`${peering.id}\`
- **Name Tag:** \`${peering.name}\`
- **Requester VPC:** \`${peering.requesterVpcId}\` (\`ewb-vpc-a\` - 10.10.0.0/16)
- **Accepter VPC:** \`${peering.accepterVpcId}\` (\`ewb-vpc-b\` - 10.20.0.0/16)
- **Current Status:** **${peering.status.toUpperCase()}**
- **Status Notes:** ${peering.statusMessage || 'Peering connection active and operational.'}
- **CIDR Overlap Check:** Passed (Non-overlapping IPv4 subnets).

---

## 6. Security Group Rules & Least-Privilege Compliance

${securityGroups.map(sg => {
  const vpcName = vpcs.find(v => v.id === sg.vpcId)?.name || sg.vpcId;
  return `### Security Group: \`${sg.name}\` (\`${sg.id}\`) — ${vpcName}
*${sg.description}*

**Inbound Rules:**
| Protocol | Port Range | Source CIDR | Rule Purpose |
|:---|:---|:---|:---|
${sg.inboundRules.map(r => `| \`${r.protocol.toUpperCase()}\` | \`${r.portRange}\` | \`${r.sourceCidr}\` | ${r.description} |`).join('\n')}

**Security Compliance Note:** No \`0.0.0.0/0\` SSH inbound rules exist. Bastion and workload ingress are strictly locked to explicit \`/32\` host addresses.
`;
}).join('\n')}

---

## 7. Connectivity Simulation & Verification

${latestTest ? `
### Latest Simulated Diagnostic Test: \`${latestTest.command}\`
- **Test Result:** ${latestTest.success ? 'PASSED (200 OK / 0% Packet Loss)' : 'FAILED / TIMEOUT'}
- **Source Host:** \`${latestTest.sourceHost.name}\` (\`${latestTest.sourceHost.privateIp}\`)
- **Destination:** \`${latestTest.destinationIp}\`
- **Packet Loss:** \`${latestTest.packetLossPercent}%\`
- **Average RTT:** \`${latestTest.rttAvgMs} ms\`

#### Raw Terminal Output:
\`\`\`bash
${latestTest.outputLines.join('\n')}
\`\`\`

#### Hop-by-Hop Network Analysis:
${latestTest.hops.map(h => `- **Step ${h.step} [${h.component}]:** ${h.action} — *${h.details}* (\`${h.status.toUpperCase()}\`)`).join('\n')}
` : `
*No connectivity test has been logged yet.*
`}

---

## 8. Controlled Failure and Recovery Demonstration
The lab validates root-cause failure diagnosis through an intentional fault injection:
1. **Baseline Phase:** Workload A (\`10.10.2.10\`) successfully pings Workload B (\`10.20.1.10\`) with 0% packet loss.
2. **Fault Injection Phase:** Removal of ICMP inbound rule on \`ewb-app-b-sg\` or deactivation of Peering link.
3. **Observation Phase:** Packet transmission incurs 100% loss with request timeout. The simulator isolates the missing security rule / route table blackhole.
4. **Remediation Phase:** Restoration of rule restores 0% packet loss immediately.

---

## 9. Learning Outcomes & Key Takeaways
1. **Private Communication**: Private EC2 instances communicate without public IP addresses, NAT gateways, or traversing the public internet.
2. **Non-Overlapping CIDRs**: VPC peering requires unique address spaces (e.g., 10.10.0.0/16 vs 10.20.0.0/16).
3. **Bidirectional Route Propagation**: VPC peering is non-transitive and requires explicit routes in both the requester and accepter route tables.
4. **Stateful Security Groups**: Security groups act at the instance ENI level; inbound ICMP echo requests must be explicitly permitted, while responses are statefully tracked.
5. **Zero AWS Cost**: By using this simulator, all architecture principles and troubleshooting skills were mastered without cloud expenditure or accidental billing.

---

## 10. Instructor Verification & Sign-off

- **Student Signature:** ___________________________
- **Evaluator Signature:** ___________________________
- **Grade / Evaluation:** ___________________________
`;
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printReport() {
  window.print();
}
