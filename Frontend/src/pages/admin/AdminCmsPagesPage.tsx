import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  HelpCircle,
  Mail,
  Shield,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { adminApi } from '../../lib/adminApi';
import { CMSContent } from '../../types/admin';
import { AdminTableSkeleton } from '../../components/admin/AdminEmptyState';

export const AdminCmsPagesPage: React.FC = () => {
  const [content, setContent] = useState<CMSContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'about' | 'contact' | 'faqs' | 'legal'>('about');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await adminApi.cms.getContent('main_cms');
      setContent(data);
    } catch (e: any) {
      setAlertMsg('Failed to load CMS pages: ' + e?.message);
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
    try {
      const updated = await adminApi.cms.updateContent(content);
      setContent(updated);
      setAlertMsg('Page content updated and published dynamically!');
    } catch (err: any) {
      alert('Failed to save page content: ' + err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = () => {
    if (!content) return;
    const newFaq = {
      id: `faq_${Date.now()}`,
      category: 'General',
      question: 'New Question',
      answer: 'Answer content goes here...',
      displayOrder: (content.faqs?.length || 0) + 1,
    };
    setContent({
      ...content,
      faqs: [...(content.faqs || []), newFaq],
    });
  };

  const handleRemoveFaq = (idx: number) => {
    if (!content) return;
    const updated = [...(content.faqs || [])];
    updated.splice(idx, 1);
    setContent({ ...content, faqs: updated });
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
            Website Pages & FAQ Content CMS
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Dynamically edit About Us, Support Contacts, FAQs, Guidelines, and Legal Policies.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Publishing...' : 'Save & Publish All'}
        </button>
      </div>

      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {alertMsg}
          </span>
          <button onClick={() => setAlertMsg(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { id: 'about', label: 'About Us Page' },
          { id: 'contact', label: 'Contact & Support' },
          { id: 'faqs', label: `FAQs (${content.faqs?.length || 0})` },
          { id: 'legal', label: 'Terms, Privacy & Rules' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeSection === sec.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* About Us Page */}
        {activeSection === 'about' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">About Us Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Page Title</label>
                <input
                  type="text"
                  value={content.aboutUs?.title || ''}
                  onChange={(e) =>
                    setContent({ ...content, aboutUs: { ...content.aboutUs, title: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Subtitle / Slogan</label>
                <input
                  type="text"
                  value={content.aboutUs?.subtitle || ''}
                  onChange={(e) =>
                    setContent({ ...content, aboutUs: { ...content.aboutUs, subtitle: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Mission Statement</label>
                <textarea
                  rows={3}
                  value={content.aboutUs?.mission || ''}
                  onChange={(e) =>
                    setContent({ ...content, aboutUs: { ...content.aboutUs, mission: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">The TripzoBox Story</label>
                <textarea
                  rows={4}
                  value={content.aboutUs?.story || ''}
                  onChange={(e) =>
                    setContent({ ...content, aboutUs: { ...content.aboutUs, story: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {activeSection === 'contact' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Contact & Support Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">General Inquiries Email</label>
                <input
                  type="email"
                  value={content.contactInfo?.email || ''}
                  onChange={(e) =>
                    setContent({ ...content, contactInfo: { ...content.contactInfo, email: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Support / Safety Helpline Email</label>
                <input
                  type="email"
                  value={content.contactInfo?.supportEmail || ''}
                  onChange={(e) =>
                    setContent({ ...content, contactInfo: { ...content.contactInfo, supportEmail: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Support Phone Helpline</label>
                <input
                  type="text"
                  value={content.contactInfo?.phone || ''}
                  onChange={(e) =>
                    setContent({ ...content, contactInfo: { ...content.contactInfo, phone: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Support Operating Hours</label>
                <input
                  type="text"
                  value={content.contactInfo?.supportHours || ''}
                  onChange={(e) =>
                    setContent({ ...content, contactInfo: { ...content.contactInfo, supportHours: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">Registered HQ Address</label>
                <input
                  type="text"
                  value={content.contactInfo?.address || ''}
                  onChange={(e) =>
                    setContent({ ...content, contactInfo: { ...content.contactInfo, address: e.target.value } })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </div>
        )}

        {/* FAQs Manager */}
        {activeSection === 'faqs' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
              <button
                type="button"
                onClick={handleAddFaq}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>

            <div className="space-y-4">
              {(content.faqs || []).map((faq, idx) => (
                <div key={faq.id || idx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(idx)}
                      className="text-red-500 hover:text-red-700 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Category</label>
                      <input
                        type="text"
                        value={faq.category}
                        onChange={(e) => {
                          const updated = [...content.faqs];
                          updated[idx].category = e.target.value;
                          setContent({ ...content, faqs: updated });
                        }}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-semibold text-slate-600 mb-1">Question</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...content.faqs];
                          updated[idx].question = e.target.value;
                          setContent({ ...content, faqs: updated });
                        }}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-white font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Answer</label>
                    <textarea
                      rows={2}
                      value={faq.answer}
                      onChange={(e) => {
                        const updated = [...content.faqs];
                        updated[idx].answer = e.target.value;
                        setContent({ ...content, faqs: updated });
                      }}
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legal Policies & Rules */}
        {activeSection === 'legal' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-3 text-xs">
              <h3 className="text-base font-bold text-slate-900">Terms and Conditions</h3>
              <textarea
                rows={6}
                value={content.termsAndConditions || ''}
                onChange={(e) => setContent({ ...content, termsAndConditions: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs"
              />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-3 text-xs">
              <h3 className="text-base font-bold text-slate-900">Privacy Policy</h3>
              <textarea
                rows={6}
                value={content.privacyPolicy || ''}
                onChange={(e) => setContent({ ...content, privacyPolicy: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs"
              />
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-subtle space-y-3 text-xs">
              <h3 className="text-base font-bold text-slate-900">Community & Safety Guidelines</h3>
              <textarea
                rows={6}
                value={content.communityGuidelines || ''}
                onChange={(e) => setContent({ ...content, communityGuidelines: e.target.value })}
                className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

