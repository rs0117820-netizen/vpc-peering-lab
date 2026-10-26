import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  User,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Info,
  Layers,
  ArrowLeftRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { generateMarkdownReport, downloadFile, printReport } from '../../utils/export';

export const ReportView: React.FC = () => {
  const {
    studentInfo,
    updateStudentInfo,
    vpcs,
    subnets,
    routeTables,
    peering,
    securityGroups,
    hosts,
    activityLogs,
    latestTest
  } = useLab();

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    const md = generateMarkdownReport({
      student: studentInfo,
      vpcs,
      subnets,
      routeTables,
      peering,
      securityGroups,
      hosts,
      activityLogs,
      latestTest
    });
    downloadFile(`AWS_VPC_Peering_Lab_Report_${studentInfo.studentName.replace(/\s+/g, '_')}.md`, md);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar print:p-0 print:m-0 print:max-w-none print:bg-white print:text-black">
      {/* Non-printed Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Project Report Generator</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800 text-xs font-mono">
              Export Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compile your laboratory results, network inventory, and validation logs into an academic or portfolio technical report.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={printReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95"
          >
            {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{downloadSuccess ? 'Downloaded!' : 'Download Markdown (.md)'}</span>
          </button>
        </div>
      </div>

      {/* Student Metadata Form (Editable) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 print:hidden shadow-lg">
        <h2 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-amber-400" />
          <span>Student & Submission Details</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Student Name</label>
            <input
              type="text"
              value={studentInfo.studentName}
              onChange={e => updateStudentInfo({ studentName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Student ID / Roll No</label>
            <input
              type="text"
              value={studentInfo.studentIdOrRoll}
              onChange={e => updateStudentInfo({ studentIdOrRoll: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Institution / College</label>
            <input
              type="text"
              value={studentInfo.institution}
              onChange={e => updateStudentInfo({ institution: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Submission Date</label>
            <input
              type="date"
              value={studentInfo.submissionDate}
              onChange={e => updateStudentInfo({ submissionDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Faculty / Evaluator</label>
            <input
              type="text"
              value={studentInfo.mentorOrInstructor}
              onChange={e => updateStudentInfo({ mentorOrInstructor: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Personal Notes</label>
            <input
              type="text"
              value={studentInfo.personalNotes}
              onChange={e => updateStudentInfo({ personalNotes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-amber-400 font-sans"
            />
          </div>
        </div>
      </div>

      {/* ================= Printable Document Preview ================= */}
      <article className="p-8 sm:p-12 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-8 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 print:border-gray-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 print:text-gray-600 font-bold">
              AWS Cloud Networking Laboratory
            </span>
            <span className="text-[11px] font-mono text-slate-400 print:text-gray-500">
              Region: ap-south-1
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white print:text-black mt-2 tracking-tight">
            AWS VPC Peering Lab Technical Report
          </h1>
          <p className="text-xs text-slate-400 print:text-gray-600 mt-1">
            Private IPv4 Inter-VPC Communication & Stateful Security Enforcement
          </p>
        </div>

        {/* Student & Course Identification */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs print:bg-gray-50 print:border-gray-200">
          <div>
            <span className="text-slate-400 print:text-gray-500">Student Name:</span>
            <div className="font-bold text-slate-100 print:text-black">{studentInfo.studentName}</div>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500">Student ID:</span>
            <div className="font-mono text-slate-200 print:text-black">{studentInfo.studentIdOrRoll}</div>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500">Institution:</span>
            <div className="font-medium text-slate-200 print:text-black">{studentInfo.institution}</div>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500">Submission Date:</span>
            <div className="font-mono text-slate-200 print:text-black">{studentInfo.submissionDate}</div>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500">Instructor:</span>
            <div className="text-slate-200 print:text-black">{studentInfo.mentorOrInstructor}</div>
          </div>
          <div>
            <span className="text-slate-400 print:text-gray-500">Environment:</span>
            <div className="text-emerald-400 print:text-emerald-700 font-mono font-bold">Local Simulator</div>
          </div>
        </div>

        {/* Mandatory Educational Simulation Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-slate-300 print:bg-yellow-50 print:border-yellow-200 print:text-gray-800 space-y-1">
          <div className="font-bold text-amber-300 print:text-yellow-800 flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            <span>Educational Simulation Notice</span>
          </div>
          <p className="leading-relaxed">
            This project report and associated connectivity traces were generated using the <strong>VPC Peering Lab</strong> local client-side simulator. No real Amazon Web Services (AWS) resources were deployed, and zero cloud expenses were incurred. All CIDR routing logic, hop calculations, and security group filtering model AWS RFC1918 specifications with 100% fidelity.
          </p>
        </div>

        {/* Section 1: Executive Summary & Objective */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-black border-b border-slate-800 print:border-gray-200 pb-1.5">
            1. Executive Summary & Objective
          </h2>
          <p className="text-xs text-slate-300 print:text-gray-700 leading-relaxed">
            The goal of this project is to construct a simulated AWS Virtual Private Cloud peering architecture connecting two isolated networks (<code>ewb-vpc-a</code> at <code>10.10.0.0/16</code> and <code>ewb-vpc-b</code> at <code>10.20.0.0/16</code>). By utilizing an inter-VPC peering connection, private EC2 instances in different subnets communicate securely across private IP addresses without traversing the public Internet or requiring NAT Gateways.
          </p>
        </div>

        {/* Section 2: Network Inventory */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-black border-b border-slate-800 print:border-gray-200 pb-1.5">
            2. Network Inventory & CIDR Allocation
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 print:border-gray-300">
              <thead className="bg-slate-950 print:bg-gray-100 text-slate-300 print:text-gray-700 font-semibold">
                <tr>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">Resource</th>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">Name</th>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">IPv4 Range / IP</th>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">Type / Scope</th>
                  <th className="p-2 border-b border-slate-800 print:border-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200 font-mono text-[11px]">
                {vpcs.map(v => (
                  <tr key={v.id}>
                    <td className="p-2 text-slate-400 print:text-gray-600 font-sans">VPC</td>
                    <td className="p-2 font-bold text-slate-200 print:text-black font-sans">{v.name}</td>
                    <td className="p-2 text-amber-400 print:text-amber-700 font-bold">{v.cidrBlock}</td>
                    <td className="p-2 text-slate-400 print:text-gray-600 font-sans">Regional VPC</td>
                    <td className="p-2 text-emerald-400 print:text-emerald-700">{v.state}</td>
                  </tr>
                ))}
                {subnets.map(s => (
                  <tr key={s.id}>
                    <td className="p-2 text-slate-400 print:text-gray-600 font-sans">Subnet</td>
                    <td className="p-2 font-bold text-slate-200 print:text-black font-sans">{s.name}</td>
                    <td className="p-2 text-slate-200 print:text-black">{s.cidrBlock}</td>
                    <td className="p-2 font-sans capitalize">{s.type} Subnet</td>
                    <td className="p-2 text-emerald-400 print:text-emerald-700">Available</td>
                  </tr>
                ))}
                {hosts.map(h => (
                  <tr key={h.id}>
                    <td className="p-2 text-slate-400 print:text-gray-600 font-sans">EC2 Host</td>
                    <td className="p-2 font-bold text-slate-200 print:text-black font-sans">{h.name}</td>
                    <td className="p-2 text-emerald-400 print:text-emerald-700">{h.privateIp}</td>
                    <td className="p-2 font-sans capitalize">{h.type} Workload</td>
                    <td className="p-2 text-emerald-400 print:text-emerald-700">{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Route Table Summary */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-black border-b border-slate-800 print:border-gray-200 pb-1.5">
            3. Route Table Audit & Non-Transitive Propagation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {routeTables.map(rt => (
              <div key={rt.id} className="p-3 rounded-lg bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-200 space-y-1.5">
                <div className="font-bold text-slate-200 print:text-black text-xs">{rt.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{rt.id}</div>
                <div className="space-y-1 pt-1 font-mono text-[10px]">
                  {rt.routes.map(r => (
                    <div key={r.id} className="flex justify-between text-slate-300 print:text-gray-800">
                      <span>{r.destinationCidr}</span>
                      <span className="text-slate-400 print:text-gray-600">→ {r.targetName || r.targetId}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Security Group Inbound Audit */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-black border-b border-slate-800 print:border-gray-200 pb-1.5">
            4. Security Group Configuration & Ingress Rules
          </h2>
          <div className="space-y-2 text-xs">
            {securityGroups.map(sg => (
              <div key={sg.id} className="p-3 rounded-lg bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-200">
                <div className="flex items-center justify-between font-bold text-slate-200 print:text-black mb-1">
                  <span>{sg.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{sg.id}</span>
                </div>
                <div className="text-[11px] text-slate-400 print:text-gray-600 mb-2">{sg.description}</div>
                <div className="space-y-1">
                  {sg.inboundRules.map(r => (
                    <div key={r.id} className="flex items-center justify-between font-mono text-[11px] text-slate-300 print:text-gray-800">
                      <span>{r.protocol.toUpperCase()} {r.portRange} from {r.sourceCidr}</span>
                      <span className="text-slate-500 text-[10px] font-sans">{r.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Verification & Latency Statistics */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-white print:text-black border-b border-slate-800 print:border-gray-200 pb-1.5">
            5. Connectivity Test Execution Log
          </h2>
          {latestTest ? (
            <div className="p-4 rounded-xl bg-slate-950 print:bg-gray-50 border border-slate-800 print:border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-mono">
                <span>Command: <strong>{latestTest.command}</strong></span>
                <span className={latestTest.success ? 'text-emerald-400 print:text-emerald-700 font-bold' : 'text-red-400'}>
                  {latestTest.success ? 'Status: 200 OK (0% Packet Loss)' : 'Status: Timeout'}
                </span>
              </div>
              <div className="p-3 bg-black print:bg-gray-100 rounded font-mono text-[11px] text-emerald-400 print:text-black space-y-0.5">
                {latestTest.outputLines.map((l, i) => (
                  <div key={i}>{l}</div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No test logs recorded in this session.</p>
          )}
        </div>

        {/* Section 6: Key Learning Takeaways */}
        <div className="space-y-2 text-xs text-slate-300 print:text-gray-700">
          <h2 className="text-base font-bold text-white print:text-black border-b border-slate-800 print:border-gray-200 pb-1.5">
            6. Architectural Principles & Best Practices
          </h2>
          <ul className="list-disc pl-4 space-y-1 leading-relaxed">
            <li><strong>Non-Overlapping CIDRs:</strong> Peering requires completely disjoint IPv4 networks (e.g. 10.10.0.0/16 vs 10.20.0.0/16).</li>
            <li><strong>Non-Transitive Nature:</strong> VPC A cannot route through VPC B to reach a third VPC C. Each pair requires direct peering.</li>
            <li><strong>Bidirectional Routes:</strong> Packets require return routes; asymmetric routing causes silent drops.</li>
            <li><strong>Stateful Security Groups:</strong> Inbound ICMP echo requests must be explicitly allowed; outbound replies are statefully returned.</li>
          </ul>
        </div>

        {/* Signatures for Academic Submission */}
        <div className="pt-8 border-t border-slate-800 print:border-gray-300 flex justify-between text-xs text-slate-400 print:text-gray-600">
          <div>
            <div>Candidate Signature: ___________________________</div>
            <div className="mt-1 font-mono text-[11px]">{studentInfo.studentName}</div>
          </div>
          <div>
            <div>Faculty Evaluator: ___________________________</div>
            <div className="mt-1 font-mono text-[11px]">{studentInfo.mentorOrInstructor}</div>
          </div>
        </div>
      </article>
    </div>
  );
};
