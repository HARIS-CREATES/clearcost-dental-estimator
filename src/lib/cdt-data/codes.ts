export interface CDTCode {
  code: string;
  description: string;
  fee: number;
  category: 'Preventive' | 'Basic Restorative' | 'Major Restorative';
  coveragePercent: number;
}

export interface InsurancePolicy {
  annualDeductible: number;
  deductibleMet: number;
  annualMaximum: number;
  maxBenefitsUsed: number;
}

export interface EstimateLineItem {
  code: string;
  description: string;
  fee: number;
  category: string;
  coveragePercent: number;
  appliedDeductible: number;
  insuranceCovers: number;
  patientPays: number;
}

export const CDT_DATASET: Record<string, CDTCode> = {
  D0120: { code: 'D0120', description: 'Periodic Oral Evaluation', fee: 65.0, category: 'Preventive', coveragePercent: 1.0 },
  D1110: { code: 'D1110', description: 'Prophylaxis (Adult Cleaning)', fee: 110.0, category: 'Preventive', coveragePercent: 1.0 },
  D0210: { code: 'D0210', description: 'Intraoral Complete Series X-Rays', fee: 175.0, category: 'Preventive', coveragePercent: 1.0 },
  D2140: { code: 'D2140', description: 'Amalgam Restoration (1 Surface)', fee: 195.0, category: 'Basic Restorative', coveragePercent: 0.8 },
  D2391: { code: 'D2391', description: 'Resin Composite (1 Surface, Posterior)', fee: 240.0, category: 'Basic Restorative', coveragePercent: 0.8 },
  D7140: { code: 'D7140', description: 'Extraction, Erupted Tooth or Exposed Root', fee: 210.0, category: 'Basic Restorative', coveragePercent: 0.8 },
  D3310: { code: 'D3310', description: 'Endodontic Therapy (Anterior Tooth)', fee: 850.0, category: 'Major Restorative', coveragePercent: 0.5 },
  D3330: { code: 'D3330', description: 'Endodontic Therapy (Molar Root Canal)', fee: 1200.0, category: 'Major Restorative', coveragePercent: 0.5 },
  D2750: { code: 'D2750', description: 'Crown (Porcelain Fused to High Noble Metal)', fee: 1350.0, category: 'Major Restorative', coveragePercent: 0.5 },
  D6010: { code: 'D6010', description: 'Surgical Placement of Implant Body', fee: 2400.0, category: 'Major Restorative', coveragePercent: 0.5 },
};

export function calculateEstimate(selectedCodes: string[], policy: InsurancePolicy) {
  let remainingDeductible = Math.max(0, policy.annualDeductible - policy.deductibleMet);
  let remainingMaxBenefit = Math.max(0, policy.annualMaximum - policy.maxBenefitsUsed);

  let totalFees = 0;
  let totalInsuranceCovered = 0;
  let totalPatientResponsibility = 0;

  const lineItems: EstimateLineItem[] = selectedCodes.map((code) => {
    const cdt = CDT_DATASET[code];
    if (!cdt) throw new Error(`Invalid CDT code: ${code}`);

    totalFees += cdt.fee;
    let appliedDeductible = 0;

    if (cdt.category !== 'Preventive' && remainingDeductible > 0) {
      appliedDeductible = Math.min(cdt.fee, remainingDeductible);
      remainingDeductible -= appliedDeductible;
    }

    const amountSubjectToCoverage = cdt.fee - appliedDeductible;
    const calculatedBenefit = amountSubjectToCoverage * cdt.coveragePercent;

    const insuranceCovers = Math.min(calculatedBenefit, remainingMaxBenefit);
    remainingMaxBenefit -= insuranceCovers;

    const patientPays = cdt.fee - insuranceCovers;

    totalInsuranceCovered += insuranceCovers;
    totalPatientResponsibility += patientPays;

    return {
      code: cdt.code,
      description: cdt.description,
      fee: cdt.fee,
      category: cdt.category,
      coveragePercent: cdt.coveragePercent * 100,
      appliedDeductible,
      insuranceCovers,
      patientPays,
    };
  });

  return {
    lineItems,
    summary: {
      totalFees,
      totalInsuranceCovered,
      totalPatientResponsibility,
      remainingDeductible,
      remainingMaxBenefit,
    },
  };
}