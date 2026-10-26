# AWS VPC Peering Lab Simulation: Architecture Specification

**Author:** Rohan  
**Scope:** Frontend Architecture, Simulation Engine & Network Topology  
**Status:** Implemented & Verified

---

## 1. Overview & Simulation Architecture

The **AWS VPC Peering Lab Simulation** is designed as a modular, client-side single-page application (SPA). It provides an educational, zero-cloud-spend sandbox where users can explore and troubleshoot AWS VPC Peering, route table propagation, and ENI security group firewall rules.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Browser (Client)                           │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Presentation Layer (React 18)                 │  │
│  │  - Interactive Network Topology (SVG Canvas)                     │  │
│  │  - AWS Console Navigation (Sidebar & Header)                     │  │
│  │  - EC2 CLI Terminal Interface                                    │  │
│  │  - Resource Inspector Drawer & Management Tables                 │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                   State & Domain Layer (LabContext)              │  │
│  │  - VPC State: [ewb-vpc-a, ewb-vpc-b]                             │  │
│  │  - Subnets: [ewb-a-public, ewb-a-private, ewb-b-private]         │  │
│  │  - Route Tables: [ewb-rt-a-public, ewb-rt-a-priv, ewb-rt-b-priv] │  │
│  │  - Peering Link: [ewb-a-b-peer (pcx-0123456789abcdef0)]          │  │
│  │  - Security Groups: [ewb-bastion-sg, ewb-app-a-sg, ewb-app-b-sg] │  │
│  │  - Hosts: [ewb-bastion, ewb-app-a, ewb-app-b]                    │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                   Core Simulation Engines                        │  │
│  │  ┌──────────────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │ CIDR Engine (cidr.ts)│  │ Routing Simulator (simulator.ts) │  │  │
│  │  │ - Bitwise IP math    │  │ - Longest prefix match routing   │  │  │
│  │  │ - Overlap validation │  │ - Asymmetric drop detection      │  │  │
│  │  │ - Subnet containment │  │ - Stateful SG rule evaluation    │  │  │
│  │  └──────────────────────┘  └──────────────────────────────────┘  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                  Persistence Layer (LocalStorage)                │  │
│  │  - State serialization, recovery & pristine lab reset            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Simulated AWS Network Architecture

The simulated environment models two Virtual Private Clouds in the `ap-south-1` (Mumbai) region:

### VPC A (`ewb-vpc-a`)
- **Primary IPv4 CIDR**: `10.10.0.0/16`
- **DNS Attributes**: DNS Resolution = Enabled, DNS Hostnames = Enabled
- **Role**: Peering Requester
- **Subnets**:
  1. `ewb-a-public` (`10.10.1.0/24`, `ap-south-1a`): Public subnet with simulated Internet Gateway (`ewb-igw-a`) attached. Hosts simulated Bastion jump host (`ewb-bastion`, Private IP: `10.10.1.10`, Public IP: `13.234.112.45`).
  2. `ewb-a-private` (`10.10.2.0/24`, `ap-south-1a`): Private workload subnet without direct Internet connectivity. Hosts Workload A (`ewb-app-a`, Private IP: `10.10.2.10`).

### VPC B (`ewb-vpc-b`)
- **Primary IPv4 CIDR**: `10.20.0.0/16`
- **DNS Attributes**: DNS Resolution = Enabled, DNS Hostnames = Enabled
- **Role**: Peering Accepter
- **Subnets**:
  1. `ewb-b-private` (`10.20.1.0/24`, `ap-south-1b`): Private workload subnet with no Internet Gateway attached (strictly isolated). Hosts Workload B (`ewb-app-b`, Private IP: `10.20.1.10`).

### Peering Connection (`ewb-a-b-peer`)
- **ID**: `pcx-0123456789abcdef0`
- **Requester**: `vpc-0a1b2c3d4e5f6001a` (`ewb-vpc-a`)
- **Accepter**: `vpc-0a1b2c3d4e5f6002b` (`ewb-vpc-b`)
- **Transport**: Simulates AWS internal fiber backbone connecting the two VPCs directly across non-overlapping RFC1918 CIDR blocks.

---

## 3. Simulated Route Table Architecture

VPC Peering does not provide transitive routing or automatic route propagation. Both VPCs require explicit routing table entries:

