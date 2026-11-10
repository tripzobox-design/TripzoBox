import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Save,
  Eye,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { CMSContent } from '../../types/admin';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminCmsHomepagePage: React.FC = () => {
  const [content, setContent] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await adminApi.cms.getContent('main_cms');
      setContent(data);
    } catch (e: any) {
      setFeedback('Failed to load CMS content: ' + e?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await adminApi.cms.updateContent(content);
      setContent(updated);
      setFeedback('Homepage CMS content saved and published to live website!');
    } catch (err: any) {
      alert('Failed to publish CMS content: ' + err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return <AdminTableSkeleton rows={8} />;
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
            Homepage Content Management (CMS)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Edit live hero headlines, promotional banners, and section visibility without touching code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'editor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Live Preview
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Publishing...' : 'Publish to Live'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {activeTab === 'editor' ? (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Hero Section Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Hero Header & Tagline</h3>
                <p className="text-xs text-slate-500">The primary above-the-fold banner presented to all visitors.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Badge Text (Top Pill)
                </label>
                <input
                  type="text"
                  value={content.hero.badgeText}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, badgeText: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hero Background Image URL
                </label>
                <input
                  type="text"
                  value={content.hero.bgImageUrl}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, bgImageUrl: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headline Line 1
                </label>
                <input
                  type="text"
                  value={content.hero.headingLine1}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, headingLine1: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Headline Line 2
                </label>
                <input
                  type="text"
                  value={content.hero.headingLine2}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, headingLine2: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Heading Highlighted Word (Emerald Gradient)
                </label>
                <input
                  type="text"
                  value={content.hero.headingHighlight}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, headingHighlight: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Hero Description Paragraph
                </label>
                <textarea
                  rows={3}
                  value={content.hero.description}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, description: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary CTA Text
                </label>
                <input
                  type="text"
                  value={content.hero.primaryCtaText}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, primaryCtaText: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Primary CTA Destination Link
                </label>
                <input
                  type="text"
                  value={content.hero.primaryCtaLink}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, primaryCtaLink: e.target.value } })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Promotional Banner Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Promotional Top Announcement Bar</h3>
                <p className="text-xs text-slate-500">Notice ribbon at the very top of the public interface.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={content.promotionalBanner?.enabled}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      promotionalBanner: { ...content.promotionalBanner, enabled: e.target.checked },
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Banner Text
                </label>
                <input
                  type="text"
                  value={content.promotionalBanner?.text || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      promotionalBanner: { ...content.promotionalBanner, text: e.target.value },
                    })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Banner Link Text
                </label>
                <input
                  type="text"
                  value={content.promotionalBanner?.linkText || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      promotionalBanner: { ...content.promotionalBanner, linkText: e.target.value },
                    })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Banner Destination URL
                </label>
                <input
                  type="text"
                  value={content.promotionalBanner?.linkUrl || ''}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      promotionalBanner: { ...content.promotionalBanner, linkUrl: e.target.value },
                    })
                  }
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section Visibility Switches */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Homepage Module Visibility Toggles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'hero', label: 'Hero Header' },
                { key: 'quickStats', label: 'Platform Stats Bar' },
                { key: 'featuredDestinations', label: 'Featured Destinations' },
                { key: 'trendingTrips', label: 'Trending Trips Showcase' },
                { key: 'safetyVault', label: 'Travel Vault Feature Card' },
                { key: 'diaryStories', label: 'Travel Diary Experiences' },
                { key: 'reviews', label: 'Traveller Reviews Section' },
              ].map(({ key, label }) => {
                const isChecked = (content.sectionVisibility as any)?.[key] !== false;
                return (
                  <label
                    key={key}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                  >
                    <span className="text-xs font-bold text-slate-800">{label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          sectionVisibility: {
                            ...content.sectionVisibility,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </form>
      ) : (
        /* Live Preview Pane */
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-subtle space-y-8">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between">
            <span>Visual simulation of how the homepage hero will appear with current CMS parameters.</span>
            <Link to="/" target="_blank" className="font-bold underline flex items-center gap-1">
              Visit Live Site <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Simulated Hero */}
          <div className="relative rounded-3xl overflow-hidden min-h-[380px] bg-slate-950 p-8 sm:p-12 flex flex-col justify-center text-center">
            {content.hero.bgImageUrl && (
              <img
                src={content.hero.bgImageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )}
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                {content.hero.badgeText}
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight leading-tight">
                {content.hero.headingLine1} {content.hero.headingLine2}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  {content.hero.headingHighlight}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
                {content.hero.description}
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30"
                >
                  {content.hero.primaryCtaText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

