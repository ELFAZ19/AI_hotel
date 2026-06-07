import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
          <h1 className="font-serif text-4xl font-bold text-navy-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 text-lg">
            We're here to help make your stay perfect. Reach out to us with any questions or special requests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in-up">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900 mb-1">Our Location</h3>
                <p className="text-gray-600">Kebele 02, Dire Dawa<br />Ethiopia</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Phone className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900 mb-1">Phone Numbers</h3>
                <p className="text-gray-600">+251 25 111 2233<br />+251 91 123 4567</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
              <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-gold-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900 mb-1">Email</h3>
                <p className="text-gray-600">info@adanehotel.com<br />reservations@adanehotel.com</p>
              </div>
            </div>
          </div>

          {/* Contact Form Placeholder */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="font-serif text-2xl font-bold text-navy-900 mb-6">Send us a message</h3>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Form submitted!'); }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea rows="4" className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-all resize-none" required></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl transition-colors shadow-lg shadow-navy-900/20">
                Send Message
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
