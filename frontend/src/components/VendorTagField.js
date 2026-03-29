import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { VENDOR_TAG_SUGGESTIONS } from '../data/vendorTags';

const MAX_TAGS = 30;

function normalizeTag(t) {
  return String(t || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 48);
}

/**
 * @param {{ selectedTags: string[], onChange: (tags: string[]) => void }} props
 */
export function VendorTagField({ selectedTags, onChange }) {
  const [custom, setCustom] = useState('');
  const set = new Set(selectedTags.map((t) => t.toLowerCase()));

  const toggle = (raw) => {
    const t = normalizeTag(raw);
    if (!t) return;
    const lower = t.toLowerCase();
    let next;
    if (set.has(lower)) {
      next = selectedTags.filter((x) => x.toLowerCase() !== lower);
    } else {
      next = [...selectedTags, t];
      if (next.length > MAX_TAGS) next = next.slice(0, MAX_TAGS);
    }
    onChange(next);
  };

  const remove = (raw) => {
    onChange(selectedTags.filter((x) => x !== raw));
  };

  const addCustom = () => {
    const t = normalizeTag(custom);
    if (!t) return;
    toggle(t);
    setCustom('');
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs">Tags</Label>
      <p className="text-[11px] text-slate-500">
        Choose from suggestions or add your own (up to {MAX_TAGS} tags).
      </p>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-spruce-50 border border-spruce-100 pl-2 pr-1 py-0.5 text-xs font-medium text-spruce-900"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="rounded p-0.5 text-spruce-600 hover:bg-spruce-100 hover:text-spruce-900"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {VENDOR_TAG_SUGGESTIONS.map((s) => {
          const active = set.has(s.toLowerCase());
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-spruce-600 bg-spruce-700 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add a custom tag…"
          className="h-9 flex-1"
        />
        <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1" onClick={addCustom}>
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
