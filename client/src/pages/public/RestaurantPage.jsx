export default function RestaurantPage() {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 bg-navy-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto animate-fade-in-up">
          <p className="text-gold-400 font-semibold tracking-widest uppercase text-sm mb-4">Culinary Excellence</p>
          <h1 className="font-serif text-5xl md:text-6xl text-white font-bold mb-6">Fine Dining Experience</h1>
          <p className="text-gray-300 text-lg">Savor the authentic flavors of Ethiopia alongside international cuisine, prepared by our master chefs.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h2 className="font-serif text-3xl font-bold text-navy-900 mb-4">Coming Soon</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our online restaurant reservation and menu system is currently under development. 
          For immediate dining inquiries or table reservations, please contact our front desk.
        </p>
      </section>
    </div>
  );
}
