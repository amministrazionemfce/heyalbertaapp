import { Link } from 'react-router-dom';
import { Mountain, Mail, Phone } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

export default function Footer() {
  const topCategories = CATEGORIES.slice(0, 6);

  return (
    <footer className="bg-spruce-700 text-slate-300 border-t border-slate-100" data-testid="footer">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 justify-center md:justify-start">
              <div className="w-9 h-9 bg-spruce-700 rounded-lg flex items-center justify-center">
                <Mountain className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">
                Hey <span className="text-secondary-500">Alberta</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/90 mb-6">
              Your trusted companion for relocating to Alberta. Find verified local services and everything you need for a smooth transition.
            </p>
            <div className="flex flex-col gap-2 text-sm items-center md:items-start">
              <a href="mailto:hello@heyalberta.ca" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4" /> hello@heyalberta.ca
              </a>
              <a href="tel:+14035550100" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4" /> (403) 555-0100
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              <li><Link to="/directory" className="hover:text-white transition-colors">Vendor Directory</Link></li>
              <li><Link to="/resources" className="hover:text-white transition-colors">Resources & Guides</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">List Your Business</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Categories</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              {topCategories.map(cat => (
                <li key={cat.id}>
                  <Link to={`/directory?category=${cat.id}`} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">For Vendors</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              <li><Link to="/register" className="hover:text-white transition-colors">Create Free Listing</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Membership Tiers</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Vendor Login</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Partner With Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 text-white/90 mt-12 pt-8 flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center">
          <p className="text-sm">
            2026 Hey Alberta. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
