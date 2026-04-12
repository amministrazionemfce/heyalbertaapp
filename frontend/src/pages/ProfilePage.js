import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../lib/auth';
import { uploadAvatar, listingAPI, authAPI, billingAPI } from '../lib/api';
import { ROUTES } from '../constants';
import { getApiErrorLines } from '../lib/formatApiError';
import AuthFormError from '../components/AuthFormError';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { membershipPlanTierFromUserAndListings } from '../lib/membershipTier';
import { Loader2, ArrowLeft, User, Shield, Store, LayoutDashboard, Sparkles, Lock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const TIER_LABELS = { free: 'Free', standard: 'Standard', premium: 'Gold' };

const TIER_HINTS = {
  free: 'Browse and contact businesses; upgrade anytime to list.',
  standard: 'Expanded listing features and better visibility.',
  premium: 'Full listing tools and priority placement.',
};

function roleLabel(role) {
  if (role === 'admin') return 'Administrator';
  if (role === 'vendor') return 'Business';
  return 'Member';
}

function RoleIcon({ role, className }) {
  if (role === 'admin') return <Shield className={className} aria-hidden />;
  if (role === 'vendor') return <Store className={className} aria-hidden />;
  return <User className={className} aria-hidden />;
}

export default function ProfilePage() {
  const { user, loading: authLoading, updateProfile, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [apiErrorLines, setApiErrorLines] = useState([]);
  const [validationError, setValidationError] = useState({});
  const [myListings, setMyListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState([]);
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [deleteAcctPassword, setDeleteAcctPassword] = useState('');
  const [deleteAcctLoading, setDeleteAcctLoading] = useState(false);
  const [deleteAcctError, setDeleteAcctError] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const previewRef = useRef(null);
  const didSyncBillingRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) navigate(ROUTES.LOGIN, { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user?.id || didSyncBillingRef.current) return;
    didSyncBillingRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const syncRes = await billingAPI.syncSubscription();
        if (!cancelled && syncRes?.data?.ok) {
          try {
            await refreshUser();
          } catch {
            /* ignore */
          }
          if (user?.role === 'vendor') {
            try {
              const res = await listingAPI.myListings();
              if (!cancelled) setMyListings(Array.isArray(res.data) ? res.data : []);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        // Stripe may be unconfigured; Profile should still render.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role, refreshUser]);

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      setMyListings([]);
      setListingsLoading(false);
      return undefined;
    }
    let cancelled = false;
    setListingsLoading(true);
    listingAPI
      .myListings()
      .then((res) => {
        if (!cancelled) setMyListings(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setMyListings([]);
      })
      .finally(() => {
        if (!cancelled) setListingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  const clearLocalPreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
    setPreviewUrl(null);
    setPendingFile(null);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    clearLocalPreview();
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreviewUrl(url);
    setPendingFile(file);
  };

  const handleRemovePhoto = async () => {
    if (pendingFile) {
      clearLocalPreview();
      return;
    }
    if (!avatarUrl) return;
    setSaving(true);
    setApiErrorLines([]);
    try {
      await updateProfile({ avatar_url: '' });
      setAvatarUrl('');
      toast.success('Photo removed');
    } catch (err) {
      setApiErrorLines(getApiErrorLines(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiErrorLines([]);
    setValidationError({});
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email address';
    if (Object.keys(errs).length) {
      setValidationError(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = { name: name.trim(), email: email.trim() };
      if (pendingFile) {
        const res = await uploadAvatar(pendingFile);
        payload.avatar_url = res.data.url;
      }
      await updateProfile(payload);
      clearLocalPreview();
      toast.success('Profile updated');
    } catch (err) {
      setApiErrorLines(getApiErrorLines(err));
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
      </div>
    );
  }

  if (!user) return null;

  const displaySrc = previewUrl || (avatarUrl ? resolveMediaUrl(avatarUrl) || avatarUrl : null);

  const planTier = membershipPlanTierFromUserAndListings(user, myListings);
  const tierLabel = TIER_LABELS[planTier] || 'Free';
  const tierHint = TIER_HINTS[planTier] || TIER_HINTS.free;

  const billingTierRaw = String(user.billingTier || 'free').toLowerCase();
  const billingIsFree = billingTierRaw === 'free';
  const billingIsStandardPaid = billingTierRaw === 'standard';
  const billingIsPremiumPaid = billingTierRaw === 'premium';
  const promoUntil = user.promoStandardExpiresAt ? new Date(user.promoStandardExpiresAt) : null;
  const promoActive =
    promoUntil && Number.isFinite(promoUntil.getTime()) && promoUntil > new Date();
  const canApplyPromoCode = billingIsFree && !promoActive;

  const applyPromotion = async (e) => {
    e.preventDefault();
    const c = String(promoCode || '').trim();
    if (!c) {
      toast.error('Enter a promotion code.');
      return;
    }
    setPromoBusy(true);
    try {
      const { data } = await authAPI.redeemPromotion({ code: c });
      toast.success(data?.message || 'Promotion applied.');
      setPromoCode('');
      await refreshUser();
      if (user?.role === 'vendor') {
        const res = await listingAPI.myListings();
        setMyListings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not apply code.');
    } finally {
      setPromoBusy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangePasswordError([]);
    setChangePasswordSuccess('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      setChangePasswordError(['All fields are required.']);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setChangePasswordError(['New passwords do not match.']);
      return;
    }

    if (newPassword.length < 6) {
      setChangePasswordError(['Password must be at least 6 characters.']);
      return;
    }

    setChangePasswordLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });
      setChangePasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setChangePasswordSuccess(''), 5000);
    } catch (err) {
      setChangePasswordError(getApiErrorLines(err));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteAcctError([]);

    if (!deleteAcctPassword.trim()) {
      setDeleteAcctError(['Password is required to delete your account.']);
      return;
    }

    setDeleteAcctLoading(true);
    try {
      await authAPI.deleteAccount({ password: deleteAcctPassword.trim() });
      toast.success('Account deleted successfully.');
      // Logout and redirect
      logout();
      setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 1500);
    } catch (err) {
      setDeleteAcctError(getApiErrorLines(err));
    } finally {
      setDeleteAcctLoading(false);
    }
  };

  const totalListings = myListings.length;
  const publishedCount = myListings.filter((l) => l.status === 'published').length;
  const draftCount = myListings.filter((l) => l.status === 'draft').length;
  const pendingReviewCount = myListings.filter(
    (l) => l.status === 'published' && String(l.sellerStatus || '').toLowerCase() === 'pending'
  ).length;

  return (
    <div className="min-h-screen py-10 px-4" data-testid="profile-page">
      <div className="mx-auto max-w-6xl">
        <Link
          to={ROUTES.HOME}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-spruce-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-semibold text-slate-900">Account</h2>
              <p className="mt-0.5 text-sm text-slate-500">Role and membership for this account.</p>
            </div>
          </div>

          <dl className="mt-5 space-y-4 border-t border-slate-100 pt-5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
              <dd>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {roleLabel(user.role)}
                </Badge>
              </dd>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-spruce-800" aria-hidden />
                Membership
              </dt>
              <dd className="min-w-0 text-right sm:max-w-[65%]">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge
                    variant={planTier === 'free' ? 'outline' : 'default'}
                    className={planTier === 'free' ? 'border-spruce-200 text-spruce-800' : ''}
                  >
                    {tierLabel}
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-right">{tierHint}</p>
              </dd>
            </div>
          </dl>

          <div className="mt-8 border-t border-slate-100 pt-6" data-testid="profile-promotion-section">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Promotion code</h2>
            <p className="mt-1 text-xs text-slate-500">
              Apply an admin-issued code for temporary Standard access (starts when you redeem).
            </p>
            {billingIsPremiumPaid ? (
              <p className="mt-3 text-sm text-slate-600">
                Promotion codes are not used while you have an active <strong className="font-medium text-slate-800">Gold</strong> subscription.
              </p>
            ) : billingIsStandardPaid ? (
              <p className="mt-3 text-sm text-slate-600">
                You already have <strong className="font-medium text-slate-800">Standard</strong> through your paid
                subscription. Promotion codes only apply when you do not have a paid Standard or Gold plan.
              </p>
            ) : promoActive ? (
              <>
                <p className="mt-3 text-sm text-slate-600">
                  Promotional <strong className="font-medium text-slate-800">Standard</strong> access is active until{' '}
                  <time dateTime={promoUntil.toISOString()}>
                    {promoUntil.toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </time>
                  .
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  You cannot stack another code until this period ends and you are on a free plan.
                </p>
              </>
            ) : canApplyPromoCode ? (
              <>
                <form onSubmit={applyPromotion} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="profile-promo-code">Code</Label>
                    <Input
                      id="profile-promo-code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter code"
                      autoComplete="off"
                      className="mt-1.5 uppercase"
                      data-testid="profile-promo-code"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={promoBusy}
                    variant="outline"
                    className="border-spruce-200 text-spruce-900 shrink-0 sm:mb-0.5"
                    data-testid="profile-promo-apply"
                  >
                    {promoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                </form>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-600">You cannot apply a promotion code on this account right now.</p>
            )}
          </div>

          {user.role === 'vendor' && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">Your listings</h3>
                <Link
                  to={ROUTES.DASHBOARD}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-spruce-800 transition-colors hover:bg-spruce-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Manage
                </Link>
              </div>
              {listingsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-7 w-7 animate-spin text-spruce-700" aria-label="Loading listings" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="rounded-xl border border-slate-100 px-3 py-3 text-center">
                      <p className="text-2xl font-semibold tabular-nums text-slate-900">{totalListings}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">Total</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 px-3 py-3 text-center">
                      <p className="text-2xl font-semibold tabular-nums text-spruce-800">{publishedCount}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">Published</p>
                    </div>
                    <div className="rounded-xl border border-slate-100 px-3 py-3 text-center">
                      <p className="text-2xl font-semibold tabular-nums text-slate-700">{draftCount}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-slate-500">Drafts</p>
                    </div>
                  </div>
                  {pendingReviewCount > 0 && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
                      {pendingReviewCount === 1
                        ? '1 published listing is awaiting moderator approval.'
                        : `${pendingReviewCount} published listings are awaiting moderator approval.`}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="mb-2 font-heading text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="mb-6 text-sm text-slate-600">Update your name, email, and profile photo.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthFormError lines={apiErrorLines} data-testid="profile-api-error" />

            <div className="flex flex-col items-center gap-4 pb-2">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0">
                {displaySrc ? (
                  <img src={displaySrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-14 h-14 text-slate-400" aria-hidden />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleFile} data-testid="profile-avatar-input" />
                  <span className="inline-flex h-9 px-4 rounded-md border border-slate-200 justify-center items-center text-sm font-medium hover:bg-slate-100">
                    Choose photo
                  </span>
                </label>
                {(avatarUrl || pendingFile) && (
                  <Button type="button" variant="outline" size="sm" onClick={handleRemovePhoto} disabled={saving} data-testid="profile-remove-photo">
                    Remove photo
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 text-center">JPEG, PNG, WebP, or GIF. Max 5MB.</p>
            </div>

            <div>
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError((v) => ({ ...v, name: '' }));
                  setApiErrorLines([]);
                }}
                className="mt-1.5"
                autoComplete="name"
                data-testid="profile-name"
              />
              {validationError.name && <p className="text-red-500 text-sm mt-1">{validationError.name}</p>}
            </div>
            <div>
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationError((v) => ({ ...v, email: '' }));
                  setApiErrorLines([]);
                }}
                className="mt-1.5"
                autoComplete="email"
                data-testid="profile-email"
              />
              {validationError.email && <p className="text-red-500 text-sm mt-1">{validationError.email}</p>}
            </div>
            <Button type="submit" disabled={saving} className="w-full bg-spruce-700 hover:bg-spruce-800 text-white" data-testid="profile-save">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save changes
            </Button>
          </form>


          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="h-5 w-5 text-spruce-700" aria-hidden />
              Change Password
            </h2>
            <p className="mt-1 text-xs text-slate-500">Update your password to keep your account secure.</p>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
              {changePasswordError.length > 0 && (
                <AuthFormError lines={changePasswordError} />
              )}
              {changePasswordSuccess && (
                <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-900">
                  {changePasswordSuccess}
                </div>
              )}
              <div>
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setChangePasswordError([]);
                  }}
                  placeholder="Enter current password"
                  className="mt-1.5"
                  data-testid="profile-current-password"
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setChangePasswordError([]);
                  }}
                  placeholder="Enter new password"
                  className="mt-1.5"
                  data-testid="profile-new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => {
                    setConfirmNewPassword(e.target.value);
                    setChangePasswordError([]);
                  }}
                  placeholder="Confirm new password"
                  className="mt-1.5"
                  data-testid="profile-confirm-new-password"
                />
              </div>
              <Button
                type="submit"
                disabled={changePasswordLoading}
                className="w-full bg-spruce-700 hover:bg-spruce-800 text-white"
                data-testid="profile-change-password-btn"
              >
                {changePasswordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Change Password
              </Button>
            </form>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Notification Preferences</h2>
            <p className="mt-1 text-xs text-slate-500">Manage how you receive updates about your account and listings.</p>
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-spruce-700 cursor-pointer"
                  data-testid="profile-email-notifications"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">Email Notifications</p>
                </div>
              </label>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Note: Critical security notifications (password changes, account deletion attempts) are always sent regardless of these settings.
            </p>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden />
              Danger Zone
            </h2>
            <p className="mt-1 text-xs text-slate-500">Permanent actions that cannot be undone.</p>

            {!showDeleteConfirm ? (
              <Button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                className="mt-4 border-red-200 text-red-900 hover:bg-red-50"
                data-testid="profile-delete-account-btn"
              >
                Delete Account
              </Button>
            ) : (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
                <h3 className="font-semibold text-red-900 mb-3">Delete Your Account?</h3>
                <p className="text-sm text-red-800 mb-4">
                  This action is permanent and cannot be undone. Your account and all associated data will be deleted.
                </p>
                <form onSubmit={handleDeleteAccount} className="space-y-4">
                  {deleteAcctError.length > 0 && (
                    <AuthFormError lines={deleteAcctError} />
                  )}
                  <div>
                    <Label htmlFor="delete-password">Confirm Your Password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deleteAcctPassword}
                      onChange={(e) => {
                        setDeleteAcctPassword(e.target.value);
                        setDeleteAcctError([]);
                      }}
                      placeholder="Enter your password"
                      className="mt-1.5"
                      data-testid="profile-delete-password"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={deleteAcctLoading}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      data-testid="profile-delete-confirm-btn"
                    >
                      {deleteAcctLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Yes, Delete My Account
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteAcctPassword('');
                        setDeleteAcctError([]);
                      }}
                      variant="outline"
                      className="flex-1"
                      data-testid="profile-delete-cancel-btn"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
