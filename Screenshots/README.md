# Screenshots Documentation: AWS VPC Peering Lab Simulation

**Author:** Rohan  
**Application URL (Local):** `http://localhost:5173/`

This guide specifies the recommended screenshots to capture from the running web application for your GitHub repository portfolio, technical presentations, and internship submissions.

> **Note on Authenticity**: In accordance with academic and professional integrity standards, no fabricated or simulated AWS screenshots are included. Capture real screenshots directly from your running local instance (`npm run dev`) or deployed live web link.

---

## 📸 Recommended Screenshots Checklist

| # | Filename | Application View | Key Elements to Showcase |
|:---|:---|:---|:---|
| **01** | `01_dashboard_overview.png` | **Dashboard** | Metric cards (2 VPCs, 3 Subnets, Active Peering, 3 Hosts), Network Health Score (100%), and Quick Ping Test status. |
| **02** | `02_network_topology.png` | **Network Topology** | Side-by-side view of `ewb-vpc-a` and `ewb-vpc-b`, public vs private subnets, Internet Gateway, and peering bridge. |
| **03** | `03_packet_trace_animation.png` | **Network Topology** | Live packet trace particle moving across the peering wire with green active status. |
| **04** | `04_resource_inspector.png` | **Resource Inspector** | Side drawer open inspecting `ewb-app-a` or `ewb-vpc-a` with copyable IDs, CIDR, and tags. |
| **05** | `05_vpc_management.png` | **VPCs** | VPC table displaying `10.10.0.0/16` and `10.20.0.0/16` with the CIDR editor modal. |
| **06** | `06_route_tables.png` | **Route Tables** | Route table entries for `ewb-rt-a-private` and `ewb-rt-b-private` showing destination `10.20.0.0/16` and `10.10.0.0/16` targeting `ewb-a-b-peer`. |
| **07** | `07_peering_workflow.png` | **Peering Connections** | Requester (`ewb-vpc-a`) and Accepter (`ewb-vpc-b`) cards with **Active** status. |
| **08** | `08_security_groups.png` | **Security Groups** | Strict `/32` SSH rule on Bastion, ICMP rules on App A/B, and no `0.0.0.0/0` SSH rules. |
| **09** | `09_connectivity_terminal.png` | **Connectivity Tests** | Successful `ping 10.20.1.10` with 0% loss and 6-step hop evaluation breakdown. |
| **10** | `10_failure_and_recovery.png` | **Failure & Recovery Lab** | Step 3 showing 100% packet loss drop due to missing ICMP rule, and Step 5 showing recovered connectivity. |
| **11** | `11_project_report.png` | **Project Report** | Technical report generator with student details (Rohan) and Markdown download button. |

---

## 🛠️ How to Capture & Save Screenshots

1. **Start the local server**:
   ```bash
   npm run dev
   ```
2. Open your browser to [http://localhost:5173/](http://localhost:5173/).
3. Use a standard screenshot utility:
   - **Windows**: `Windows Key + Shift + S` (Snipping Tool)
   - **macOS**: `Cmd + Shift + 4`
   - **Linux**: `Shift + PrintScreen`
4. Save the image files inside this directory (`Screenshots/`) using the recommended naming convention above.
5. Commit and push the images to GitHub:
   ```bash
   git add Screenshots/
   git commit -m "docs: add real application UI screenshots"
   git push origin main
   ```
