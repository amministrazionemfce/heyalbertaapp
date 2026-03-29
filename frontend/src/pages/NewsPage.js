import { useEffect, useState } from 'react';
import NewsPageHero from '../components/NewsPageHero';
import NewsCategoriesSection from '../components/NewsCategoriesSection';
import NewsArticlesSection from '../components/NewsArticlesSection';
import MembershipTiersSection from '../components/MembershipTiersSection';
import { siteAPI, resourceAPI, listingAPI } from '../lib/api';

export default function NewsPage() {
  const [settings, setSettings] = useState(null);
  const [newsCategories, setNewsCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [listingCounts, setListingCounts] = useState({});
  const [categoryImageOverrides, setCategoryImageOverrides] = useState({});

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [siteRes, catRes, artRes, countsRes, imgRes] = await Promise.all([
          siteAPI.settings(),
          resourceAPI.list({ type: 'news_category' }),
          resourceAPI.list({ type: 'article' }),
          listingAPI.countsByCategory(),
          listingAPI.categoryImages(),
        ]);
        if (cancelled) return;
        setSettings(siteRes.data);
        setNewsCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setArticles(Array.isArray(artRes.data) ? artRes.data : []);
        setListingCounts(countsRes.data || {});
        setCategoryImageOverrides(imgRes.data || {});
      } catch {
        if (!cancelled) {
          setSettings(null);
          setNewsCategories([]);
          setArticles([]);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const articleSlice = articles.slice(0, 12);

  return (
    <div className="min-h-screen bg-white" data-testid="news-page">
      <NewsPageHero settings={settings} />
      <NewsArticlesSection articles={articleSlice} />
      <NewsCategoriesSection
        managedItems={newsCategories}
        listingCounts={listingCounts}
        categoryImageOverrides={categoryImageOverrides}
      />
      <div className="border-t border-slate-200/80 bg-slate-50">
        <MembershipTiersSection />
      </div>
    </div>
  );
}
