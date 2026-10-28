export default function RefundPage() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 p-8 md:p-16 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-6">Cancellation & Refund Policy</h1>
        <p className="mb-4">Last updated: October 28, 2026</p>
          
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">1. Digital Goods</h2>
          <p>LocaleProof operates on a digital credit system. Because our reports and routing calculations incur immediate API computing costs upon generation, all purchases of credit bundles are final.</p>
          
          <h2 className="text-xl font-semibold text-slate-200">2. No Refunds for Used Credits</h2>
          <p>We do not offer refunds or cancellations for credits that have already been consumed to generate neighborhood audits or commute verifications.</p>
  
          <h2 className="text-xl font-semibold text-slate-200">3. Technical Failures</h2>
          <p>If a technical error on our platform consumes a credit but fails to deliver the report, please contact us at <strong>support@localeproof.com</strong> within 7 days. Upon verification of the system log, we will credit your account balance back. Cash refunds for technical errors are processed strictly at our discretion.</p>
        </section>
      </div>
    );
  }