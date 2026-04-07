import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  DEFAULT_TESTIMONIALS_HEADING,
  mergeApiHomeTestimonialsForm,
  normalizeHomeTestimonial,
  testimonialTimeToDateInputValue,
} from '../../data/homeTestimonials';
import { TestimonialsFlowPreview } from '../../components/TestimonialsFlowSection';

const MAX_QUOTES = 8;

export function AdminPlatformReviewsSection({ onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => mergeApiHomeTestimonialsForm(null));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.siteSettings();
      setForm(mergeApiHomeTestimonialsForm(res.data));
    } catch {
      toast.error('Could not load platform reviews.');
      setForm(mergeApiHomeTestimonialsForm(null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const previewItems = useMemo(
    () => form.homeTestimonials.map((t, i) => normalizeHomeTestimonial(t, i)).filter((t) => t.name && t.text),
    [form.homeTestimonials]
  );

  const handleSave = async () => {
    const cleaned = form.homeTestimonials
      .map((t, i) => normalizeHomeTestimonial(t, i))
      .filter((t) => t.name && t.text);
    if (!cleaned.length) {
      toast.error('Add at least one quote with a name and review text.');
      return;
    }
    setSaving(true);
    try {
      await adminAPI.updateSiteSettings({
        homeTestimonialsHeading: form.homeTestimonialsHeading.trim() || DEFAULT_TESTIMONIALS_HEADING,
        homeTestimonials: cleaned,
      });
      toast.success('Platform reviews updated.');
      setForm((prev) => ({ ...prev, homeTestimonials: cleaned }));
      onUpdate?.();
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const updateRow = (index, patch) => {
    setForm((prev) => {
      const homeTestimonials = prev.homeTestimonials.map((row, i) => (i === index ? { ...row, ...patch } : row));
      return { ...prev, homeTestimonials };
    });
  };

  const removeRow = (index) => {
    setForm((prev) => ({
      ...prev,
      homeTestimonials: prev.homeTestimonials.filter((_, i) => i !== index),
    }));
  };

  const addRow = () => {
    setForm((prev) => {
      if (prev.homeTestimonials.length >= MAX_QUOTES) return prev;
      const id = `new-${Date.now()}`;
      return {
        ...prev,
        homeTestimonials: [
          ...prev.homeTestimonials,
          { id, name: '', time: new Date().toISOString().slice(0, 10), text: '', rating: 5 },
        ],
      };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16" data-testid="admin-platform-reviews-section">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-800" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-platform-reviews-section">
      <div className="grid gap-8 xl:grid-cols-[minmax(260px,380px)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-6 min-w-0 order-2 xl:order-1">
          <div className="rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Platform reviews</h2>
            <p className="text-sm text-slate-600 mt-1 mb-6">
              These quotes power the <strong className="font-medium text-slate-800">“What People Say About Us”</strong>{' '}
              section on the home page (not vendor or listing reviews). Sample quotes are pre-filled; edit and save to
              publish. The preview matches the live layout.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="pr-heading">Section heading</Label>
                <Input
                  id="pr-heading"
                  value={form.homeTestimonialsHeading}
                  onChange={(e) => setForm({ ...form, homeTestimonialsHeading: e.target.value })}
                  placeholder={DEFAULT_TESTIMONIALS_HEADING}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700">Quotes ({form.homeTestimonials.length})</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={addRow}
              disabled={form.homeTestimonials.length >= MAX_QUOTES}
              data-testid="admin-platform-reviews-add"
            >
              <Plus className="w-4 h-4" /> Add quote
            </Button>
          </div>

          {form.homeTestimonials.map((row, index) => (
            <div
              key={row.id || `row-${index}`}
              className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-3"
              data-testid={`admin-platform-review-row-${index}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quote {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                  onClick={() => removeRow(index)}
                  disabled={form.homeTestimonials.length <= 1}
                  aria-label={`Remove quote ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`pr-name-${index}`}>Display name</Label>
                  <Input
                    id={`pr-name-${index}`}
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    placeholder="Priya K."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor={`pr-time-${index}`}>Review date</Label>
                  <Input
                    id={`pr-time-${index}`}
                    type="date"
                    value={testimonialTimeToDateInputValue(row.time)}
                    onChange={(e) => updateRow(index, { time: e.target.value || row.time })}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Shown on the home page as a short formatted date. Legacy text-only values still display as entered until
                    you pick a date.
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor={`pr-rating-${index}`}>Star rating (1–5)</Label>
                <Input
                  id={`pr-rating-${index}`}
                  type="number"
                  min={1}
                  max={5}
                  value={row.rating}
                  onChange={(e) =>
                    updateRow(index, { rating: Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 5)) })
                  }
                  className="mt-1 max-w-[120px]"
                />
              </div>
              <div>
                <Label htmlFor={`pr-text-${index}`}>Review text</Label>
                <Textarea
                  id={`pr-text-${index}`}
                  value={row.text}
                  onChange={(e) => updateRow(index, { text: e.target.value })}
                  rows={4}
                  className="mt-1 resize-y"
                  placeholder="Short quote shown on the home page…"
                />
              </div>
            </div>
          ))}

          <Button
            type="button"
            className="bg-spruce-700 hover:bg-spruce-800 text-white gap-2"
            disabled={saving}
            onClick={handleSave}
            data-testid="admin-platform-reviews-save"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save platform reviews
          </Button>
        </div>

        <div className="order-1 xl:order-2 min-w-0 w-full xl:sticky xl:top-6 space-y-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">Preview</h2>
            <p className="text-sm text-slate-500 mt-0.5">Same marquee, cards, and dots as the home page.</p>
          </div>
          <TestimonialsFlowPreview
            items={previewItems.length ? previewItems : mergeApiHomeTestimonialsForm(null).homeTestimonials}
            heading={form.homeTestimonialsHeading}
          />
        </div>
      </div>
    </div>
  );
}
