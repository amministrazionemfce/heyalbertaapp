import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { resourceAPI } from '../../lib/api';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus, Search, Trash2 } from 'lucide-react';

export function AdminResourcesSection({ onUpdate }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'guide', content: '', category: 'general' });
  const [search, setSearch] = useState('');

  const fetchResources = async () => {
    try {
      const res = await resourceAPI.list();
      setResources(Array.isArray(res.data) ? res.data : []);
    } catch {
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCreate = async () => {
    if (!form.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      await resourceAPI.create(form);
      toast.success('Resource created');
      setShowCreate(false);
      setForm({ title: '', type: 'guide', content: '', category: 'general' });
      await fetchResources();
      onUpdate?.();
    } catch {
      toast.error('Failed to create resource');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource? This cannot be undone.')) return;
    try {
      await resourceAPI.delete(id);
      toast.success('Resource deleted');
      await fetchResources();
      onUpdate?.();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const typeConfig = {
    checklist: { label: 'Checklist', class: 'bg-blue-100 text-blue-800' },
    guide: { label: 'Guide', class: 'bg-emerald-100 text-emerald-800' },
    faq: { label: 'FAQ', class: 'bg-violet-100 text-violet-800' },
  };

  const filteredResources = useMemo(() => {
    if (!search) return resources;
    const q = search.toLowerCase();
    return resources.filter(
      (r) => (r.title || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q)
    );
  }, [resources, search]);

  return (
    <div className="space-y-6" data-testid="admin-resources-section">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search resources…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white"
          />
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-admin-600 hover:bg-admin-700 text-white gap-2 shadow-sm" data-testid="create-resource-btn">
              <Plus className="w-4 h-4" /> Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">Create resource</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">Add a new guide, checklist, or FAQ for the resource library.</p>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-slate-700">Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. Moving checklist"
                  data-testid="resource-form-title"
                />
              </div>
              <div>
                <Label className="text-slate-700">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checklist">Checklist</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5"
                  placeholder="e.g. general, moving"
                />
              </div>
              <div>
                <Label className="text-slate-700">Content (Markdown supported)</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={8}
                  className="mt-1.5 font-mono text-sm"
                  placeholder="## Heading&#10;- Bullet points&#10;1. Numbered list"
                  data-testid="resource-form-content"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleCreate} className="flex-1 bg-admin-600 hover:bg-admin-700 text-white shadow-sm" data-testid="resource-form-save">
                  Create resource
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No resources yet</p>
          <p className="text-sm text-slate-500 mt-1">Create guides, checklists, or FAQs to help newcomers.</p>
          <Button className="mt-4 bg-admin-600 hover:bg-admin-700 text-white shadow-sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add first resource
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredResources.map((r) => {
            const type = typeConfig[r.type] || typeConfig.guide;
            return (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                data-testid={`admin-resource-${r.id}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900">{r.title}</h3>
                    <Badge className={type.class}>{type.label}</Badge>
                  </div>
                  <p className="text-sm text-slate-500">{r.category || 'general'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 gap-1 flex-shrink-0"
                  onClick={() => handleDelete(r.id)}
                  data-testid={`delete-resource-${r.id}`}
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

