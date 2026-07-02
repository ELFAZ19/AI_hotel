import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="font-serif text-2xl font-bold text-white">
              Adane<span className="text-gold-500">.</span> Hotel
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Experience luxury and comfort at Dire Dawa's premier destination.
              Where Ethiopian hospitality meets world-class service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Our Rooms', to: '/rooms' },
                { label: 'Restaurant', to: '/restaurant' },
                { label: 'Contact Us', to: '/contact' },
                { label: 'Book Now', to: '/rooms' },
              ].map((link) => (
                <li key={link.to + link.label}>
                  <Link to={link.to} className="text-sm text-gray-400 hover:text-gold-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">Dire Dawa, Ethiopia</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">+251 25 111 2233</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">info@adanehotel.com</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">24/7 Front Desk</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Newsletter</h4>
            <p className="text-sm text-gray-400 mb-4">Stay updated with our latest offers and news.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-navy-900 border border-navy-700 text-sm text-white placeholder-gray-500 rounded-l-lg px-4 py-2.5 focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-gold-500 hover:bg-gold-600 text-navy-900 text-sm font-medium rounded-r-lg transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {currentYear} Adane International Hotel. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="https://yeabsira-dejene19.web.app/" className="text-xs text-gray-500 hover:text-gold-400 transition-colors">developed by YABSIRA DEJENE  </a>
            <a href="#" className="text-xs text-gray-500 hover:text-gold-400 transition-colors">Privacy Policy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-gold-400 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
