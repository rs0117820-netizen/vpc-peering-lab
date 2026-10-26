import React, { useState } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { SimulationResult } from '../../types/network';

export const FailureLabView: React.FC = () => {
  const {
    securityGroups,
    addSecurityGroupRule,
    removeSecurityGroupRule,
    executeTest,
    logActivity,
    setActiveTab
  } = useLab();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [step1Result, setStep1Result] = useState<SimulationResult | null>(null);
  const [step3Result, setStep3Result] = useState<SimulationResult | null>(null);
  const [step5Result, setStep5Result] = useState<SimulationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const appBSg = securityGroups.find(s => s.name === 'ewb-app-b-sg');
  const icmpRule = appBSg?.inboundRules.find(r => r.protocol === 'icmp');

  // Step 1: Run Baseline Ping
  const handleRunBaseline = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = executeTest('ping 10.20.1.10');
      setStep1Result(res);
      setIsProcessing(false);
      logActivity('system', 'Failure Lab: Baseline Verified', `Step 1 Baseline ping executed with result: ${res.success ? 'PASSED' : 'FAILED'}`);
    }, 400);
  };

  // Step 2: Inject Fault
  const handleInjectFault = () => {
    if (appBSg && icmpRule) {
      removeSecurityGroupRule(appBSg.id, icmpRule.id);
      logActivity('security', 'Failure Lab: Fault Injected', 'Removed ICMP ingress rule from ewb-app-b-sg to simulate firewall block.', 'warning');
      setCurrentStep(3);
    }
  };

  // Step 3: Observe Failure
  const handleObserveFailure = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = executeTest('ping 10.20.1.10');
      setStep3Result(res);
      setIsProcessing(false);
      logActivity('connectivity', 'Failure Lab: Packet Drop Confirmed', 'Ping timed out as expected due to missing SG inbound rule.', 'error');
    }, 400);
  };

  // Step 4: Remediate
  const handleRemediate = () => {
    if (appBSg) {
      addSecurityGroupRule(appBSg.id, {
        type: 'inbound',
        protocol: 'icmp',
        portRange: 'ALL',
        sourceCidr: '10.10.2.10/32',
        description: 'Restored ICMP Echo Rule by Failure Lab'
      });
      logActivity('security', 'Failure Lab: Rule Restored', 'Re-added ICMP echo request permission to ewb-app-b-sg.', 'success');
      setCurrentStep(5);
    }
  };

  // Step 5: Post-Recovery Verification
  const handleVerifyRecovery = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = executeTest('ping 10.20.1.10');
      setStep5Result(res);
      setIsProcessing(false);
      logActivity('connectivity', 'Failure Lab: Recovery Confirmed', 'Connectivity fully verified after restoring firewall rule.', 'success');
    }, 400);
  };

  const handleRestartLab = () => {
    setCurrentStep(1);
    setStep1Result(null);
    setStep3Result(null);
    setStep5Result(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto overflow-y-auto h-full text-slate-100 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">Controlled Failure & Recovery Lab</h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
              Guided Lab
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hands-on troubleshooting walkthrough demonstrating fault injection, diagnostic isolation, and recovery.
          </p>
        </div>

        <button
          onClick={handleRestartLab}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Walkthrough</span>
        </button>
      </div>

      {/* Progress Steps Indicator */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between text-xs">
          {[
            { step: 1, label: 'Baseline Check' },
            { step: 2, label: 'Inject Fault' },
            { step: 3, label: 'Observe Drop' },
            { step: 4, label: 'Remediate' },
            { step: 5, label: 'Verify Success' }
          ].map(s => (
            <div
              key={s.step}
              onClick={() => setCurrentStep(s.step as any)}
              className={`flex items-center gap-2 cursor-pointer transition-colors ${
                currentStep === s.step
                  ? 'text-amber-400 font-bold'
                  : currentStep > s.step
                  ? 'text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold border ${
                  currentStep === s.step
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : currentStep > s.step
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                {currentStep > s.step ? '✓' : s.step}
              </div>
              <span className="hidden md:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Step Container */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Step 1: Baseline Check */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h2 className="text-base font-bold text-slate-100">Step 1: Baseline Verification</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Verify that the laboratory is in a healthy initial state. Transmit an ICMP ping from Workload A (<code className="text-purple-400">10.10.2.10</code>) across the active VPC Peering connection to Workload B (<code className="text-emerald-400">10.20.1.10</code>).
            </p>

            <button
              onClick={handleRunBaseline}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Running Ping...' : 'Run Baseline Ping (ping 10.20.1.10)'}</span>
            </button>

            {step1Result && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Test Output:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${step1Result.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400'}`}>
                    {step1Result.success ? '0% PACKET LOSS (BASELINE VERIFIED)' : 'FAILED'}
                  </span>
                </div>
                <div className="p-3 bg-black rounded font-mono text-[11px] text-emerald-400 space-y-0.5">
                  {step1Result.outputLines.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    <span>Proceed to Step 2</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Fault Injection */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h2 className="text-base font-bold text-slate-100">Step 2: Inject Fault — Remove Inbound Firewall Rule</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AWS Security Groups act as stateful firewalls on instance elastic network interfaces. In this step, we will intentionally remove the inbound ICMP echo request permission from <code className="text-amber-400">ewb-app-b-sg</code> to simulate an operational configuration error.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Fault Target:</strong> Security Group <code>ewb-app-b-sg</code> → Inbound rule allowing <code>ICMP ALL from 10.10.2.10/32</code> will be deleted.
              </div>
            </div>

            <button
              onClick={handleInjectFault}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-900/30 active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Inject Fault: Remove ICMP Rule</span>
            </button>
          </div>
        )}

        {/* Step 3: Observe Failure */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h2 className="text-base font-bold text-slate-100">Step 3: Observe Failure & Diagnostic Analysis</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rerun the connectivity test now that the inbound security rule has been removed. Notice how route tables still direct the packet across peering, but the destination firewall drops the packet silently.
            </p>

            <button
              onClick={handleObserveFailure}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Transmitting...' : 'Rerun Ping (ping 10.20.1.10)'}</span>
            </button>

            {step3Result && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Test Output:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-800">
                    100% PACKET LOSS (REQUEST TIMEOUT)
                  </span>
                </div>
                <div className="p-3 bg-black rounded font-mono text-[11px] text-red-400 space-y-0.5">
                  {step3Result.outputLines.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-200">Root Cause Diagnosis:</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    {step3Result.failureReason || 'Packets were dropped by destination security group.'}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    <span>Proceed to Step 4 (Remediation)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Remediation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h2 className="text-base font-bold text-slate-100">Step 4: Remediation — Restore Security Rule</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Restore the ICMP inbound rule on <code className="text-emerald-400">ewb-app-b-sg</code> to permit incoming Echo Requests from Workload A's IP (<code className="text-purple-400">10.10.2.10/32</code>).
            </p>

            <button
              onClick={handleRemediate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30 active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Remediate: Re-add ICMP Rule</span>
            </button>
          </div>
        )}

        {/* Step 5: Post-Recovery Verification */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                5
              </span>
              <h2 className="text-base font-bold text-slate-100">Step 5: Post-Recovery Verification</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Confirm that connectivity has been successfully restored. Both egress from VPC A and ingress into VPC B are once again permitted.
            </p>

            <button
              onClick={handleVerifyRecovery}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Verifying...' : 'Verify Recovery Ping (ping 10.20.1.10)'}</span>
            </button>

            {step5Result && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">Recovery Test Result:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    RECOVERY CONFIRMED (0% PACKET LOSS)
                  </span>
                </div>
                <div className="p-3 bg-black rounded font-mono text-[11px] text-emerald-400 space-y-0.5">
                  {step5Result.outputLines.map((l, i) => (
                    <div key={i}>{l}</div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Controlled failure & recovery lab completed successfully! All steps logged in the audit trail.</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleRestartLab}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Repeat Lab
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View in Project Report</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