| Route Table Name | ID | VPC | Destination CIDR | Target Type | Target Resource | Purpose |
|:---|:---|:---|:---|:---|:---|:---|
| **ewb-rt-a-public** | `rtb-01public0000000a` | `ewb-vpc-a` | `10.10.0.0/16` | `local` | `local` | Default VPC A local traffic |
| | | | `0.0.0.0/0` | `internet-gateway` | `ewb-igw-a` | Public Internet egress via IGW |
| | | | `10.20.0.0/16` | `peering-connection`| `ewb-a-b-peer` | Bastion routing to VPC B |
| **ewb-rt-a-private**| `rtb-02private000000a` | `ewb-vpc-a` | `10.10.0.0/16` | `local` | `local` | Default VPC A local traffic |
| | | | `10.20.0.0/16` | `peering-connection`| `ewb-a-b-peer` | Private traffic toward VPC B |
| **ewb-rt-b-private**| `rtb-03private000000b` | `ewb-vpc-b` | `10.20.0.0/16` | `local` | `local` | Default VPC B local traffic |
| | | | `10.10.0.0/16` | `peering-connection`| `ewb-a-b-peer` | **Return route** toward VPC A |

> **Asymmetric Routing Guard**: If the return route (`10.10.0.0/16 → ewb-a-b-peer`) is deleted from `ewb-rt-b-private`, outbound requests reach VPC B, but reply packets are dropped by VPC B's router. The simulation engine detects this specific condition and reports: `Asymmetric routing failure: Return route missing in destination route table`.

---

## 4. Stateful Security Group Firewall Architecture

Security groups operate as stateful virtual firewalls attached to EC2 elastic network interfaces (ENIs):

### 1. Bastion Security Group (`ewb-bastion-sg`)
- **Inbound**: SSH (TCP Port 22) restricted to trusted administrative IP (`203.0.113.25/32`).
- **Safety Restriction**: The simulator strictly rejects inbound SSH rules from `0.0.0.0/0` to enforce cloud security compliance.
- **Outbound**: All traffic allowed (`0.0.0.0/0`).

### 2. Workload App A Security Group (`ewb-app-a-sg`)
- **Inbound**:
  - TCP Port 22 from Bastion (`10.10.1.10/32`) only.
  - ICMP Echo Request from App B (`10.20.1.10/32`) for reverse diagnostic testing.
- **Outbound**: All traffic allowed (`0.0.0.0/0`).

### 3. Workload App B Security Group (`ewb-app-b-sg`)
- **Inbound**:
  - TCP Port 22 from Bastion (`10.10.1.10/32`) only.
  - ICMP Echo Request from App A (`10.10.2.10/32`) across the peering connection.
- **Outbound**: All traffic allowed (`0.0.0.0/0`).

---

## 5. Packet Evaluation & Diagnostic Engine

When a network diagnostic command (such as `ping 10.20.1.10`) is triggered, `src/utils/simulator.ts` evaluates the journey through 6 sequential checkpoints:

```
[Source Host: ewb-app-a (10.10.2.10)]
               │
               ▼
   [Checkpoint 1: Source Route Table Match]
   - Evaluates: Does ewb-rt-a-private contain a route for 10.20.1.10?
   - Match: 10.20.0.0/16 -> Target: ewb-a-b-peer
               │ (Pass)
               ▼
   [Checkpoint 2: Peering Link State]
   - Evaluates: Is ewb-a-b-peer in 'active' status?
   - Status: Active (If 'pending-acceptance' -> Request timeout)
               │ (Pass)
               ▼
   [Checkpoint 3: Destination Host Existence]
   - Evaluates: Does an active host exist with IP 10.20.1.10?
   - Match: ewb-app-b
               │ (Pass)
               ▼
   [Checkpoint 4: Return Route Table Match (Asymmetric Check)]
   - Evaluates: Does ewb-rt-b-private have a route for 10.10.2.10?
   - Match: 10.10.0.0/16 -> Target: ewb-a-b-peer
               │ (Pass)
               ▼
   [Checkpoint 5: Destination Security Group Ingress]
   - Evaluates: Does ewb-app-b-sg allow ICMP from 10.10.2.10?
   - Match: ICMP ALL from 10.10.2.10/32 -> ALLOW
               │ (Pass)
               ▼
   [Checkpoint 6: Echo Reply Generation]
   - Success: 0% packet loss, ~1.9ms RTT, 4 packets transmitted & received
```

---

## 6. Fault Injection & Recovery Walkthrough

The **Controlled Failure & Recovery Lab** guides users through a repeatable 5-phase loop:
1. **Baseline Phase**: Verify healthy ping transmission ($0\%$ packet loss).
2. **Fault Injection Phase**: Remove the ICMP echo rule on `ewb-app-b-sg`.
3. **Observation Phase**: Execute ping; observe request timeout ($100\%$ loss) with root-cause identification.
4. **Remediation Phase**: Re-add the ICMP echo permission.
5. **Post-Recovery Verification**: Verify restored latency and packet flow ($0\%$ loss).
