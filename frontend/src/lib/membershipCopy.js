import { MEMBERSHIP_PLANS } from '../data/membershipPlans';

export const DEFAULT_MEMBERSHIP_EYEBROW = 'Membership';
export const DEFAULT_MEMBERSHIP_TITLE = 'Plans built for Alberta vendors';
export const DEFAULT_MEMBERSHIP_SUBTITLE =
  'Start free, upgrade when you want more visibility and tools. Prices shown in CAD and USD.';

function splitLines(text) {
  if (!text || !String(text).trim()) return null;
  const lines = String(text)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length ? lines : null;
}

function descKeyForPlanId(planId) {
  if (planId === 'free') return 'membershipDescFree';
  if (planId === 'standard') return 'membershipDescStandard';
  return 'membershipDescPremium';
}

function featuresKeyForPlanId(planId) {
  if (planId === 'free') return 'membershipFeaturesFree';
  if (planId === 'standard') return 'membershipFeaturesStandard';
  return 'membershipFeaturesPremium';
}

/**
 * Merge static MEMBERSHIP_PLANS with optional SiteSettings copy (admin-editable).
 * @param {Record<string, unknown> | null | undefined} settings
 */
export function mergeMembershipPlansFromSettings(settings) {
  return MEMBERSHIP_PLANS.map((plan) => {
    const descKey = descKeyForPlanId(plan.id);
    const featKey = featuresKeyForPlanId(plan.id);
    const desc = settings?.[descKey] != null ? String(settings[descKey]).trim() : '';
    const featText = settings?.[featKey] != null ? String(settings[featKey]).trim() : '';
    const features = splitLines(featText);
    return {
      ...plan,
      description: desc || plan.description,
      features: features || plan.features,
    };
  });
}

export function membershipSectionHeadlinesFromSettings(settings) {
  return {
    eyebrow:
      settings?.membershipEyebrow != null && String(settings.membershipEyebrow).trim()
        ? String(settings.membershipEyebrow).trim()
        : DEFAULT_MEMBERSHIP_EYEBROW,
    title:
      settings?.membershipTitle != null && String(settings.membershipTitle).trim()
        ? String(settings.membershipTitle).trim()
        : DEFAULT_MEMBERSHIP_TITLE,
    subtitle:
      settings?.membershipSubtitle != null && String(settings.membershipSubtitle).trim()
        ? String(settings.membershipSubtitle).trim()
        : DEFAULT_MEMBERSHIP_SUBTITLE,
  };
}

/**
 * Default membership copy as shown on the site when nothing is saved in DB.
 */
export function buildMembershipFormDefaultsFromPlans() {
  const free = MEMBERSHIP_PLANS.find((p) => p.id === 'free');
  const standard = MEMBERSHIP_PLANS.find((p) => p.id === 'standard');
  const premium = MEMBERSHIP_PLANS.find((p) => p.id === 'premium');
  return {
    membershipEyebrow: DEFAULT_MEMBERSHIP_EYEBROW,
    membershipTitle: DEFAULT_MEMBERSHIP_TITLE,
    membershipSubtitle: DEFAULT_MEMBERSHIP_SUBTITLE,
    membershipDescFree: free?.description ?? '',
    membershipDescStandard: standard?.description ?? '',
    membershipDescPremium: premium?.description ?? '',
    membershipFeaturesFree: (free?.features ?? []).join('\n'),
    membershipFeaturesStandard: (standard?.features ?? []).join('\n'),
    membershipFeaturesPremium: (premium?.features ?? []).join('\n'),
  };
}

/**
 * Merge API site settings with code defaults so admin fields show the effective public copy.
 * @param {Record<string, unknown> | null | undefined} apiData
 */
export function mergeApiMembershipFormWithDefaults(apiData) {
  const base = buildMembershipFormDefaultsFromPlans();
  const d = apiData || {};
  const pick = (key) => {
    const v = d[key];
    if (v != null && String(v).trim() !== '') return String(v);
    return base[key];
  };
  return {
    membershipEyebrow: pick('membershipEyebrow'),
    membershipTitle: pick('membershipTitle'),
    membershipSubtitle: pick('membershipSubtitle'),
    membershipDescFree: pick('membershipDescFree'),
    membershipDescStandard: pick('membershipDescStandard'),
    membershipDescPremium: pick('membershipDescPremium'),
    membershipFeaturesFree: pick('membershipFeaturesFree'),
    membershipFeaturesStandard: pick('membershipFeaturesStandard'),
    membershipFeaturesPremium: pick('membershipFeaturesPremium'),
  };
}
