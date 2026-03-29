import {
  Home, Truck, Wrench, Shield, Landmark, Scale,
  Heart, GraduationCap, Baby, PawPrint, Car, Wifi,
  Briefcase, Globe, TreePine, ShoppingBag
} from 'lucide-react';

const iconMap = { Home, Truck, Wrench, Shield, Landmark, Scale, Heart, GraduationCap, Baby, PawPrint, Car, Wifi, Briefcase, Globe, TreePine, ShoppingBag };

export const CATEGORIES = [
  { id: "real-estate", name: "Real Estate", slug: "real-estate", icon: "Home", description: "Find your perfect home in Alberta" },
  { id: "moving-services", name: "Moving Services", slug: "moving-services", icon: "Truck", description: "Professional movers to help you settle in" },
  { id: "home-services", name: "Home Services", slug: "home-services", icon: "Wrench", description: "Repairs, renovations, and maintenance" },
  { id: "insurance", name: "Insurance", slug: "insurance", icon: "Shield", description: "Protect what matters most" },
  { id: "banking-financial", name: "Banking", slug: "banking-financial", icon: "Landmark", description: "Banking, mortgages, and financial planning" },
  { id: "legal-services", name: "Legal Services", slug: "legal-services", icon: "Scale", description: "Immigration, real estate, and family law" },
  { id: "healthcare", name: "Healthcare", slug: "healthcare", icon: "Heart", description: "Doctors, dentists, and wellness services" },
  { id: "education", name: "Education", slug: "education", icon: "GraduationCap", description: "Schools, tutoring, and training programs" },
  { id: "childcare", name: "Childcare", slug: "childcare", icon: "Baby", description: "Daycare, nannies, and family support" },
  { id: "pet-services", name: "Pet Services", slug: "pet-services", icon: "PawPrint", description: "Vets, grooming, and pet care" },
  { id: "automotive", name: "Automotive", slug: "automotive", icon: "Car", description: "Dealers, mechanics, and auto services" },
  { id: "utilities-telecom", name: "Utilities & Telecom", slug: "utilities-telecom", icon: "Wifi", description: "Internet, phone, and utility setup" },
  { id: "employment", name: "Employment", slug: "employment", icon: "Briefcase", description: "Job search and career services" },
  { id: "immigration", name: "Immigration", slug: "immigration", icon: "Globe", description: "Immigration consultants and settlement" },
  { id: "recreation", name: "Recreation", slug: "recreation", icon: "TreePine", description: "Sports, fitness, and outdoor activities" },
  { id: "shopping", name: "Shopping", slug: "shopping", icon: "ShoppingBag", description: "Local shops and essential stores" },
];

export function getCategoryIcon(iconName) {
  return iconMap[iconName] || Home;
}

// Relevant images for each category (Unsplash)
export const CATEGORY_IMAGES = {
  "real-estate": "services/realestate.jpg",
  "moving-services": "services/moving.jpg",
  "home-services": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
  "insurance": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&q=80",
  "banking-financial": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80",
  "legal-services": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80",
  "healthcare": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80",
  "education": "services/education.jpg",
  "childcare": "services/childcard.jpg",
  "pet-services": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80",
  "automotive": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80",
  "utilities-telecom": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80",
  "employment": "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80",
  "immigration": "https://images.unsplash.com/photo-1529243856184-fd5465488984?w=400&q=80",
  "recreation": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80",
  "shopping": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80",
};

export const CITIES = [
  "Calgary", "Edmonton", "Red Deer", "Lethbridge", "Medicine Hat",
  "Grande Prairie", "Airdrie", "Spruce Grove", "St. Albert", "Okotoks",
  "Leduc", "Cochrane", "Fort McMurray", "Camrose", "Banff"
];

export const TIERS = [
  { id: "free", name: "Free", color: "bg-slate-100 text-slate-700", description: "Basic listing" },
  { id: "standard", name: "Standard", color: "bg-primary-100 text-primary-700", description: "Enhanced listing" },
  { id: "gold", name: "Gold", color: "bg-secondary-100 text-secondary-700", description: "Priority placement" },
  { id: "platinum", name: "Platinum", color: "bg-spruce-100 text-spruce-700", description: "Premium visibility" },
  { id: "enterprise", name: "Enterprise", color: "bg-blue-100 text-blue-700", description: "Full partnership" },
];

/**
 * Stripe / billing store Gold as `premium`; admin UI uses `gold`. Normalize for display.
 */
export function getTierInfo(tierId) {
  const raw = String(tierId || '').trim().toLowerCase();
  const lookupId = raw === 'premium' ? 'gold' : raw;
  return TIERS.find((t) => t.id === lookupId) || TIERS[0];
}
