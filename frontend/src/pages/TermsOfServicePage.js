import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ROUTES } from '../constants';
import { siteAPI } from '../lib/api';
import { useSEO } from '../hooks/useSEO';
import ReactMarkdown from 'react-markdown';

export default function TermsOfServicePage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Terms of Service',
    description: 'Review the terms of service that govern your use of the Hey Alberta platform and services.',
  });

  useEffect(() => {
    let cancelled = false;
    siteAPI
      .settings()
      .then((res) => {
        if (!cancelled) {
          setContent(res.data?.termsOfServiceContent || '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContent('');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-spruce-700 mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-spruce-700" />
            </div>
          ) : (
            <div className="prose prose-sm md:prose max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Last updated: {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
        </p>
      </div>
    </div>
  );
}
