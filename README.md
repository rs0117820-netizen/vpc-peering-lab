# AWS VPC Peering Lab Simulation

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

An interactive, educational, browser-based simulation of **Amazon Web Services (AWS) Virtual Private Cloud (VPC) Peering**, route table propagation, and ENI security group firewalls.

**Author:** Rohan  
**Inspiration & Reference Project:** [jayendras-code/AWS-VPC-Peering-Project](https://github.com/jayendras-code/AWS-VPC-Peering-Project)

---

> ### ⚠️ Educational Simulation Notice
> **This project is a localized, client-side educational simulation.**  
> It runs completely in the web browser without calling Amazon Web Services APIs, requiring AWS credentials, or provisioning paid cloud infrastructure. All IP CIDR validations, routing resolutions, packet hops, and security group filtering model AWS RFC1918 specifications in browser memory with zero AWS spend.

---

## 📌 Project Overview & Objectives

In modern enterprise cloud architectures, multi-VPC designs are standard for isolating production, staging, and shared infrastructure. While AWS VPC Peering is a core networking skill, hands-on learning often presents barriers such as accidental cloud billing (from running compute instances, NAT Gateways, or Elastic IPs) and the lack of immediate visual feedback when asymmetric routing errors occur.

This simulation was created to bridge that gap by providing:
1. **Zero-Spend Learning**: A realistic, browser-based AWS console experience that requires no credit card or cloud account.
2. **Network Engineering Sandbox**: A playground to inspect non-overlapping CIDR blocks, configure route table entries, and observe stateful firewall behavior.
3. **Observability & Diagnostics**: Immediate visual feedback showing exactly where packets travel and where they drop when configuration errors are introduced.

---

## 🏛️ Simulated Network Architecture

The lab models a dual-VPC architecture situated in the `ap-south-1` (Mumbai) region:

```
                    ┌────────────────────────────────────────────────────────┐
                    │               AWS Region: ap-south-1 (Mumbai)           │
                    │                                                        │
┌───────────────────┴─────────────────────────┐   ┌──────────────────────────┴────────────────┐
│ VPC A: ewb-vpc-a (10.10.0.0/16)              │   │ VPC B: ewb-vpc-b (10.20.0.0/16)           │
│ [Requester VPC]                             │   │ [Accepter VPC]                            │
│                                             │   │                                           │
│  ┌───────────────────────────────────────┐  │   │                                           │
│  │ Public Subnet: ewb-a-public           │  │   │                                           │
│  │ 10.10.1.0/24                          │  │   │                                           │
│  │ ┌───────────────────┐                 │  │   │                                           │
│  │ │ ewb-bastion       │  ┌────────────┐ │  │   │                                           │
│  │ │ 10.10.1.10        │──│ ewb-igw-a  │ │  │   │  (No Internet Gateway - Isolated VPC)     │
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

### Network Resource Breakdown
- **VPC A (`ewb-vpc-a`)**: `10.10.0.0/16`
  - **Public Subnet (`ewb-a-public`)**: `10.10.1.0/24` with Internet Gateway (`ewb-igw-a`) and Bastion Host (`10.10.1.10`).
  - **Private Subnet (`ewb-a-private`)**: `10.10.2.0/24` hosting Workload A (`10.10.2.10`).
- **VPC B (`ewb-vpc-b`)**: `10.20.0.0/16`
  - **Private Subnet (`ewb-b-private`)**: `10.20.1.0/24` hosting Workload B (`10.20.1.10`).
  - Completely isolated: **No Internet Gateway** attached.
- **Peering Link (`ewb-a-b-peer`)**: ID `pcx-0123456789abcdef0` directly connecting VPC A and VPC B.

---

## ⚡ Key Features & Capabilities

- **Interactive Network Topology**:
  - Live vector SVG diagram with zoom/pan and visual differentiation between public subnets (amber glow) and private subnets (purple/emerald with lock icon).
  - Animated traffic flow showing packets passing through route tables, peering bridge, and security groups.
  - Click-to-inspect drawer revealing AWS metadata, ARNs, and copyable resource IDs.
- **RFC1918 CIDR Validation Engine**:
  - Enforces valid IPv4 block masks (/16 to /28).
  - Automatically rejects overlapping VPC CIDRs with clear routing explanations.
  - Validates subnet containment inside parent VPC CIDR blocks.
- **Route Table Management & Bidirectional Propagation**:
  - Models realistic route entries (`local`, `internet-gateway`, `peering-connection`).
  - Demonstrates asymmetric routing drop detection when the return route is missing.
- **Peering Connection Lifecycle**:
  - Models *Pending Acceptance* $\rightarrow$ *Active* $\rightarrow$ *Rejected / Deleted* state transitions.
  - Marks dependent route table targets as `blackhole` if peering is terminated.
- **Stateful Security Group Enforcement**:
  - Enforces least-privilege cloud security: **strictly blocks `0.0.0.0/0` SSH access**.
  - Restricts Bastion SSH to `/32` admin sources and workload SSH to Bastion only.
- **Interactive EC2 Linux CLI Terminal**:
  - Execute `ping 10.20.1.10`, `traceroute 10.20.1.10`, `ip route`, `curl`, and `ssh`.
  - Realistic latency generation and 6-stage hop evaluation inspector.
- **Controlled Failure & Recovery Guided Lab**:
  - A step-by-step 5-stage walkthrough: Baseline check $\rightarrow$ Fault injection (remove ICMP rule) $\rightarrow$ Observe drop $\rightarrow$ Remediate $\rightarrow$ Confirm recovery.
- **Activity Log & Audit Trail**:
  - Timestamped chronological logging of peering events, route updates, and connectivity tests with search, category filtering, and JSON export.
- **Technical Report Generator**:
  - Built-in report compilation with student metadata input, Markdown (`.md`) download, and print-ready PDF styling.

---

## 🛠️ Technologies Used

- **Framework**: React 18
- **Language**: TypeScript 5 (Strict Mode)
- **Bundler & Dev Server**: Vite 5
- **Styling**: Tailwind CSS 3 (AWS Console-inspired dark theme)
- **Icons**: Lucide React
- **Persistence**: HTML5 LocalStorage API
- **Diagrams**: Mermaid.js and interactive vector SVG

---

## 📂 Repository Folder Structure

```
aws-vpc-peering-lab/
├── 01_Report/
│   └── project-report.md         # Detailed technical academic report
├── 02_Architecture/
│   ├── architecture.md           # Architecture specifications & simulation design
│   └── architecture-diagram.mmd  # Valid Mermaid diagram source code
├── Screenshots/
│   └── README.md                 # UI screenshots checklist and capture guide
├── public/
│   └── favicon.svg               # Web application icon
├── src/
│   ├── types/
│   │   └── network.ts            # Domain types for VPC, Subnet, RouteTable, SG, Host
│   ├── utils/
│   │   ├── cidr.ts               # IPv4 bitwise math, overlap & containment validation
│   │   ├── simulator.ts          # 6-stage packet routing & SG evaluation engine
│   │   ├── storage.ts            # Initial state & LocalStorage persistence handlers
│   │   └── export.ts             # Markdown report generator & PDF print helpers
│   ├── context/
│   │   └── LabContext.tsx        # React global state store & activity logger
│   ├── components/
│   │   ├── layout/               # Sidebar, Header, Resource Inspector drawer
│   │   ├── topology/             # Interactive Network Topology visualizer
│   │   └── views/                # Dashboard, VPCs, Subnets, Routes, Peering, SG, Terminal, Lab, Report
│   ├── App.tsx                   # Main layout and tab routing
│   ├── main.tsx                  # React DOM root entry
│   └── index.css                 # Tailwind CSS & custom scrollbar directives
├── index.html                    # Single Page Application entry HTML
├── vite.config.ts                # Vite build config with relative base path
├── tsconfig.json                 # TypeScript compiler configuration
├── tailwind.config.js            # Tailwind custom theme and AWS colors
├── package.json                  # Dependencies and execution scripts
├── .gitignore                    # Git exclusions
└── README.md                     # Root project documentation
```

---

## 🚀 Installation & Local Execution

### Prerequisites
- Node.js 18+ (tested on Node.js v24.22.1 LTS)
- npm 9+

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd aws-vpc-peering-project
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
Open your browser to [http://localhost:5173/](http://localhost:5173/).

---

## 📦 Production Build & Local Preview

To compile the TypeScript code and generate an optimized production bundle:

```bash
# Type check and build
npm run build

# Preview production build locally
npm run preview
```
The output is bundled into the `dist/` folder.

---

## 🌐 Deployment Guide

### Deploying to Vercel (Recommended)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Vercel automatically detects **Vite** as the framework preset.
5. Click **"Deploy"**. The site will be built and live with SSL in seconds.

### Deploying to GitHub Pages
`vite.config.ts` is configured with `base: './'` to support relative asset paths:
1. Run `npm run build`.
2. Push the contents of the `dist/` folder to the `gh-pages` branch, or configure GitHub Actions:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm install
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

---

## 🔮 Future Improvements

Proposed enhancements for future iterations:
- [ ] **Cross-Region Peering**: Simulate inter-region peering latency (e.g., `ap-south-1` to `us-east-1` with realistic ~180ms delay).
- [ ] **Transit Gateway (TGW) Hub-and-Spoke**: Expand point-to-point peering into central routing hubs connecting 3+ VPCs.
- [ ] **Network ACL (NACL) Layer**: Add stateless subnet-level firewall rules with numbered priority evaluation.
- [ ] **VPC Flow Logs Visualizer**: Interactive log stream viewer modeling CloudWatch VPC Flow Log records.

---

## 🤝 Acknowledgements & Inspiration

- Inspired by the open-source AWS networking project by **Jayendra**: [AWS-VPC-Peering-Project](https://github.com/jayendras-code/AWS-VPC-Peering-Project).
- Built following official [AWS VPC Peering Documentation](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html) and RFC1918 private networking specifications.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
