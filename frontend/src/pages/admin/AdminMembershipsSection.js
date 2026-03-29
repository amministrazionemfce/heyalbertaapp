import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '../../lib/api';
import { MEMBERSHIP_PLANS } from '../../data/membershipPlans';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  DEFAULT_MEMBERSHIP_EYEBROW,
  DEFAULT_MEMBERSHIP_SUBTITLE,
  DEFAULT_MEMBERSHIP_TITLE,
  mergeApiMembershipFormWithDefaults,
} from '../../lib/membershipCopy';
import { MembershipTiersPreview } from '../../components/MembershipTiersSection';

function planLabel(id) {
  return MEMBERSHIP_PLANS.find((p) => p.id === id)?.name || id;
}

const DESC_KEYS = {
  free: 'membershipDescFree',
  standard: 'membershipDescStandard',
  premium: 'membershipDescPremium',
};

const FEAT_KEYS = {
  free: 'membershipFeaturesFree',
  standard: 'membershipFeaturesStandard',
  premium: 'membershipFeaturesPremium',
};

export function AdminMembershipsSection({ onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => mergeApiMembershipFormWithDefaults(null));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.siteSettings();
      setForm(mergeApiMembershipFormWithDefaults(res.data));
    } catch {
      toast.error('Could not load membership copy.');
      setForm(mergeApiMembershipFormWithDefaults(null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateSiteSettings(form);
      toast.success('Membership section updated.');
      onUpdate?.();
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" data-testid="admin-memberships-section">
        <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-memberships-section">
      <div className="grid gap-8 xl:grid-cols-[minmax(260px,380px)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-8 min-w-0 max-w-full order-2 xl:order-1">
      <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-slate-900">Public membership block</h2>
        <p className="text-sm text-slate-600 mt-1 mb-6">
          Fields load with the <strong className="font-medium text-slate-800">current public copy</strong> (saved settings
          or built-in defaults). Edit text below — the preview updates as you type. Feature lists are one bullet per line;
          clear a line to remove that bullet after save.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="m-eyebrow">Eyebrow label</Label>
            <Input
              id="m-eyebrow"
              value={form.membershipEyebrow}
              onChange={(e) => setForm({ ...form, membershipEyebrow: e.target.value })}
              placeholder={DEFAULT_MEMBERSHIP_EYEBROW}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="m-title">Headline</Label>
            <Input
              id="m-title"
              value={form.membershipTitle}
              onChange={(e) => setForm({ ...form, membershipTitle: e.target.value })}
              placeholder={DEFAULT_MEMBERSHIP_TITLE}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="m-sub">Subtitle</Label>
            <Textarea
              id="m-sub"
              value={form.membershipSubtitle}
              onChange={(e) => setForm({ ...form, membershipSubtitle: e.target.value })}
              placeholder={DEFAULT_MEMBERSHIP_SUBTITLE}
              rows={3}
              className="mt-1 resize-y min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {(['free', 'standard', 'premium']).map((planId) => (
        <div
          key={planId}
          className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm"
        >
          <h3 className="font-heading font-semibold text-slate-900">{planLabel(planId)}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor={`m-desc-${planId}`}>Description</Label>
              <Textarea
                id={`m-desc-${planId}`}
                value={form[DESC_KEYS[planId]]}
                onChange={(e) => setForm({ ...form, [DESC_KEYS[planId]]: e.target.value })}
                rows={3}
                placeholder="Short paragraph under the plan name (optional)"
                className="mt-1 resize-y"
              />
            </div>
            <div>
              <Label htmlFor={`m-feat-${planId}`}>Features (one per line)</Label>
              <Textarea
                id={`m-feat-${planId}`}
                value={form[FEAT_KEYS[planId]]}
                onChange={(e) => setForm({ ...form, [FEAT_KEYS[planId]]: e.target.value })}
                rows={8}
                placeholder="Leave empty to use default feature list from code."
                className="mt-1 resize-y font-mono text-sm"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        className="bg-spruce-700 hover:bg-spruce-800 text-white gap-2"
        disabled={saving}
        onClick={handleSave}
        data-testid="admin-memberships-save"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save membership copy
      </Button>
        </div>

        <div className="order-1 xl:order-2 min-w-0 w-full xl:sticky xl:top-6 space-y-3">
          <MembershipTiersPreview form={form} />
        </div>
      </div>
    </div>
  );
}
