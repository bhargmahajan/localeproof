export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8 md:p-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-100 mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: October 28, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">1. Data We Collect & Why</h2>
          <p className="mb-2"><strong>Location Data:</strong> When you use the "Locate Me" feature or search for properties, we access your device GPS coordinates strictly to run our auditing and routing engines. We cache recent coordinate searches to improve performance.</p>
          <p className="mb-2"><strong>Account & Contact Information:</strong> We collect your authentication details (such as email) and verified mobile phone numbers to manage your account, prevent free-trial abuse, and distribute welcome credits.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">2. Data Retention (How Long)</h2>
          <p>We retain your account information, mobile number, and search history for as long as your account remains active or as needed to provide you services. You may request account deletion at any time.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">3. Payment Processing</h2>
          <p>All financial transactions are processed securely through Razorpay. LocaleProof does not view, collect, or store your credit card numbers or banking credentials on our servers.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">4. Third-Party Sharing (With Whom Shared)</h2>
          <p className="mb-2">We share data strictly with trusted service providers necessary to operate our platform:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Authentication & Database Providers (e.g., Supabase):</strong> To store account credentials and user history securely.</li>
            <li><strong>Mapping & AI Providers:</strong> We send anonymized coordinate data to mapping services (OpenStreetMap/OpenRouteService) and AI engines to generate your infrastructure reports.</li>
            <li><strong>Payment Gateways:</strong> Razorpay for processing transactions.</li>
          </ul>
          <p className="mt-2">We do not sell your personal identity, phone number, or search history to real estate brokers or advertisers.</p>
        </div>
      </section>
    </div>
  );
}