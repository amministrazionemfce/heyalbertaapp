import {
  Users,
  Store,
  BarChart3,
  BookOpen,
  Clock,
  List,
  Megaphone,
  CreditCard,
  Settings,
} from 'lucide-react';

export const ADMIN_SECTIONS = [
  { id: 'users', label: 'Users', icon: Users, testId: 'admin-nav-users' },
  { id: 'vendors', label: 'Vendors', icon: Store, testId: 'admin-nav-vendors' },
  { id: 'listings', label: 'Listings', icon: List, testId: 'admin-nav-listings' },
  { id: 'resources', label: 'Resources', icon: BookOpen, testId: 'admin-nav-resources' },
  { id: 'marketings', label: 'Marketings', icon: Megaphone, testId: 'admin-nav-marketings' },
  { id: 'memberships', label: 'Memberships', icon: CreditCard, testId: 'admin-nav-memberships' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, testId: 'admin-nav-statistics' },
  { id: 'general', label: 'General', icon: Settings, testId: 'admin-nav-general' },
];

export const STAT_CARDS = [
  { label: 'Users', key: 'totalUsers', altKey: 'total_users', icon: Users, iconBg: 'bg-blue-500' },
  { label: 'Total Vendors', key: 'totalVendors', altKey: 'total_vendors', icon: Store, iconBg: 'bg-teal-500' },
  { label: 'Pending', key: 'pendingVendors', altKey: 'pending_vendors', icon: Clock, iconBg: 'bg-amber-500' },
  { label: 'Approved', key: 'approvedVendors', altKey: 'approved_vendors', icon: Store, iconBg: 'bg-emerald-500' },
  { label: 'Reviews', key: 'totalReviews', altKey: 'total_reviews', icon: BarChart3, iconBg: 'bg-violet-500' },
  { label: 'Resources', key: 'totalResources', altKey: 'total_resources', icon: BookOpen, iconBg: 'bg-rose-500' },
];

