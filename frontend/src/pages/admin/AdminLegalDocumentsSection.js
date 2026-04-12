import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Loader2, FileText } from 'lucide-react';
import { siteAPI, adminAPI } from '../../lib/api';
import { getApiErrorLines } from '../../lib/formatApiError';
import AuthFormError from '../../components/AuthFormError';
import { toast } from 'sonner';

export function AdminLegalDocumentsSection({ onUpdate }) {
  const [privacyContent, setPrivacyContent] = useState('');
  const [termsContent, setTermsContent] = useState('');
  const [activeTab, setActiveTab] = useState('privacy');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState([]);

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((res) => {
        if (!cancelled) {
          setPrivacyContent(res.data?.privacyPolicyContent || '');
          setTermsContent(res.data?.termsOfServiceContent || '');
        }
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    setApiError([]);
    setSaving(true);

    try {
      const content = activeTab === 'privacy' ? privacyContent : termsContent;
      const updateData = activeTab === 'privacy' 
        ? { privacyPolicyContent: content }
        : { termsOfServiceContent: content };

      await adminAPI.updateSiteSettings(updateData);
      toast.success(`${activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'} updated successfully.`);
      if (onUpdate) onUpdate();
    } catch (err) {
      setApiError(getApiErrorLines(err));
      toast.error('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-legal-documents-section">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'privacy', label: 'Privacy Policy', icon: FileText },
          { id: 'terms', label: 'Terms of Service', icon: FileText },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-spruce-700 text-white shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
              data-testid={`admin-legal-tab-${id}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-heading text-lg font-semibold mb-4 text-slate-900">
          {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
        </h3>

        {apiError.length > 0 && (
          <div className="mb-4">
            <AuthFormError lines={apiError} />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="legal-content">Content (Markdown supported)</Label>
            <textarea
              id="legal-content"
              value={activeTab === 'privacy' ? privacyContent : termsContent}
              onChange={(e) => {
                if (activeTab === 'privacy') {
                  setPrivacyContent(e.target.value);
                } else {
                  setTermsContent(e.target.value);
                }
              }}
              rows={20}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 font-mono text-sm placeholder-slate-400 focus:border-spruce-500 focus:outline-none focus:ring-2 focus:ring-spruce-200"
              placeholder="Enter document content..."
              data-testid={`admin-legal-content-${activeTab}`}
            />
            <p className="mt-2 text-xs text-slate-500">
              Supports Markdown formatting: # Headings, **bold**, *italic*, - lists, etc.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-spruce-700 hover:bg-spruce-800 text-white"
              data-testid={`admin-legal-save-${activeTab}`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            <p className="text-sm text-slate-500 flex items-center">
              Changes will be immediately visible on the {activeTab === 'privacy' ? '/privacy-policy' : '/terms-of-service'} page.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm text-amber-900">
          <strong>Note:</strong> Make sure these documents comply with your jurisdiction's legal requirements and Stripe's merchant terms. We recommend consulting with a legal professional.
        </p>
      </div>
    </div>
  );
}
