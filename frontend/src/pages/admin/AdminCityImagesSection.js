import { useEffect, useMemo, useState } from 'react';
import { Image, Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { CATEGORIES, CITIES } from '../../data/categories';
import { getCityImageUrl } from '../../data/cityImages';
import { adminAPI, uploadAdminImage } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/mediaUrl';

function defaultCategoryImageSrc(categoryId) {
  const idx = CATEGORIES.findIndex((c) => c.id === categoryId);
  const imageNum = idx >= 0 ? idx + 1 : 1;
  return `/services/${imageNum}.jpg`;
}

const emptyHomeSlide = () => ({
  imageUrl: '',
  headline: '',
  headlineLine2: '',
  subhead: '',
});

export function AdminCityImagesSection() {
  const [tab, setTab] = useState('cities'); // 'cities' | 'categories' | 'pageBanners' | 'home'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);

  // Stored/edited values:
  // - cities: lower-case cityName -> imageUrl (empty/undefined means revert to default)
  // - categories: categoryId -> imageUrl (empty/undefined means revert to default)
  const [cityValues, setCityValues] = useState({});
  const [categoryValues, setCategoryValues] = useState({});
  const [aboutHeroUrl, setAboutHeroUrl] = useState('');
  const [contactHeroUrl, setContactHeroUrl] = useState('');
  const [newsHeroUrl, setNewsHeroUrl] = useState('');
  const [aboutMissionImages, setAboutMissionImages] = useState(['']);
  const [homeSlides, setHomeSlides] = useState([emptyHomeSlide()]);
  const [savingPageBanners, setSavingPageBanners] = useState(false);
  const [savingHomeHero, setSavingHomeHero] = useState(false);

  const effectiveCityOverrides = useMemo(() => {
    const out = {};
    for (const [k, v] of Object.entries(cityValues || {})) {
      const url = (v || '').trim();
      if (url) out[String(k).toLowerCase()] = url;
    }
    return out;
  }, [cityValues]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.allSettled([adminAPI.cityImages(), adminAPI.categoryImages(), adminAPI.siteSettings()]).then((results) => {
      if (cancelled) return;
      const cityRes = results[0];
      const catRes = results[1];

      const nextCities = {};
      if (cityRes.status === 'fulfilled') {
        const raw = cityRes.value?.data || {};
        for (const [k, v] of Object.entries(raw)) {
          if (!k) continue;
          nextCities[String(k).toLowerCase()] = String(v || '');
        }
      }
      setCityValues(nextCities);

      const nextCats = {};
      if (catRes.status === 'fulfilled') {
        const raw = catRes.value?.data || {};
        for (const [k, v] of Object.entries(raw)) {
          if (!k) continue;
          nextCats[String(k)] = String(v || '');
        }
      }
      setCategoryValues(nextCats);

      const siteRes = results[2];
      if (siteRes.status === 'fulfilled') {
        const d = siteRes.value?.data || {};
        setAboutHeroUrl(String(d.aboutHeroImage || '').trim());
        setContactHeroUrl(String(d.contactHeroImage || '').trim());
        setNewsHeroUrl(String(d.newsHeroImage || '').trim());
        const mission = d.aboutMissionImages;
        const cleanedMission = Array.isArray(mission)
          ? mission.map((x) => String(x ?? '').trim()).filter(Boolean)
          : [];
        setAboutMissionImages(cleanedMission.length ? cleanedMission : ['']);
        const slides = d.homeHeroSlides;
        if (Array.isArray(slides) && slides.length > 0) {
          setHomeSlides(
            slides.map((s) => ({
              imageUrl: String(s?.imageUrl ?? '').trim(),
              headline: String(s?.headline ?? '').trim(),
              headlineLine2: String(s?.headlineLine2 ?? '').trim(),
              subhead: String(s?.subhead ?? '').trim(),
            }))
          );
        } else {
          setHomeSlides([emptyHomeSlide()]);
        }
      }

      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpload = async (scope, key, file) => {
    if (!file) return;
    setUploadingKey(`${scope}:${key}`);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (!url) throw new Error('No URL returned');

      if (scope === 'cities') {
        setCityValues((prev) => ({ ...prev, [key]: url }));
      } else {
        setCategoryValues((prev) => ({ ...prev, [key]: url }));
      }

      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSaveCities = async () => {
    setSaving(true);
    try {
      const payload = CITIES.map((city) => {
        const key = city.toLowerCase();
        return { cityName: city, imageUrl: (cityValues?.[key] || '').trim() };
      });
      await adminAPI.updateCityImages(payload);
      toast.success('City images updated');
    } catch {
      toast.error('Failed to update city images');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCategories = async () => {
    setSaving(true);
    try {
      const payload = CATEGORIES.map((cat) => ({
        categoryId: cat.id,
        imageUrl: (categoryValues?.[cat.id] || '').trim(),
      }));
      await adminAPI.updateCategoryImages(payload);
      toast.success('Category images updated');
    } catch {
      toast.error('Failed to update category images');
    } finally {
      setSaving(false);
    }
  };

  const aboutHeroPreview =
    (aboutHeroUrl && (resolveMediaUrl(aboutHeroUrl) || aboutHeroUrl)) || '';
  const contactHeroPreview =
    (contactHeroUrl && (resolveMediaUrl(contactHeroUrl) || contactHeroUrl)) || '';
  const newsHeroPreview = (newsHeroUrl && (resolveMediaUrl(newsHeroUrl) || newsHeroUrl)) || '';

  const handlePageBannerUpload = async (which, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const key = which === 'about' ? 'about-hero' : which === 'news' ? 'news-hero' : 'contact-hero';
    setUploadingKey(key);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (url) {
        if (which === 'about') setAboutHeroUrl(url);
        else if (which === 'news') setNewsHeroUrl(url);
        else setContactHeroUrl(url);
      }
      toast.success('Image uploaded — click Save page banners to apply');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleAboutMissionUpload = async (index, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingKey(`about-mission-${index}`);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (url) {
        setAboutMissionImages((prev) => {
          const next = [...prev];
          next[index] = url;
          return next;
        });
      }
      toast.success('Image uploaded — click Save page banners to apply');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSavePageBanners = async () => {
    setSavingPageBanners(true);
    try {
      const missionPayload = aboutMissionImages
        .map((u) => String(u ?? '').trim())
        .filter(Boolean);
      await adminAPI.updateSiteSettings({
        newsHeroImage: (newsHeroUrl || '').trim(),
        aboutHeroImage: (aboutHeroUrl || '').trim(),
        contactHeroImage: (contactHeroUrl || '').trim(),
        aboutMissionImages: missionPayload,
      });
      toast.success('Page banners saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingPageBanners(false);
    }
  };

  const handleHomeSlideUpload = async (slideIndex, e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingKey(`home-slide-${slideIndex}`);
    try {
      const res = await uploadAdminImage(file);
      const url = res?.data?.url;
      if (url) {
        setHomeSlides((prev) =>
          prev.map((s, j) => (j === slideIndex ? { ...s, imageUrl: url } : s))
        );
      }
      toast.success('Image uploaded — click Save home carousel to apply');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSaveHomeHero = async () => {
    setSavingHomeHero(true);
    try {
      const payload = homeSlides
        .map((s) => ({
          imageUrl: (s.imageUrl || '').trim(),
          headline: (s.headline || '').trim(),
          headlineLine2: (s.headlineLine2 || '').trim(),
          subhead: (s.subhead || '').trim(),
        }))
        .filter((s) => s.imageUrl);
      await adminAPI.updateSiteSettings({ homeHeroSlides: payload });
      toast.success('Home page carousel saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingHomeHero(false);
    }
  };

  const saveButton = tab === 'cities' ? (
    <Button
      onClick={handleSaveCities}
      disabled={saving}
      className="bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm"
      data-testid="admin-city-images-save-btn"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Save city images
    </Button>
  ) : tab === 'categories' ? (
    <Button
      onClick={handleSaveCategories}
      disabled={saving}
      className="bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm"
      data-testid="admin-category-images-save-btn"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Save category images
    </Button>
  ) : tab === 'pageBanners' ? (
    <Button
      onClick={handleSavePageBanners}
      disabled={savingPageBanners}
      className="bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm"
      data-testid="admin-page-banners-save-btn"
    >
      {savingPageBanners ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Save page banners
    </Button>
  ) : (
    <Button
      onClick={handleSaveHomeHero}
      disabled={savingHomeHero}
      className="bg-spruce-700 hover:bg-spruce-800 text-white shadow-sm"
      data-testid="admin-home-hero-save-btn"
    >
      {savingHomeHero ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
      Save home carousel
    </Button>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-city-images-section">
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm w-full">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-4 xl:gap-6 xl:items-start">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Image className="w-5 h-5 text-spruce-700 shrink-0" />
              Images
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Set images via URL or upload. City/category cards are wider on large screens. News / About / Contact banners
              live under <strong className="font-medium text-slate-800">Page banners</strong>. The home page rotating hero is
              under <strong className="font-medium text-slate-800">Home page</strong>. You can also edit News copy under{' '}
              <span className="font-medium text-slate-800">Admin → News</span>.
            </p>
          </div>
          <div className="flex flex-row flex-nowrap gap-2 shrink-0 overflow-x-auto pb-1 xl:pb-0 xl:justify-end xl:max-w-none">
            <Button
              type="button"
              variant={tab === 'cities' ? 'default' : 'outline'}
              className={`shrink-0 ${tab === 'cities' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'}`}
              onClick={() => setTab('cities')}
              data-testid="admin-city-images-tab"
            >
              Cities
            </Button>
            <Button
              type="button"
              variant={tab === 'categories' ? 'default' : 'outline'}
              className={`shrink-0 ${
                tab === 'categories' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'
              }`}
              onClick={() => setTab('categories')}
              data-testid="admin-category-images-tab"
            >
              Categories
            </Button>
            <Button
              type="button"
              variant={tab === 'pageBanners' ? 'default' : 'outline'}
              className={`shrink-0 ${
                tab === 'pageBanners' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'
              }`}
              onClick={() => setTab('pageBanners')}
              data-testid="admin-page-banners-tab"
            >
              Page banners
            </Button>
            <Button
              type="button"
              variant={tab === 'home' ? 'default' : 'outline'}
              className={`shrink-0 ${tab === 'home' ? 'bg-spruce-700 hover:bg-spruce-800 text-white' : 'border-slate-200'}`}
              onClick={() => setTab('home')}
              data-testid="admin-home-hero-tab"
            >
              Home page
            </Button>
          </div>
        </div>
      </div>

      {tab === 'cities' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {CITIES.map((city) => {
              const key = city.toLowerCase();
              const currentInput = cityValues?.[key] ?? '';
              const previewSrc = getCityImageUrl(city, effectiveCityOverrides);

              return (
                <div key={city} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{city}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Preview</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-spruce-700" aria-hidden />
                    </div>
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50 h-28">
                    <img src={previewSrc} className="w-full h-full object-cover" alt="" loading="lazy" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">Image URL (optional)</label>
                    <Input
                      value={currentInput}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCityValues((prev) => ({ ...prev, [key]: next }));
                      }}
                      placeholder="Paste image link (leave empty for default)"
                      className="h-10"
                      data-testid={`admin-city-image-${key}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">Upload image (optional)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-slate-600"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload('cities', key, file);
                        }}
                        disabled={uploadingKey === `cities:${key}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">{saveButton}</div>
        </>
      ) : tab === 'categories' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            {CATEGORIES.map((cat) => {
              const currentInput = categoryValues?.[cat.id] ?? '';
              const previewSrc = categoryValues?.[cat.id] ? currentInput : defaultCategoryImageSrc(cat.id);

              return (
                <div key={cat.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{cat.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Preview</p>
                    </div>
                  </div>

                  <div className="relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50 h-28">
                    <img src={previewSrc} className="w-full h-full object-cover" alt="" loading="lazy" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">Image URL (optional)</label>
                    <Input
                      value={currentInput}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCategoryValues((prev) => ({ ...prev, [cat.id]: next }));
                      }}
                      placeholder="Paste image link (leave empty for default)"
                      className="h-10"
                      data-testid={`admin-category-image-${cat.id}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">Upload image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-600"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload('categories', cat.id, file);
                      }}
                      disabled={uploadingKey === `categories:${cat.id}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">{saveButton}</div>
        </>
      ) : tab === 'pageBanners' ? (
        <>
          <p className="text-sm text-slate-600 mb-4 max-w-4xl">
            Full-width backgrounds for News, About, and Contact page headers. Leave empty to use each page default. Headline
            text for News is also under Admin → News (Banner &amp; page tab). Mission images for the About page body are below.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              {
                key: 'news',
                title: 'News page',
                heroUrl: newsHeroUrl,
                setHeroUrl: setNewsHeroUrl,
                preview: newsHeroPreview,
                placeholder: 'Default site background',
              },
              {
                key: 'about',
                title: 'About page',
                heroUrl: aboutHeroUrl,
                setHeroUrl: setAboutHeroUrl,
                preview: aboutHeroPreview,
                placeholder: 'Solid spruce background',
              },
              {
                key: 'contact',
                title: 'Contact page',
                heroUrl: contactHeroUrl,
                setHeroUrl: setContactHeroUrl,
                preview: contactHeroPreview,
                placeholder: 'Solid white / default header',
              },
            ].map((row) => (
              <div key={row.key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 min-w-0">
                <p className="font-semibold text-slate-900">{row.title}</p>
                <div className="relative rounded-lg overflow-hidden border border-slate-100 aspect-[21/9] max-h-44 bg-slate-100">
                  {row.preview ? (
                    <img src={row.preview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 px-4 text-center">
                      {row.placeholder}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Image URL (optional)</label>
                  <Input
                    value={row.heroUrl}
                    onChange={(e) => row.setHeroUrl(e.target.value)}
                    className="mt-1 h-10"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Upload</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-slate-600"
                    onChange={(e) =>
                      handlePageBannerUpload(row.key === 'about' ? 'about' : row.key === 'news' ? 'news' : 'contact', e)
                    }
                    disabled={
                      uploadingKey ===
                      (row.key === 'about' ? 'about-hero' : row.key === 'news' ? 'news-hero' : 'contact-hero')
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-10 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-1">About page — mission images</h3>
            <p className="text-sm text-slate-600 mb-4 max-w-3xl">
              Shown beside “What Makes Us Different” on the About page. Add multiple URLs for a rotating gallery. Leave all
              empty to keep the built-in default image.
            </p>
            <div className="space-y-4 max-w-2xl">
              {aboutMissionImages.map((url, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">Image {i + 1}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200"
                      disabled={aboutMissionImages.length <= 1}
                      onClick={() =>
                        setAboutMissionImages((prev) =>
                          prev.length <= 1 ? [''] : prev.filter((_, j) => j !== i)
                        )
                      }
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-slate-100 aspect-[4/3] max-h-52 bg-slate-100">
                    {url?.trim() ? (
                      <img
                        src={resolveMediaUrl(url.trim()) || url.trim()}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                        No image yet
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Image URL</label>
                    <Input
                      value={url}
                      onChange={(e) => {
                        const v = e.target.value;
                        setAboutMissionImages((prev) => prev.map((u, j) => (j === i ? v : u)));
                      }}
                      className="mt-1 h-10"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700">Upload</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 block w-full text-sm text-slate-600"
                      onChange={(e) => handleAboutMissionUpload(i, e)}
                      disabled={uploadingKey === `about-mission-${i}`}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-200"
                onClick={() => setAboutMissionImages((prev) => [...prev, ''])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add image
              </Button>
            </div>
          </div>

          <div className="flex justify-end mt-8">{saveButton}</div>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600 mb-4 max-w-3xl">
            Add one or more slides. Each slide needs an image; optional headline lines and subheading show over the image. Slides
            cross-fade on the home page with dot controls (and auto-advance). If none are saved, the site uses a built-in
            default.
          </p>
          <div className="space-y-6 max-w-4xl">
            {homeSlides.map((slide, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Slide {i + 1}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200"
                    disabled={homeSlides.length <= 1}
                    onClick={() => setHomeSlides((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
                <div className="relative rounded-lg overflow-hidden border border-slate-100 aspect-[21/9] max-h-48 bg-slate-100">
                  {slide.imageUrl ? (
                    <img
                      src={resolveMediaUrl(slide.imageUrl) || slide.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">No image yet</div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <Label>Image URL</Label>
                    <Input
                      value={slide.imageUrl}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHomeSlides((prev) => prev.map((s, j) => (j === i ? { ...s, imageUrl: v } : s)));
                      }}
                      className="mt-1"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Headline (line 1)</Label>
                    <Input
                      value={slide.headline}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHomeSlides((prev) => prev.map((s, j) => (j === i ? { ...s, headline: v } : s)));
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Headline (line 2)</Label>
                    <Input
                      value={slide.headlineLine2}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHomeSlides((prev) => prev.map((s, j) => (j === i ? { ...s, headlineLine2: v } : s)));
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Subheading</Label>
                    <Textarea
                      rows={2}
                      value={slide.subhead}
                      onChange={(e) => {
                        const v = e.target.value;
                        setHomeSlides((prev) => prev.map((s, j) => (j === i ? { ...s, subhead: v } : s)));
                      }}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Upload image</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 block w-full text-sm text-slate-600"
                    onChange={(e) => handleHomeSlideUpload(i, e)}
                    disabled={uploadingKey === `home-slide-${i}`}
                  />
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="border-spruce-200"
              onClick={() => setHomeSlides((prev) => [...prev, emptyHomeSlide()])}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add slide
            </Button>
          </div>
          <div className="flex justify-end mt-6">{saveButton}</div>
        </>
      )}
    </div>
  );
}

