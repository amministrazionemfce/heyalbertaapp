import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Newspaper,
  LayoutGrid,
  FileText,
  BookOpen,
  ChevronDown,
  Image,
  Mail,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import { adminAPI, resourceAPI, uploadAdminImage } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/mediaUrl';

const emptyCategoryForm = {
  title: '',
  content: '',
  imageUrl: '',
  linkUrl: '',
  sortOrder: '0',
};

const emptyArticleForm = {
  title: '',
  excerpt: '',
  content: '',
  imageUrl: '',
  linkUrl: '',
  featured: false,
  publishedAt: '',
  hideCardText: false,
};

/** Lean JSON from Mongo omits `id` virtual; use `id` or `_id` for API paths. */
function resourceClientId(r) {
  if (!r) return '';
  const id = r.id ?? r._id;
  return id != null ? String(id) : '';
}

export function AdminNewsSection({ onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [savingPage, setSavingPage] = useState(false);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [legacy, setLegacy] = useState([]);
  const [legacyOpen, setLegacyOpen] = useState(false);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catEditId, setCatEditId] = useState(null);
  const [catForm, setCatForm] = useState(emptyCategoryForm);
  const [catSaving, setCatSaving] = useState(false);
  const [catUploading, setCatUploading] = useState(false);

  const [artEditorOpen, setArtEditorOpen] = useState(false);
  const [artEditId, setArtEditId] = useState(null);
  const [artForm, setArtForm] = useState(emptyArticleForm);
  const [artSaving, setArtSaving] = useState(false);
  const [artUploading, setArtUploading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [mainTab, setMainTab] = useState('banner'); // 'banner' | 'articles' | 'categories' | 'subscribers'
  const [newsSubscribers, setNewsSubscribers] = useState([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [newsHeroUrl, setNewsHeroUrl] = useState('');
  const [heroUploading, setHeroUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, allRes] = await Promise.all([adminAPI.siteSettings(), resourceAPI.list()]);
      setSettings(sRes.data);
      const all = Array.isArray(allRes.data) ? allRes.data : [];
      setCategories(all.filter((r) => r.type === 'news_category'));
      setArticles(all.filter((r) => r.type === 'article'));
      setLegacy(all.filter((r) => !['article', 'news_category'].includes(r.type)));
    } catch {
      toast.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (mainTab !== 'subscribers') return undefined;
    let cancelled = false;
    setSubscribersLoading(true);
    adminAPI
      .newsSubscribers()
      .then((res) => {
        if (!cancelled) setNewsSubscribers(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) {
          setNewsSubscribers([]);
          toast.error('Could not load subscribers');
        }
      })
      .finally(() => {
        if (!cancelled) setSubscribersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mainTab]);

  const pageForm = useMemo(
    () => ({
      newsHeadline: settings?.newsHeadline ?? '',
      newsSubhead: settings?.newsSubhead ?? '',
      newsCtaPrimaryText: settings?.newsCtaPrimaryText ?? '',
      newsCtaPrimaryLink: settings?.newsCtaPrimaryLink ?? '',
      newsCtaSecondaryText: settings?.newsCtaSecondaryText ?? '',
      newsCtaSecondaryLink: settings?.newsCtaSecondaryLink ?? '',
    }),
    [settings]
  );

  const [pageFields, setPageFields] = useState(pageForm);
  useEffect(() => {
    setPageFields(pageForm);
  }, [pageForm]);

  useEffect(() => {
    if (settings) setNewsHeroUrl(String(settings.newsHeroImage || '').trim());
  }, [settings]);

  const newsHeroPreview = useMemo(() => {
    const u = (newsHeroUrl || '').trim();
    return u ? resolveMediaUrl(u) || u : '/background.jpeg';
  }, [newsHeroUrl]);

  const artImagePreview = useMemo(() => {
    const u = (artForm.imageUrl || '').trim();
    return u ? resolveMediaUrl(u) || u : '';
  }, [artForm.imageUrl]);

  const savePageSettings = async () => {
    setSavingPage(true);
    try {
      const res = await adminAPI.updateSiteSettings({
        ...pageFields,
        newsHeroImage: (newsHeroUrl || '').trim(),
      });
      setSettings(res.data);
      toast.success('Banner and page text saved');
      onUpdate?.();
    } catch {
      toast.error('Could not save');
    } finally {
      setSavingPage(false);
    }
  };

  const handleNewsHeroUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setHeroUploading(true);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (url) setNewsHeroUrl(url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setHeroUploading(false);
    }
  };

  const openNewCategory = () => {
    setMainTab('categories');
    setCatEditId(null);
    setCatForm(emptyCategoryForm);
    setCatDialogOpen(true);
  };

  const openEditCategory = (r) => {
    setMainTab('categories');
    setCatEditId(resourceClientId(r) || null);
    setCatForm({
      title: r.title || '',
      content: r.content || '',
      imageUrl: r.imageUrl || '',
      linkUrl: r.linkUrl || '',
      sortOrder: String(r.sortOrder ?? 0),
    });
    setCatDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!(catForm.title || '').trim()) {
      toast.error('Title is required');
      return;
    }
    setCatSaving(true);
    try {
      const payload = {
        type: 'news_category',
        title: catForm.title.trim(),
        content: catForm.content.trim() || ' ',
        category: 'news',
        imageUrl: (catForm.imageUrl || '').trim(),
        linkUrl: (catForm.linkUrl || '').trim(),
        sortOrder: Math.min(999, Math.max(0, parseInt(catForm.sortOrder, 10) || 0)),
        excerpt: '',
        featured: false,
        publishedAt: '',
        authorLabel: '',
      };
      if (catEditId) {
        await resourceAPI.update(catEditId, payload);
        toast.success('Category card updated');
      } else {
        await resourceAPI.create(payload);
        toast.success('Category card added');
      }
      setCatDialogOpen(false);
      await load();
      onUpdate?.();
    } catch {
      toast.error('Save failed');
    } finally {
      setCatSaving(false);
    }
  };

  const requestDeleteCategory = (id) => {
    const c = categories.find((x) => resourceClientId(x) === id);
    setDeleteConfirm({ kind: 'category', id, title: c?.title });
  };

  const openNewArticle = () => {
    setMainTab('articles');
    setArtEditId(null);
    setArtForm({
      ...emptyArticleForm,
      publishedAt: new Date().toISOString().slice(0, 16),
    });
    setArtEditorOpen(true);
  };

  const openEditArticle = (r) => {
    setMainTab('articles');
    setArtEditId(resourceClientId(r) || null);
    let pub = '';
    if (r.publishedAt) {
      const d = new Date(r.publishedAt);
      if (!Number.isNaN(d.getTime())) pub = d.toISOString().slice(0, 16);
    }
    setArtForm({
      title: r.title || '',
      excerpt: r.excerpt || '',
      content: r.content || '',
      imageUrl: r.imageUrl || '',
      linkUrl: r.linkUrl || '',
      featured: !!r.featured,
      publishedAt: pub,
      hideCardText: !!r.hideCardText,
    });
    setArtEditorOpen(true);
  };

  const closeArticleEditor = () => {
    setArtEditorOpen(false);
    setArtEditId(null);
  };

  const saveArticle = async () => {
    if (!(artForm.title || '').trim()) {
      toast.error('Title is required');
      return;
    }
    if (!(artForm.content || '').trim()) {
      toast.error('Article body is required');
      return;
    }
    setArtSaving(true);
    try {
      let publishedAt = artForm.publishedAt ? new Date(artForm.publishedAt).toISOString() : new Date().toISOString();
      const payload = {
        type: 'article',
        title: artForm.title.trim(),
        content: artForm.content.trim(),
        excerpt: (artForm.excerpt || '').trim() || artForm.content.trim().slice(0, 220),
        category: 'news',
        imageUrl: (artForm.imageUrl || '').trim(),
        linkUrl: (artForm.linkUrl || '').trim(),
        featured: !!artForm.featured,
        publishedAt,
        authorLabel: '',
        hideCardText: !!artForm.hideCardText,
        sortOrder: 0,
      };
      if (artEditId) {
        await resourceAPI.update(artEditId, payload);
        toast.success('Article updated');
      } else {
        await resourceAPI.create(payload);
        toast.success('Article published');
      }
      closeArticleEditor();
      await load();
      onUpdate?.();
    } catch {
      toast.error('Save failed');
    } finally {
      setArtSaving(false);
    }
  };

  const requestDeleteArticle = (id) => {
    const a = articles.find((x) => resourceClientId(x) === id);
    setDeleteConfirm({ kind: 'article', id, title: a?.title });
  };

  const requestDeleteLegacy = (id) => {
    const r = legacy.find((x) => resourceClientId(x) === id);
    setDeleteConfirm({ kind: 'legacy', id, title: r?.title });
  };

  const runConfirmedDelete = async () => {
    const dc = deleteConfirm;
    if (!dc?.id) return;
    setDeleteLoading(true);
    try {
      await resourceAPI.delete(dc.id);
      if (dc.kind === 'article' && artEditId === dc.id) {
        closeArticleEditor();
      }
      toast.success('Deleted');
      setDeleteConfirm(null);
      await load();
      onUpdate?.();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCatImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setCatUploading(true);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (url) setCatForm((f) => ({ ...f, imageUrl: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setCatUploading(false);
    }
  };

  const handleArtImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setArtUploading(true);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (url) setArtForm((f) => ({ ...f, imageUrl: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setArtUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-admin-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="admin-news-section">
      <div className="rounded-2xl border border-spruce-700/40 bg-gradient-to-br from-spruce-900 via-spruce-800 to-spruce-900 p-6 md:p-8 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white/10 p-2.5">
            <Newspaper className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold">News</h2>
            <p className="text-sm text-spruce-100/90 mt-1 max-w-2xl">
              Use the <strong className="text-white">Banner &amp; page</strong> tab for the hero image and headline. Articles and category cards have their
              own tabs below.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-spruce-200 bg-white shadow-sm ring-1 ring-spruce-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 md:p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-spruce-700 shrink-0" />
              Manage News page
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Banner, articles, category cards, and news email subscribers — switch tabs below.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant={mainTab === 'banner' ? 'default' : 'outline'}
              className={mainTab === 'banner' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'}
              onClick={() => setMainTab('banner')}
            >
              <Image className="w-4 h-4 mr-1.5" />
              Banner &amp; page
            </Button>
            <Button
              type="button"
              variant={mainTab === 'articles' ? 'default' : 'outline'}
              className={mainTab === 'articles' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'}
              onClick={() => setMainTab('articles')}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Articles
            </Button>
            <Button
              type="button"
              variant={mainTab === 'categories' ? 'default' : 'outline'}
              className={mainTab === 'categories' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'}
              onClick={() => setMainTab('categories')}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Category cards
            </Button>
            <Button
              type="button"
              variant={mainTab === 'subscribers' ? 'default' : 'outline'}
              className={mainTab === 'subscribers' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'}
              onClick={() => setMainTab('subscribers')}
              data-testid="admin-news-subscribers-tab"
            >
              <Mail className="w-4 h-4 mr-1.5" />
              Subscribers
            </Button>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {mainTab === 'banner' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 xl:gap-10">
                <div className="min-w-0 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hero preview</p>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-[21/9] bg-slate-200 shadow-inner">
                    <img src={newsHeroPreview} alt="" className="w-full h-full object-cover" />
                    <div
                      className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/65 to-slate-950/85 pointer-events-none"
                      aria-hidden
                    />
                  </div>
                  <div>
                    <Label htmlFor="news-hero-url">Hero image URL</Label>
                    <Input
                      id="news-hero-url"
                      value={newsHeroUrl}
                      onChange={(e) => setNewsHeroUrl(e.target.value)}
                      className="mt-1"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="news-hero-file">Upload image</Label>
                    <input
                      id="news-hero-file"
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-slate-600"
                      onChange={handleNewsHeroUpload}
                      disabled={heroUploading}
                    />
                  </div>
                </div>
                <div className="min-w-0 space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Headline &amp; buttons</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="nh">Headline</Label>
                      <Input
                        id="nh"
                        value={pageFields.newsHeadline}
                        onChange={(e) => setPageFields((p) => ({ ...p, newsHeadline: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="ns">Subheading</Label>
                      <Textarea
                        id="ns"
                        rows={3}
                        value={pageFields.newsSubhead}
                        onChange={(e) => setPageFields((p) => ({ ...p, newsSubhead: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="c1t">Primary button text</Label>
                      <Input
                        id="c1t"
                        value={pageFields.newsCtaPrimaryText}
                        onChange={(e) => setPageFields((p) => ({ ...p, newsCtaPrimaryText: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="c1l">Primary button link</Label>
                      <Input
                        id="c1l"
                        value={pageFields.newsCtaPrimaryLink}
                        onChange={(e) => setPageFields((p) => ({ ...p, newsCtaPrimaryLink: e.target.value }))}
                        className="mt-1"
                        placeholder="__subscribe__ (email modal) or /path or https://..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="c2t">Secondary button text</Label>
                      <Input
                        id="c2t"
                        value={pageFields.newsCtaSecondaryText}
                        onChange={(e) => setPageFields((p) => ({ ...p, newsCtaSecondaryText: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="c2l">Secondary button link</Label>
                      <Input
                        id="c2l"
                        value={pageFields.newsCtaSecondaryLink}
                        onChange={(e) => setPageFields((p) => ({ ...p, newsCtaSecondaryLink: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={savePageSettings}
                  disabled={savingPage}
                  className="bg-spruce-700 hover:bg-spruce-800 text-white"
                >
                  {savingPage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save banner &amp; page text
                </Button>
              </div>
            </div>
          )}

          {mainTab === 'articles' && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h3 className="font-heading font-semibold text-slate-900 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-spruce-700" />
                  Articles
                  <span className="text-xs font-normal text-slate-500">(carousel under hero on News page)</span>
                </h3>
                <Button type="button" onClick={openNewArticle} className="bg-spruce-700 hover:bg-spruce-800 text-white gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> Add article
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,1fr)] gap-6 lg:gap-8 lg:items-start">
                <div className="min-w-0 space-y-3">
                  {articles.length === 0 ? (
                    <p className="text-sm text-slate-500 py-8 text-center border border-dashed rounded-xl">No articles yet.</p>
                  ) : (
                    articles.map((a) => {
                      const aid = resourceClientId(a);
                      const editing = artEditorOpen && artEditId && aid === artEditId;
                      return (
                        <div
                          key={aid}
                          className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border justify-between transition-colors ${
                            editing ? 'border-spruce-400 bg-spruce-50/60 ring-1 ring-spruce-200' : 'border-slate-100 bg-slate-50/50'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{a.title}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {a.featured ? <span className="text-amber-700 font-medium">Featured · </span> : null}
                              {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                            </p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button type="button" variant="outline" size="sm" onClick={() => openEditArticle(a)}>
                              Edit
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => requestDeleteArticle(aid)} className="text-red-600">
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="min-w-0 lg:border-l lg:border-slate-200 lg:pl-8 pt-6 lg:pt-0 border-t border-slate-200 lg:border-t-0">
                  {artEditorOpen ? (
                    <div className="space-y-4">
                      <h4 className="font-heading text-base font-semibold text-slate-900">
                        {artEditId ? 'Edit article' : 'New article'}
                      </h4>
                      <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden aspect-[16/10] max-h-72 flex items-center justify-center">
                        {artImagePreview ? (
                          <img src={artImagePreview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <p className="text-sm text-slate-500 px-4 text-center">Image preview — add a URL or upload below</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="art-title">Title</Label>
                        <Input
                          id="art-title"
                          value={artForm.title}
                          onChange={(e) => setArtForm((f) => ({ ...f, title: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="art-excerpt">Excerpt (optional)</Label>
                        <Textarea
                          id="art-excerpt"
                          rows={2}
                          value={artForm.excerpt}
                          onChange={(e) => setArtForm((f) => ({ ...f, excerpt: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="art-body">Body</Label>
                        <Textarea
                          id="art-body"
                          rows={8}
                          value={artForm.content}
                          onChange={(e) => setArtForm((f) => ({ ...f, content: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="art-img">Image URL</Label>
                        <Input
                          id="art-img"
                          value={artForm.imageUrl}
                          onChange={(e) => setArtForm((f) => ({ ...f, imageUrl: e.target.value }))}
                          className="mt-1"
                        />
                        <input type="file" accept="image/*" className="mt-2 text-sm" onChange={handleArtImageUpload} disabled={artUploading} />
                      </div>
                      <div>
                        <Label htmlFor="art-link">External “Learn more” link (optional)</Label>
                        <Input
                          id="art-link"
                          value={artForm.linkUrl}
                          onChange={(e) => setArtForm((f) => ({ ...f, linkUrl: e.target.value }))}
                          className="mt-1"
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="art-pub">Published</Label>
                        <Input
                          id="art-pub"
                          type="datetime-local"
                          value={artForm.publishedAt}
                          onChange={(e) => setArtForm((f) => ({ ...f, publishedAt: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={artForm.featured}
                          onChange={(e) => setArtForm((f) => ({ ...f, featured: e.target.checked }))}
                        />
                        Featured (sorts first)
                      </label>
                      <label className="flex items-start gap-2 text-sm leading-snug">
                        <input
                          type="checkbox"
                          checked={!!artForm.hideCardText}
                          onChange={(e) => setArtForm((f) => ({ ...f, hideCardText: e.target.checked }))}
                          className="mt-0.5"
                        />
                        <span>
                          <span className="font-medium text-slate-800">Image + button only</span>
                          <span className="block text-slate-500">
                            Hide title and excerpt on the public card (e.g. visual-only tile with Learn more).
                          </span>
                        </span>
                      </label>
                      <div className="flex flex-wrap justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={closeArticleEditor}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={saveArticle} disabled={artSaving} className="bg-spruce-700 hover:bg-spruce-800 text-white">
                          {artSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center min-h-[min(320px,50vh)] flex items-center justify-center">
                      <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                        Click <strong className="text-slate-800">Add article</strong> or <strong className="text-slate-800">Edit</strong> on a row to add or
                        change an article here. A large image preview appears above the fields when you add an image.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {mainTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-heading font-semibold text-slate-900 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-spruce-700" />
                  Browse category cards
                  <span className="text-xs font-normal text-slate-500">(carousel on News page)</span>
                </h3>
                <Button type="button" onClick={openNewCategory} className="bg-spruce-700 hover:bg-spruce-800 text-white gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> Add card
                </Button>
              </div>
              <p className="text-sm text-slate-600">
                If you add none, the News page uses directory categories automatically. Add cards here for custom titles, images, and links.
              </p>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center border border-dashed rounded-xl">No custom cards — fallback categories are shown.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {categories.map((c) => (
                    <div
                      key={resourceClientId(c)}
                      className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/80"
                    >
                      <div className="w-full sm:w-36 h-24 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                        {c.imageUrl ? (
                          <img
                            src={resolveMediaUrl(c.imageUrl) || c.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No image</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{c.title}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.content}</p>
                        <p className="text-xs text-slate-400 mt-1">Order: {c.sortOrder ?? 0}</p>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEditCategory(c)} className="gap-1">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => requestDeleteCategory(resourceClientId(c))} className="text-red-600 gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {mainTab === 'subscribers' && (
            <div className="space-y-4" data-testid="admin-news-subscribers-panel">
              <h3 className="font-heading flex items-center gap-2 font-semibold text-slate-900">
                <Mail className="h-5 w-5 text-spruce-700" />
                News email subscribers
              </h3>
              <p className="text-sm text-slate-600">
                Addresses from the News page subscribe flow. When you publish a new article, these emails are notified if SMTP
                is configured on the server.
              </p>
              {subscribersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-spruce-600" />
                </div>
              ) : newsSubscribers.length === 0 ? (
                <p className="rounded-xl border border-dashed py-8 text-center text-sm text-slate-500">No subscribers yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left">
                        <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                        <th className="px-4 py-3 font-semibold text-slate-700">Subscribed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsSubscribers.map((row, i) => (
                        <tr key={`${row.email}-${i}`} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2.5 text-slate-900">{row.email}</td>
                          <td className="px-4 py-2.5 tabular-nums text-slate-600">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {legacy.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <button
            type="button"
            onClick={() => setLegacyOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left font-medium text-slate-700"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-500" />
              Legacy guides & FAQs ({legacy.length})
            </span>
            <ChevronDown className={`w-5 h-5 transition-transform ${legacyOpen ? 'rotate-180' : ''}`} />
          </button>
          {legacyOpen && (
            <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {legacy.map((r) => (
                <li key={resourceClientId(r)} className="flex items-center justify-between gap-2 text-sm py-2 border-b border-slate-50 last:border-0">
                  <span className="truncate">
                    <span className="text-slate-400 uppercase text-[10px] mr-2">{r.type}</span>
                    {r.title}
                  </span>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 shrink-0" onClick={() => requestDeleteLegacy(resourceClientId(r))}>
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle>{catEditId ? 'Edit category card' : 'Add category card'}</DialogTitle>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={catForm.title} onChange={(e) => setCatForm((f) => ({ ...f, title: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={catForm.content}
                onChange={(e) => setCatForm((f) => ({ ...f, content: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={catForm.imageUrl} onChange={(e) => setCatForm((f) => ({ ...f, imageUrl: e.target.value }))} className="mt-1" />
              <input type="file" accept="image/*" className="mt-2 text-sm" onChange={handleCatImageUpload} disabled={catUploading} />
            </div>
            <div>
              <Label>Link (path or https://)</Label>
              <Input
                value={catForm.linkUrl}
                onChange={(e) => setCatForm((f) => ({ ...f, linkUrl: e.target.value }))}
                className="mt-1"
                placeholder="/listings?category=..."
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={catForm.sortOrder}
                onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCatDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={saveCategory} disabled={catSaving} className="bg-spruce-700 hover:bg-spruce-800 text-white">
                {catSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmActionModal
        open={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        title={
          deleteConfirm?.kind === 'category'
            ? 'Delete category card?'
            : deleteConfirm?.kind === 'legacy'
              ? 'Delete this item?'
              : 'Delete this article?'
        }
        description={
          deleteConfirm?.title ? (
            <>
              This will permanently remove <span className="font-semibold text-slate-800">“{deleteConfirm.title}”</span>. This cannot be undone.
            </>
          ) : (
            'This will permanently remove this item. This cannot be undone.'
          )
        }
        confirmLabel="Delete"
        onConfirm={runConfirmedDelete}
        loading={deleteLoading}
        data-testid="admin-news-delete-confirm"
      />
    </div>
  );
}
