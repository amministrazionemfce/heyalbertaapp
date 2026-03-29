import {
  Users,
  Store,
  BarChart3,
  Clock,
  List,
  Megaphone,
  CreditCard,
  Settings,
  Image,
  Newspaper,
  Mail,
} from 'lucide-react';

export const ADMIN_SECTIONS = [
  { id: 'users', label: 'Users', icon: Users, testId: 'admin-nav-users' },
  { id: 'vendors', label: 'Vendors', icon: Store, testId: 'admin-nav-vendors' },
  { id: 'listings', label: 'Listings', icon: List, testId: 'admin-nav-listings' },
  { id: 'news', label: 'News', icon: Newspaper, testId: 'admin-nav-news' },
  { id: 'support', label: 'Support', icon: Mail, testId: 'admin-nav-support' },
  { id: 'marketings', label: 'Marketings', icon: Megaphone, testId: 'admin-nav-marketings' },
  { id: 'memberships', label: 'Memberships', icon: CreditCard, testId: 'admin-nav-memberships' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, testId: 'admin-nav-statistics' },
  { id: 'city-images', label: 'Images', icon: Image, testId: 'admin-nav-city-images' },
  { id: 'general', label: 'General', icon: Settings, testId: 'admin-nav-general' },
];

export const STAT_CARDS = [
  { label: 'Users', key: 'totalUsers', altKey: 'total_users', icon: Users, iconBg: 'bg-admin-500' },
  { label: 'Total Vendors', key: 'totalVendors', altKey: 'total_vendors', icon: Store, iconBg: 'bg-admin-600' },
  { label: 'Pending', key: 'pendingVendors', altKey: 'pending_vendors', icon: Clock, iconBg: 'bg-amber-500' },
  { label: 'Approved', key: 'approvedVendors', altKey: 'approved_vendors', icon: Store, iconBg: 'bg-emerald-500' },
  { label: 'Reviews', key: 'totalReviews', altKey: 'total_reviews', icon: BarChart3, iconBg: 'bg-admin-400' },
  { label: 'News items', key: 'totalResources', altKey: 'total_resources', icon: Newspaper, iconBg: 'bg-fuchsia-500' },
];

