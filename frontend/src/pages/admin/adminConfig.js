import {
  Users,
  BarChart3,
  Clock,
  List,
  Megaphone,
  CreditCard,
  Settings,
  Image,
  Newspaper,
  Mail,
  Bell,
  Star,
} from 'lucide-react';

export const ADMIN_SECTIONS = [
  { id: 'users', label: 'Users', icon: Users, testId: 'admin-nav-users' },
  { id: 'listings', label: 'Listings', icon: List, testId: 'admin-nav-listings' },
  { id: 'news', label: 'News', icon: Newspaper, testId: 'admin-nav-news' },
  { id: 'support', label: 'Support', icon: Mail, testId: 'admin-nav-support' },
  { id: 'marketings', label: 'Marketings', icon: Megaphone, testId: 'admin-nav-marketings' },
  { id: 'memberships', label: 'Memberships', icon: CreditCard, testId: 'admin-nav-memberships' },
  { id: 'statistics', label: 'Statistics', icon: BarChart3, testId: 'admin-nav-statistics' },
  { id: 'city-images', label: 'Images', icon: Image, testId: 'admin-nav-city-images' },
  { id: 'reviews', label: 'Reviews', icon: Star, testId: 'admin-nav-reviews' },
  { id: 'general', label: 'System', icon: Settings, testId: 'admin-nav-general' },
  { id: 'notifications', label: 'Notifications', icon: Bell, testId: 'admin-nav-notifications' },
];

export const STAT_CARDS = [
  { label: 'Users', key: 'totalUsers', altKey: 'total_users', icon: Users, iconBg: 'bg-admin-500' },
  { label: 'Seller accounts', key: 'totalVendors', altKey: 'total_vendors', icon: List, iconBg: 'bg-admin-600' },
  { label: 'Pending moderation', key: 'pendingVendors', altKey: 'pending_vendors', icon: Clock, iconBg: 'bg-amber-500' },
  { label: 'Approved listings', key: 'approvedVendors', altKey: 'approved_vendors', icon: List, iconBg: 'bg-emerald-500' },
  { label: 'Reviews', key: 'totalReviews', altKey: 'total_reviews', icon: BarChart3, iconBg: 'bg-admin-400' },
  { label: 'News items', key: 'totalResources', altKey: 'total_resources', icon: Newspaper, iconBg: 'bg-fuchsia-500' },
];

