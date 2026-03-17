import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import UpgradeToVendorModal from '../components/UpgradeToVendorModal';
import { useAddListingClick } from '../hooks/useAddListingClick';
import {
  Users, BadgeCheck, BookOpen, ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function AboutPage() {
  const { handleAddListingClick, upgradeModalProps } = useAddListingClick();

  return (
    <div className="min-h-screen" data-testid="about-page">
      {/* Hero */}
      <section className="bg-spruce-700 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="max-w-3xl">
            <Badge className="bg-secondary-500 text-white mb-6">About Us</Badge>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
              Making Alberta Feel Like Home
            </h1>
            <p className="text-lg text-spruce-100 leading-relaxed">
              Hey Alberta is the go-to platform for individuals and families relocating to Alberta.
              We connect newcomers with verified, trusted local service providers across 16 essential categories,
              making the transition as smooth and stress-free as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Users, title: "For Newcomers", desc: "Access a curated directory of vetted service providers. Search by category, city, or neighborhood to find exactly what you need." },
              { icon: BadgeCheck, title: "Verified Vendors", desc: "Every paid vendor goes through our verification process. Look for the verified badge to know you're working with a trusted business." },
              { icon: BookOpen, title: "Resource Library", desc: "Comprehensive checklists, guides, and FAQs covering everything from healthcare enrollment to setting up utilities." },
            ].map((item, i) => (
              <div key={i} className="text-left" data-testid={`about-feature-${i}`}>
                <div className="w-14 h-14 rounded-2xl bg-spruce-50 flex items-center justify-center mb-5">
                  <item.icon className="w-7 h-7 text-spruce-700" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="py-24 bg-slate-50" data-testid="membership-section">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl">
          <div className="mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-3">Vendor Membership Tiers</h2>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl">
              Choose the plan that fits your business needs. Start free and upgrade anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { tier: "Free", price: "Free", features: ["75-word description", "1 image", "Non-verified label", "Basic listing"] },
              { tier: "Standard", price: "$29/mo", features: ["Unlimited description", "Multiple images", "Video introduction", "Direct contact info", "Reply to reviews", "Verified badge"], popular: true },
              { tier: "Premium", price: "$39/mo", features: ["All Standard features", "Priority placement", "On-site dynamic ads", "Post promotions/coupons", "Email campaign inclusion"] },
            ].map((plan, i) => (
              <div
                key={i}
                className={`bg-white rounded-xl border p-6 ${plan.popular ? 'border-secondary-400 ring-2 ring-secondary-100 relative' : ''}`}
                data-testid={`tier-card-${plan.tier.toLowerCase()}`}
              >
                {plan.popular && <Badge className="absolute -top-3 left-6 bg-secondary-500 text-white">Most Popular</Badge>}
                <h3 className="font-heading text-xl font-bold mb-1">{plan.tier}</h3>
                <p className="text-2xl font-bold text-spruce-700 mb-4">{plan.price}</p>
                <ul className="space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-spruce-700 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button className={`w-full mt-6 ${plan.popular ? 'bg-secondary-500 hover:bg-secondary-600 text-white' : 'bg-spruce-700 hover:bg-spruce-800 text-white'}`}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-spruce-700">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-spruce-100 mb-8 max-w-xl mx-auto">
            Whether you're moving to Alberta or you're a local business, we'd love to have you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/directory">
              <Button className="bg-secondary-500 hover:bg-secondary-600 text-white h-12 px-8" data-testid="about-browse-btn">
                Browse Directory
              </Button>
            </Link>
            <Button
              onClick={handleAddListingClick}
              className="bg-white/10 border-white/30 text-white hover:bg-white/10 h-12 px-8"
              data-testid="about-register-btn">
              List Your Business <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      <UpgradeToVendorModal {...upgradeModalProps} />
    </div>
  );
}