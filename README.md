# 🦷 ClearCost Dental — AI Pre-Treatment & Insurance Estimator

An end-to-end full-stack healthcare SaaS application and automated workflow that parses patient Explanation of Benefits (EOB) and insurance documents using Google Gemini Vision AI, cross-references ADA CDT procedure codes to calculate exact out-of-pocket costs, exports printable PDF treatment plans, and triggers an n8n webhook pipeline to dispatch itemized HTML estimates via email.

🌐 **Live Demo:** [clearcost-dental-estimator.vercel.app](https://clearcost-dental-estimator.vercel.app)

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
* **Deployment:** Vercel
* **AI Vision & Extraction:** Google Gemini API (`@google/genai` with structured JSON schema & multi-model fallback)
* **Automation Workflow:** n8n (Webhook → HTML Estimate Formatter → SMTP / Gmail Dispatch)
* **PDF & Print Engine:** Client-side `@media print` treatment plan layout

---

## ✨ Key Features

* **AI Insurance Document Parsing:** Drag-and-drop any EOB or Summary of Benefits (PDF, PNG, JPG) to automatically extract annual deductibles, deductibles met, annual maximums, and remaining benefits.
* **Editable Policy Overrides:** Front-desk staff can manually verify and adjust extracted insurance figures in real time before generating a quote.
* **ADA CDT Fee & Coverage Engine:** Calculates accurate patient responsibility across Preventive (100%), Basic Restorative (80%), and Major Restorative (50%) tiers using remaining deductible and annual maximum rules.
* **One-Click Printable / PDF Treatment Plans:** Generates a clean, clinic-branded patient treatment breakdown ready for front-desk printing or PDF download.
* **Automated n8n Patient Dispatch:** Transmits patient contact details, policy rules, and itemized procedure JSON payloads via webhook to n8n for automated email/SMS delivery.

---

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/HARIS-CREATES/clearcost-dental-estimator.git](https://github.com/HARIS-CREATES/clearcost-dental-estimator.git)
   cd clearcost-dental-estimator