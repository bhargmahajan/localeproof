export default function TermsPage() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 p-8 md:p-16 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-100 mb-6">Terms of Service</h1>
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
  
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-200">1. Nature of the Service</h2>
          <p>LocaleProof provides AI-generated estimations, routing calculations, and neighborhood data based on open-source geographic information. We do not provide certified financial, legal, or professional real estate advice.</p>
          
          <h2 className="text-xl font-semibold text-slate-200">2. Limitation of Liability</h2>
          <p>Real estate purchasing or renting decisions should never be made solely on LocaleProof's output. The data is provided "as is" without warranties of accuracy. We are not liable for any financial losses, property disputes, or investment outcomes resulting from the use of our service.</p>
  
          <h2 className="text-xl font-semibold text-slate-200">3. Third-Party Data & AI</h2>
          <p>Our maps and routes utilize OpenStreetMap and OpenRouteService. Air quality and neighborhood scoring rely on third-party APIs and generative AI architectures, which may occasionally hallucinate or reflect outdated public records.</p>
  
          <h2 className="text-xl font-semibold text-slate-200">4. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of India, with exclusive jurisdiction in the courts of Jammu.</p>
        </section>
      </div>
    );
  }