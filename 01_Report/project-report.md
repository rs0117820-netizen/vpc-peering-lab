# Technical Project Report: AWS VPC Peering Lab Simulation

**Author:** Rohan  
**Project:** AWS VPC Peering Lab Simulation  
**Category:** Cloud Networking & Distributed Systems  
**Reference Inspiration:** [jayendras-code/AWS-VPC-Peering-Project](https://github.com/jayendras-code/AWS-VPC-Peering-Project)  
**Execution Environment:** Client-Side Browser Simulation (Zero Cloud Cost)

---

## 1. Abstract

Virtual Private Cloud (VPC) Peering is a foundational networking mechanism in Amazon Web Services (AWS) that facilitates direct network routing between isolated VPCs using private IPv4 addresses. However, hands-on learning of VPC peering often introduces friction for students and early-career cloud engineers due to credit card requirements, active billing risks, and accidental charges incurred from running NAT Gateways or orphaned compute instances.

This project delivers **AWS VPC Peering Lab Simulation**, an interactive, zero-cost, browser-based simulation engine built with React, TypeScript, and Tailwind CSS. The application simulates dual-VPC architecture (`ewb-vpc-a` at `10.10.0.0/16` and `ewb-vpc-b` at `10.20.0.0/16`), subnet segmentation, route table entries, peering connection state transitions, and stateful security group firewalls. The project includes an interactive network visualizer, an EC2 terminal simulation executing realistic `ping`, `traceroute`, and `ip route` commands with hop-by-hop evaluation, and a guided fault injection and recovery walkthrough.

---

## 2. Problem Statement

In enterprise cloud architectures, multi-VPC designs are standard for isolating production, staging, and shared service tiers. Understanding inter-VPC communication is critical, yet engineers face key learning hurdles:
1. **Financial Risk & Account Barriers**: Deploying multiple VPCs with EC2 instances or NAT Gateways incurs ongoing cloud spend and requires credit card verification.
2. **Hidden Networking Failures**: Beginners often struggle with:
   - Attempting to peer VPCs with overlapping CIDRs (e.g., two `10.0.0.0/16` networks).
   - Asymmetric routing bugs where route entries are configured in the requester route table but neglected in the accepter route table.
   - Stateful firewall drops where security groups block ICMP echo requests despite healthy routing.
3. **Lack of Immediate Observability**: In the AWS Console, visualizing packet hops between instances across peering boundaries requires enabling VPC Flow Logs and querying CloudWatch Insights, which adds architectural complexity and cost.

---

## 3. Objectives

The primary objectives of this project are:
- **Educational Simulation**: Provide a completely client-side interactive simulation of AWS VPC peering that requires no AWS credentials, account creation, or paid cloud resources.
- **CIDR Overlap Protection**: Implement real-time RFC1918 IPv4 validation that rejects overlapping VPC CIDRs and validates subnet containment.
- **Bidirectional Routing Demonstration**: Demonstrate the non-transitive nature of AWS VPC peering by modeling explicit route tables (`ewb-rt-a-public`, `ewb-rt-a-private`, `ewb-rt-b-private`) and highlighting packet drops when return routes are absent.
- **Stateful Security Enforcement**: Simulate ENI-level security groups, enforcing the least-privilege principle (strictly disallowing `0.0.0.0/0` SSH access).
- **Interactive Terminal & Diagnostics**: Build a browser-based Linux CLI terminal supporting `ping`, `traceroute`, and `ip route` with realistic latency calculations and hop-by-hop packet inspection.
- **Controlled Failure & Recovery Lab**: Provide a guided 5-step tutorial where users inject an operational fault (removing an ICMP ingress rule), diagnose the resulting timeout, remediate the configuration, and verify restored connectivity.

---

## 4. Scope and Limitations

### In Scope (Implemented)
- Local browser simulation of VPC A (`10.10.0.0/16`) and VPC B (`10.20.0.0/16`).
- Public subnet with simulated Internet Gateway (`ewb-igw-a`) and Bastion host (`10.10.1.10`).
- Private subnets hosting Workload A (`10.10.2.10`) and Workload B (`10.20.1.10`).
- Peering connection lifecycle (*Pending Acceptance* $\rightarrow$ *Active* $\rightarrow$ *Rejected / Deleted*).
- Route table management with route addition, deletion, and blackhole detection.
- Security group inbound rule management with protocol and CIDR evaluation.
- LocalStorage state persistence between browser sessions.
- Interactive SVG network topology with animated packet flows and zoom/pan controls.
- Technical project report export to Markdown and printable PDF format.

### Limitations
- **Simulation Boundary**: No real AWS APIs are invoked; no real EC2 hypervisor or physical AWS hardware is provisioned.
- **Protocol Depth**: Simulates layer-3 (IP) and layer-4 (TCP/ICMP) reachability checks; deep packet payload inspection or full TCP three-way handshake emulation is out of scope.
- **Single-Region Scope**: Models intra-region peering in `ap-south-1` (Mumbai); cross-region latency differentials and inter-region encryption overheads are conceptual.

---

## 5. Tools and Technologies

- **Frontend Core**: React 18 with TypeScript 5.
- **Build Tool & Bundler**: Vite 5 (configured with relative `base: './'` for universal hosting).
- **Styling**: Tailwind CSS 3 with custom AWS Console color tokens (`#0b1120`, `#0f172a`, `#ff9900`).
- **Icons**: Lucide React.
- **State & Storage**: React Context API with HTML5 LocalStorage persistence.
- **Architecture & Diagrams**: Mermaid.js and interactive vector SVG.

---

## 6. System Requirements

### For Running Locally
- **Operating System**: Windows 10/11, macOS, or Linux.
- **Node.js**: v18.0.0 or higher (validated on Node.js v24.22.1 LTS).
- **Package Manager**: npm v9.0.0 or higher.
- **Web Browser**: Any modern evergreen browser (Chrome, Firefox, Safari, Edge) supporting ES2020 and SVG rendering.

---

## 7. Functional Requirements

| Requirement ID | Module | Description | Status |
|:---|:---|:---|:---|
| **FR-01** | Dashboard | Display counts for VPCs, subnets, hosts, peering state, and network health score. | Implemented |
| **FR-02** | Topology Map | Render VPC A and VPC B with distinct subnets, gateways, route tables, and hosts. | Implemented |
| **FR-03** | Packet Animation | Animate traffic flow across route tables, peering bridge, and security groups. | Implemented |
| **FR-04** | Resource Inspector | Side drawer detailing resource IDs, ARNs, CIDRs, and tags on click. | Implemented |
| **FR-05** | CIDR Validation | Check IPv4 syntax, prefix limits (/16–/28), and reject overlapping VPC ranges. | Implemented |
| **FR-06** | Subnet Containment | Verify subnet CIDRs reside within parent VPC and calculate available IPs. | Implemented |
| **FR-07** | Route Tables | Model simulated routes, support add/delete, and protect immutable `local` route. | Implemented |
| **FR-08** | Peering Workflow | Support create, accept, reject, and delete transitions for `pcx` links. | Implemented |
| **FR-09** | Security Enforcement | Reject `0.0.0.0/0` SSH port 22 rules; allow granular `/32` ingress configuration. | Implemented |
| **FR-10** | Terminal CLI | Execute `ping`, `traceroute`, `ip route`, `curl`, and `ssh` commands. | Implemented |
| **FR-11** | Failure Lab | 5-step guided wizard for fault injection, observation, and remediation. | Implemented |
| **FR-12** | Audit Log | Chronological timestamped event logging with category filtering and JSON export. | Implemented |
| **FR-13** | Report Generator | Generate Markdown report and format print layout for PDF saving. | Implemented |

---

## 8. System Architecture & Component Design

The application follows a unidirectional data flow centered on `LabContext`:

```
┌────────────────────────────────────────────────────────┐
│                   React Application                    │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    LabContext                    │  │
│  │  - VPCs State            - Route Tables State    │  │
│  │  - Subnets State         - Security Groups State │  │
│  │  - Peering State         - Activity Logs State   │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             │                          │
│       ┌─────────────────────┼─────────────────────┐    │
│       ▼                     ▼                     ▼    │
│ ┌───────────┐         ┌───────────┐         ┌────────┐ │
│ │  Storage  │         │ Simulator │         │  CIDR  │ │
│ │  Engine   │         │  Engine   │         │ Utils  │ │
│ └───────────┘         └───────────┘         └────────┘ │
│                             │                          │
│       ┌─────────────────────┴─────────────────────┐    │
│       ▼                                           ▼    │
│ ┌───────────────────────┐               ┌────────────┐ │
│ │ Interactive Topology  │               │ Terminal   │ │
│ │ (SVG Animation & Map) │               │ Simulation │ │
│ └───────────────────────┘               └────────────┘ │
└────────────────────────────────────────────────────────┘
```

1. **State Store (`src/context/LabContext.tsx`)**: Holds state for all networking resources and exposes mutating actions with automatic audit logging and LocalStorage sync.
2. **CIDR Utility (`src/utils/cidr.ts`)**: Converts IPv4 addresses to 32-bit unsigned integers to perform exact bitwise subnet mask comparisons, overlap detection, and longest-prefix-match route lookups.
3. **Simulation Engine (`src/utils/simulator.ts`)**: Implements an end-to-end 6-stage packet traversal evaluation:
   - Stage 1: Source host status check.
   - Stage 2: Source subnet route table lookup (longest prefix match).
   - Stage 3: Peering connection status verification (`active` vs `pending` vs `deleted`).
   - Stage 4: Destination subnet route table lookup (return path verification).
   - Stage 5: Destination security group inbound firewall evaluation.
   - Stage 6: Echo response generation with simulated RTT variance.

---

## 9. Implementation Details

### Longest-Prefix-Match Routing Logic
In `src/utils/cidr.ts`, routing lookup implements standard network prefix matching:

```typescript
export function findMatchingRoute(routes: { destinationCidr: string }[], destinationIp: string) {
  let bestMatch: any = null;
  let bestMask = -1;

  for (const route of routes) {
    if (isIpInCidr(destinationIp, route.destinationCidr)) {
      const mask = parseInt(route.destinationCidr.split('/')[1] || '0', 10);
      if (mask > bestMask) {
        bestMask = mask;
        bestMatch = route;
      }
    }
  }
  return bestMatch;
}
```

### Least-Privilege Security Group Guardrail
In `src/context/LabContext.tsx`, security rule addition strictly prevents world-open SSH:

```typescript
if (rule.protocol === 'tcp' && rule.portRange === '22' && 
   (rule.sourceCidr === '0.0.0.0/0' || rule.sourceCidr === '0.0.0.0/1')) {
  return {
    success: false,
    error: "SECURITY VIOLATION: Never create an SSH rule allowing ingress from 0.0.0.0/0. Bastion and workload SSH must be restricted to a trusted /32 IPv4 address."
  };
}
```

---

## 10. Testing and Validation

### Validation Test Scenarios

| Test Case | Inputs / State | Expected Result | Actual Result |
|:---|:---|:---|:---|
| **TC-01: Baseline Ping** | Peering: Active, Routes: Configured, SG: Allowed | 4 packets transmitted, 4 received, 0% loss, ~1.9ms RTT | Passed |
| **TC-02: Pending Peering** | Peering: `pending-acceptance` | Ping times out; hop inspector highlights unaccepted peering link | Passed |
| **TC-03: Missing Return Route** | Peering: Active, VPC B route deleted | Ping times out; asymmetric routing drop flagged | Passed |
| **TC-04: SG ICMP Block** | Peering: Active, ICMP rule removed from `ewb-app-b-sg` | Request timeout; destination firewall drop identified | Passed |
| **TC-05: Overlapping CIDR** | Attempt to set VPC B CIDR to `10.10.0.0/16` | Action rejected with overlap error message | Passed |
| **TC-06: World-Open SSH** | Attempt to add Port 22 rule from `0.0.0.0/0` | Action rejected with security violation alert | Passed |

---

## 11. Results and Key Takeaways

1. **Successful Local Verification**: The application was compiled and validated via `npm run build` with zero TypeScript or bundling errors.
2. **Zero Cloud Expense**: Demonstrated complex enterprise networking patterns without incurring AWS charges or requiring cloud account credentials.
3. **Core Networking Principles Reinforced**:
   - VPC Peering is non-transitive.
   - Non-overlapping CIDR blocks are mandatory.
   - Bidirectional route table entries are required.
   - Security groups are stateful and evaluate incoming traffic at the ENI boundary.

---

## 12. Proposed Future Enhancements

The following features represent conceptual future extensions:
1. **Multi-Region Peering**: Simulate cross-region latency variation (e.g., `ap-south-1` to `us-east-1` with 180ms RTT) and inter-region encryption.
2. **Transit Gateway (TGW) Hub-and-Spoke Simulation**: Expand from point-to-point peering to hub-and-spoke transit networking connecting three or more VPCs.
3. **Network ACL (NACL) Layer**: Introduce stateless subnet-level subnet boundary firewalls with numbered rule evaluation (ALLOW / DENY).
4. **VPC Flow Logs Visualizer**: Simulate CloudWatch VPC Flow Log capture records (`version account-id interface-id srcaddr dstaddr srcport dstport protocol packets bytes start end action log-status`).

---

**Report Prepared By:** Rohan  
**Project:** AWS VPC Peering Lab Simulation  
**Document Version:** 1.0.0
