import { useState, useEffect } from 'react';
import { Badge } from '../components/ui/badge';
import { resourceAPI } from '../lib/api';
import { ClipboardList, BookOpen, HelpCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ResourceLibrary() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    resourceAPI.list()
      .then(res => setResources(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const typeIcon = { checklist: ClipboardList, guide: BookOpen, faq: HelpCircle };
  const typeColor = { checklist: 'bg-blue-50 text-blue-600', guide: 'bg-green-50 text-green-600', faq: 'bg-spruce-50 text-spruce-600' };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-spruce-700" /></div>;
  }

  const renderResource = (resource) => {
    const Icon = typeIcon[resource.type];
    const isOpen = expanded[resource.id];
    return (
      <div key={resource.id} className="bg-white rounded-xl border overflow-hidden" data-testid={`resource-${resource.id}`}>
        <button
          onClick={() => toggle(resource.id)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
          data-testid={`resource-toggle-${resource.id}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${typeColor[resource.type]} flex items-center justify-center`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-slate-900">{resource.title}</h3>
              <Badge className={`${typeColor[resource.type]} text-xs mt-1`}>{resource.type}</Badge>
            </div>
          </div>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {isOpen && (
          <div className="px-5 pb-5 border-t">
            <div className="prose max-w-none pt-4 text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {resource.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h3 key={i} className="font-heading font-semibold text-base text-slate-800 mt-4 mb-2">{line.replace('## ', '')}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-4 text-sm list-disc">{line.replace('- ', '')}</li>;
                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) return <li key={i} className="ml-4 text-sm list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="resource-library">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl py-10 md:py-14">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900">Resource Library</h1>
          <p className="mt-2 text-base text-slate-600">
            Guides, checklists, and FAQs to help your Alberta journey. Content is managed by admin in the Resources section.
          </p>
        </div>

        {resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            No resources published yet.
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map(renderResource)}
          </div>
        )}
      </div>
    </div>
  );
}
