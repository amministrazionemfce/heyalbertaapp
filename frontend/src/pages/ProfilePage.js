import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../lib/auth';
import { uploadAvatar } from '../lib/api';
import { ROUTES } from '../constants';
import { getApiErrorLines } from '../lib/formatApiError';
import AuthFormError from '../components/AuthFormError';
import { resolveMediaUrl } from '../lib/mediaUrl';
import { Loader2, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [apiErrorLines, setApiErrorLines] = useState([]);
  const [validationError, setValidationError] = useState({});
  const previewRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) navigate(ROUTES.LOGIN, { replace: true });
  }, [user, authLoading, navigate]);

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

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4" data-testid="profile-page">
      <div className="max-w-lg mx-auto">
        <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-spruce-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Your profile</h1>
          <p className="text-sm text-slate-600 mb-6">Update your name, email, and profile photo.</p>
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
                  <span className="inline-flex h-9 px-4 rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
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
        </div>
      </div>
    </div>
  );
}
