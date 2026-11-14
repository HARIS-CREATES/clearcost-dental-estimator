import { NextResponse } from 'next/server';
import { calculateEstimate, InsurancePolicy } from '../../../lib/cdt-data/codes';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clinicName, patientName, patientEmail, patientPhone, selectedCodes, policy } = body as {
      clinicName?: string;
      patientName?: string;
      patientEmail: string;
      patientPhone: string;
      selectedCodes: string[];
      policy: InsurancePolicy;
    };

    if (!selectedCodes || selectedCodes.length === 0) {
      return NextResponse.json({ error: 'No CDT codes provided' }, { status: 400 });
    }

    const estimateResult = calculateEstimate(selectedCodes, policy);

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    let webhookDispatched = false;

    if (n8nWebhookUrl) {
      try {
        const webhookRes = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clinicName: clinicName || 'BrightSmile Dental Care',
            patient: {
              name: patientName || 'Valued Patient',
              email: patientEmail,
              phone: patientPhone,
            },
            policy,
            estimate: estimateResult,
            createdAt: new Date().toISOString(),
          }),
        });
        webhookDispatched = webhookRes.ok;
      } catch (webhookErr) {
        console.warn('n8n webhook skipped or unreachable:', webhookErr);
      }
    }

    return NextResponse.json({
      success: true,
      webhookDispatched,
      ...estimateResult,
    });
  } catch (error: any) {
    console.error('Estimate API Error:', error);
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}