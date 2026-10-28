export default function PrivacyPage() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 p-8 md:p-16 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-6">Privacy Policy</h1>
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
  
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">1. Data We Collect</h2>
          <p><strong>Location Data:</strong> When you use the "Locate Me" feature, we access your device GPS coordinates strictly to run our auditing and routing engines. We cache recent coordinate searches to improve performance, but do not continuously track your location in the background.</p>
          <p><strong>Account Information:</strong> We store your authentication details securely via our infrastructure provider.</p>
  
          <h2 className="text-xl font-semibold text-slate-200">2. Payment Processing</h2>
          <p>All financial transactions are processed securely through Razorpay. LocaleProof does not view, collect, or store your credit card numbers or banking credentials on our servers.</p>
  
          <h2 className="text-xl font-semibold text-slate-200">3. Third-Party Sharing</h2>
          <p>We send anonymized coordinate data to mapping providers (OpenStreetMap) and AI engines to generate your reports. We do not sell your personal identity or search history to real estate brokers or advertisers.</p>
        </section>
      </div>
    );
  }