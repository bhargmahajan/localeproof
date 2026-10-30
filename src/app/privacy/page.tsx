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

        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">6. Children's Privacy & Age Restrictions</h2>
          <p>
            Our services are strictly intended for users who are 18 years of age or older. We do not knowingly collect personal data, location data, or phone numbers from minors without verifiable parental consent. If we become aware that we have inadvertently collected data from a user under 18, we will immediately delete the associated account and data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">5. Support and Grievance Redressal</h2>
          <p className="mb-2">
            In accordance with the Information Technology Act, 2000, and the Consumer Protection (E-Commerce) Rules, 2020, the name and contact details of the Grievance Officer are provided below:
          </p>
          <div className="bg-slate-900/50 p-5 rounded-lg border border-slate-800 mt-3 space-y-2">
            <p><strong className="text-slate-200">Name:</strong> Bharg Mahajan</p>
            <p><strong className="text-slate-200">Email:</strong> <a href="mailto:grievances@localeproof.com" className="text-blue-400 hover:underline">support@localeproof.com</a></p>
            <p><strong className="text-slate-200">Phone:</strong> 6006960265</p>
            <p><strong className="text-slate-200">Address:</strong> Daily Excelsior Lane, Jammu, India</p>
            <p className="text-sm text-slate-400 mt-2">
              We will acknowledge your grievance within 24-48 hours and resolve it within the legally mandated timelines.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}