'use client';

import React, { useState } from 'react';
import { CDT_DATASET, InsurancePolicy } from '../../lib/cdt-data/codes';

export default function DocumentUploader() {
  const [clinicName, setClinicName] = useState('BrightSmile Dental Studio');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  const [selectedCodes, setSelectedCodes] = useState<string[]>(['D0120', 'D2391']);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedSuccess, setParsedSuccess] = useState<string | null>(null);
  const [estimateResult, setEstimateResult] = useState<any>(null);

  const [policy, setPolicy] = useState<InsurancePolicy>({
    annualDeductible: 50.0,
    deductibleMet: 0.0,
    annualMaximum: 1500.0,
    maxBenefitsUsed: 200.0,
  });

  const handlePolicyChange = (field: keyof InsurancePolicy, value: string) => {
    const numValue = parseFloat(value);
    setPolicy((prev) => ({
      ...prev,
      [field]: isNaN(numValue) ? 0 : numValue,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setParsedSuccess(null);
    setEstimateResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-eob', {
        method: 'POST',
        body: formData,
      });

      const rawText = await res.text();
      if (!rawText) {
        throw new Error(`Server returned an empty response (HTTP ${res.status})`);
      }

      const data = JSON.parse(rawText);
      if (data.policy) {
        setPolicy(data.policy);
        setParsedSuccess(`Policy extracted from "${file.name}"`);
      } else if (data.error) {
        setEstimateResult({ error: `Document Parsing Error: ${data.error}` });
      }
    } catch (err: any) {
      setEstimateResult({ error: err.message || 'Failed to upload document' });
    } finally {
      setParsing(false);
    }
  };

  const toggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleCalculate = async () => {
    setLoading(true);
    setEstimateResult(null);
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName,
          patientName,
          patientEmail,
          patientPhone,
          selectedCodes,
          policy,
        }),
      });
      const data = await res.json();
      setEstimateResult(data);
    } catch (err: any) {
      setEstimateResult({ error: err.message || 'Failed to calculate estimate' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const remainingAnnualMax = Math.max(0, policy.annualMaximum - policy.maxBenefitsUsed);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top SaaS Navigation Header (Hidden on Print) */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            ClearCost Dental SaaS
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">
            AI Pre-Treatment & Insurance Estimator
          </h1>
        </div>
        <div className="mt-2 sm:mt-0 text-right">
          <label className="text-xs text-slate-500 block">Practice / Clinic Name</label>
          <input
            type="text"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="text-sm font-semibold text-slate-800 border-b border-slate-300 focus:border-blue-600 focus:outline-none text-left sm:text-right bg-transparent"
          />
        </div>
      </header>

      {/* Main Interactive Workspace (Hidden on Print) */}
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-slate-200 space-y-8 print:hidden">
        {/* Step 1: Upload EOB */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              1. Upload Insurance Benefits / EOB
            </h2>
            {parsedSuccess && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                ✓ {parsedSuccess}
              </span>
            )}
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 relative hover:border-blue-500 hover:bg-blue-50/30 transition">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="text-slate-700 font-medium">
              {parsing
                ? 'Analyzing document with Gemini Vision AI...'
                : 'Click or drop EOB / Summary of Benefits (PDF, PNG, JPG)'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Automatically extracts deductibles, annual maximums, and remaining benefits
            </p>
          </div>
        </section>

        {/* Step 2: Verify or Override Policy Rules */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              2. Verify Policy Limits (Editable Override)
            </h2>
            <span className="text-xs text-slate-500">
              Remaining Annual Max:{' '}
              <strong className="text-slate-800">${remainingAnnualMax.toFixed(2)}</strong>
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Annual Deductible ($)
              </label>
              <input
                type="number"
                value={policy.annualDeductible}
                onChange={(e) => handlePolicyChange('annualDeductible', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Deductible Met ($)
              </label>
              <input
                type="number"
                value={policy.deductibleMet}
                onChange={(e) => handlePolicyChange('deductibleMet', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Annual Maximum ($)
              </label>
              <input
                type="number"
                value={policy.annualMaximum}
                onChange={(e) => handlePolicyChange('annualMaximum', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">
                Benefits Used ($)
              </label>
              <input
                type="number"
                value={policy.maxBenefitsUsed}
                onChange={(e) => handlePolicyChange('maxBenefitsUsed', e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* Step 3: Select Proposed CDT Procedures */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            3. Select Proposed ADA CDT Procedures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(CDT_DATASET).map((item) => (
              <label
                key={item.code}
                className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition ${
                  selectedCodes.includes(item.code)
                    ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedCodes.includes(item.code)}
                    onChange={() => toggleCode(item.code)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      {item.code} - {item.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.category} ({item.coveragePercent * 100}% Covered)
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-slate-800">${item.fee.toFixed(2)}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Step 4: Patient Details & Generate Action */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            4. Patient Information & Estimate Dispatch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Patient Full Name (e.g., John Doe)"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="email"
              placeholder="Patient Email (for PDF dispatch)"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Patient Phone (optional SMS)"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCalculate}
              disabled={loading || selectedCodes.length === 0}
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
            >
              {loading ? 'Calculating Estimate...' : 'Generate Patient Estimate'}
            </button>
          </div>
        </section>

        {/* Error Alert */}
        {estimateResult?.error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            <strong>Error:</strong> {estimateResult.error}
          </div>
        )}
      </div>

      {/* Printable / Client-Facing Treatment Plan Sheet */}
      {estimateResult?.summary && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Estimate Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{clinicName}</h2>
              <p className="text-xs text-slate-500">
                Pre-Treatment Insurance & Out-of-Pocket Cost Estimate
              </p>
            </div>
            <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
              <p>
                <strong>Patient:</strong> {patientName || 'Valued Patient'}
              </p>
              {patientEmail && (
                <p>
                  <strong>Email:</strong> {patientEmail}
                </p>
              )}
              <p>
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-xs text-slate-500 block">Total Procedure Fees</span>
              <span className="text-lg font-bold text-slate-900">
                ${(
                  estimateResult.summary.totalFees ??
                  estimateResult.lineItems.reduce((acc: number, i: any) => acc + i.fee, 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-xs text-emerald-700 block">Estimated Insurance Pays</span>
              <span className="text-lg font-bold text-emerald-700">
                ${(
                  estimateResult.summary.totalInsurancePays ??
                  estimateResult.lineItems.reduce(
                    (acc: number, i: any) => acc + (i.fee - i.patientPays),
                    0
                  )
                ).toFixed(2)}
              </span>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-xs text-blue-700 block">Estimated Patient Out-of-Pocket</span>
              <span className="text-xl font-extrabold text-blue-700">
                ${estimateResult.summary.totalPatientResponsibility.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Itemized Procedure Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2.5 pr-4">CDT Code</th>
                  <th className="py-2.5 pr-4">Procedure Description</th>
                  <th className="py-2.5 pr-4 text-right">Standard Fee</th>
                  <th className="py-2.5 pr-4 text-right">Est. Insurance</th>
                  <th className="py-2.5 text-right">Patient Pays</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {estimateResult.lineItems.map((line: any) => {
                  const insPays = line.insurancePays ?? line.fee - line.patientPays;
                  return (
                    <tr key={line.code}>
                      <td className="py-3 pr-4 font-bold text-slate-900">{line.code}</td>
                      <td className="py-3 pr-4 text-slate-700">{line.description}</td>
                      <td className="py-3 pr-4 text-right text-slate-600">
                        ${line.fee.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-right text-emerald-600 font-medium">
                        ${insPays.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        ${line.patientPays.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Disclaimer & Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-xs text-slate-400 max-w-xl">
              *This pre-treatment estimate is based on current policy benefits provided and is not
              a guarantee of payment by your insurance carrier.
            </p>
            <div className="flex items-center gap-3 print:hidden">
              {estimateResult.webhookDispatched && (
                <span className="text-xs text-emerald-600 font-medium">
                  ✓ Sent to n8n Automation
                </span>
              )}
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                Print / Save PDF Estimate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}