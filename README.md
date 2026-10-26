# VPC Peering Lab — AWS Cloud Networking Simulator

A realistic, zero-cost, educational simulation of **AWS Virtual Private Cloud (VPC) Peering**, route table propagation, and ENI security group firewall rules. Built with **React**, **TypeScript**, **Tailwind CSS**, and **Vite**.

Inspired by [jayendras-code/AWS-VPC-Peering-Project](https://github.com/jayendras-code/AWS-VPC-Peering-Project).

> **EDUCATIONAL SIMULATION NOTICE**: This application runs entirely client-side in the browser. It **does not** require an Amazon Web Services account, AWS credentials, or paid cloud resources. No real AWS APIs are called and zero AWS billing is incurred. All routing, CIDR overlap validation, security group filtering, and packet transit hop calculations are simulated according to official AWS networking specifications.

---

## 🌟 Key Features

1. **AWS Management Console UI/UX**:
   - Dark navy enterprise console styling (`#0b1120` / `#0f172a`), AWS orange (`#ff9900`), purple, and blue networking accents.
   - Resource inspectors, live status badges, breadcrumbs, and real-time metric counters.

2. **Interactive Network Topology Visualizer**:
   - High-fidelity dual-VPC architecture map rendered with security boundaries.
   - Distinct visual cues for public subnets (amber glow + attached Internet Gateway) and private subnets (purple/emerald with lock icon).
   - Animated packet tracing (`ewb-app-a` $\rightarrow$ route table $\rightarrow$ peering link $\rightarrow$ return route table $\rightarrow$ `ewb-app-b`).
   - Click-to-inspect side drawer for all VPCs, subnets, route tables, peering connections, security groups, and EC2 hosts.
   - Pan and zoom controls (70% to 140%).

3. **VPC & Subnet Management**:
   - RFC1918 CIDR validation engine.
   - Overlap detector (automatically rejects conflicting VPC IP ranges).
   - Subnet containment validator (verifies subnets fall within parent VPC).
   - AWS reserved address calculator (5 reserved IPs per subnet).

4. **Route Tables & Bidirectional Propagation**:
   - Simulates real AWS route tables:
     - `ewb-rt-a-public`: `10.10.0.0/16 → local`, `0.0.0.0/0 → ewb-igw-a`, `10.20.0.0/16 → ewb-a-b-peer`
     - `ewb-rt-a-private`: `10.10.0.0/16 → local`, `10.20.0.0/16 → ewb-a-b-peer`
     - `ewb-rt-b-private`: `10.20.0.0/16 → local`, `10.10.0.0/16 → ewb-a-b-peer`
   - Add/delete route entries with live validation.
   - Explains asymmetric routing drops when return routes are omitted.

5. **Peering Connection Lifecycle**:
   - Full lifecycle simulation: *Request Created* $\rightarrow$ *Pending Acceptance* $\rightarrow$ *Active* $\rightarrow$ *Rejected / Deleted*.
   - Dynamic route target status (`active` vs `blackhole` when peering is broken).

6. **Stateful Security Group Enforcement**:
   - Enforces AWS security best practices: **strictly rejects SSH (port 22) from `0.0.0.0/0`**.
   - Bastion host restricted to trusted admin IP `/32`.
   - Private workloads accept SSH and ICMP only from authorized source IPs.

7. **Interactive Terminal Connectivity Simulator**:
   - Realistic Linux CLI terminal with history (Up/Down arrows) and tab completion.
   - Commands supported:
     - `ping 10.20.1.10` / `ping 10.10.2.10` (realistic RTT and 0% loss stats)
     - `traceroute 10.20.1.10` (hop-by-hop latency and router names)
     - `ip route` (displays kernel routing table derived from current AWS route tables)
     - `curl 10.20.1.10:80`
     - `ssh -i key.pem ec2-user@10.20.1.10`
     - `help`, `clear`

8. **Guided Controlled Failure & Recovery Lab**:
   - Step 1: Baseline verification (ping succeeds).
   - Step 2: Fault injection (remove ICMP inbound rule from `ewb-app-b-sg`).
   - Step 3: Observe failure (100% packet loss with root-cause isolation).
   - Step 4: Remediation (restore ICMP rule).
   - Step 5: Post-recovery verification (100% success restored).

9. **Project Report Generator & PDF Export**:
   - Formatted technical report containing student info, architecture diagrams, inventory, route audits, test results, and learning outcomes.
   - Export to Markdown (`.md`) or Print / Save as PDF.

---

## 🏛️ Network Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               AWS Region: ap-south-1 (Mumbai)           │
                    │                                                        │
┌───────────────────┴─────────────────────────┐   ┌──────────────────────────┴────────────────┐
│ VPC A: ewb-vpc-a (10.10.0.0/16)              │   │ VPC B: ewb-vpc-b (10.20.0.0/16)           │
│                                             │   │                                           │
│  ┌───────────────────────────────────────┐  │   │                                           │
│  │ Public Subnet: ewb-a-public           │  │   │                                           │
│  │ 10.10.1.0/24                          │  │   │                                           │
│  │ ┌───────────────────┐                 │  │   │                                           │
│  │ │ ewb-bastion       │  ┌────────────┐ │  │   │                                           │
│  │ │ 10.10.1.10        │──│ ewb-igw-a  │ │  │   │  (No Internet Gateway - Isolated)         │
│  │ │ (Pub: 13.234...)  │  │ (IGW)      │ │  │   │                                           │
│  │ └───────────────────┘  └────────────┘ │  │   │                                           │
│  └───────────────────────────────────────┘  │   │                                           │
│                     │                       │   │                                           │
│  ┌──────────────────┴────────────────────┐  │   │  ┌─────────────────────────────────────┐  │
│  │ Private Subnet: ewb-a-private         │  │   │  │ Private Subnet: ewb-b-private       │  │
│  │ 10.10.2.0/24                          │  │   │  │ 10.20.1.0/24                        │  │
│  │ ┌───────────────────┐                 │  │   │  │ ┌───────────────────┐               │  │
│  │ │ ewb-app-a         │                 │  │   │  │ │ ewb-app-b         │               │  │
│  │ │ 10.10.2.10        │═════════════════╪══╪═══╪══│ 10.20.1.10        │               │  │
│  │ └───────────────────┘                 │  │   │  │ └───────────────────┘               │  │
│  └───────────────────────────────────────┘  │   │  └─────────────────────────────────────┘  │
│                                             │   │                                           │
└─────────────────────────────────────────────┘   └───────────────────────────────────────────┘
                       ▲                                                ▲
                       └══════════════ [ ewb-a-b-peer ] ════════════════┘
                                   VPC Peering Connection
                                  (AWS Internal Fiber Link)
```

---

## 🚀 Quick Start (Local Run)

### Prerequisites
- Node.js 18+ (tested with Node.js v24.22.1 LTS)
- npm 9+

### Installation & Launch

```bash
# 1. Install dependencies
npm install

# 2. Run the Vite development server
npm run dev
```

Open your browser to [http://localhost:5173](http://localhost:5173).

### Production Build & Preview

```bash
# Build production bundle with TypeScript check
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deployment Instructions

### Option 1: Vercel (Recommended — 1-Click)
1. Push this repository to GitHub.
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework Preset will automatically detect **Vite**.
5. Click **"Deploy"**. Your live simulation URL will be ready in seconds!

### Option 2: GitHub Pages
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. The `vite.config.ts` is configured with `base: './'` to support relative GitHub Pages subpaths.
3. Install the GitHub Pages deployment helper (optional):
   ```bash
   npm install -D gh-pages
   ```
4. Add to `package.json` scripts:
   ```json
   "deploy": "gh-pages -d dist"
   ```
5. Run:
   ```bash
   npm run deploy
   ```
6. In your GitHub repository settings under **Pages**, set branch to `gh-pages` / `/ (root)`.

---

## 📸 Student Demo & Screenshots Checklist

When presenting this project for evaluation, coursework, or technical portfolios, capture the following screenshots:

- [ ] **1. Dashboard Overview**: Showing the metric cards (2 VPCs, 3 Subnets, Active Peering, 3 Hosts) and Network Health Score.
- [ ] **2. Interactive Topology**: Showing both VPCs side-by-side with active peering bridge and animated packet traversal.
- [ ] **3. Resource Inspector**: Inspecting `ewb-app-a` or `ewb-vpc-a` with full metadata and copyable resource IDs.
- [ ] **4. Peering Connection Workflow**: Demonstrating *Pending Acceptance* and *Active* states.
- [ ] **5. Route Table Propagation**: Viewing `ewb-rt-a-private` and `ewb-rt-b-private` route entries targeting the peering link.
- [ ] **6. Security Group Compliance**: Demonstrating that SSH is restricted to `/32` and `0.0.0.0/0` is blocked.
- [ ] **7. Terminal Diagnostic Test**: Running `ping 10.20.1.10` with 0% loss, and `traceroute 10.20.1.10` showing hop latencies.
- [ ] **8. Controlled Failure & Recovery Walkthrough**: Showing Step 2 (fault injected) $\rightarrow$ Step 3 (packet timeout) $\rightarrow$ Step 4/5 (recovered).
- [ ] **9. Activity Audit Log**: Showing the chronological log of system events.
- [ ] **10. Downloaded Project Report**: Generating the Markdown or PDF report featuring your name and institution.

---

## 📄 License

MIT License. Designed for academic and cloud engineering portfolio demonstration.
