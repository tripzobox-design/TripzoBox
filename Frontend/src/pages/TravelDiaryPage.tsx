import { confirmAction } from '../lib/confirmAction';
import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Plus, BookOpen, Globe, Lock, Sparkles, Search } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { DiaryEntryCard } from '../components/feature/DiaryEntryCard';
import { StoryCard } from '../components/feature/StoryCard';
import { DiaryEntry } from '../types';
import { Modal } from '../components/ui/Modal';
import { Input, Textarea, Select } from '../components/ui/Input';

export const TravelDiaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { entries, stories, deleteEntry, updateEntry } = useDiary();
  const { success } = useToast();

  const paramTab = searchParams.get('tab');
  const initialTab =
    paramTab === 'travel-stories' || paramTab === 'travel_stories' || paramTab === 'stories'
      ? 'travel-stories'
      : paramTab === 'published' || paramTab === 'mine'
      ? 'published'
      : 'entries';

  const [activeTab, setActiveTab] = useState<'entries' | 'travel-stories' | 'published'>(initialTab);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  // Search & category filter inside Travel Stories tab
  const [storySearch, setStorySearch] = useState('');
  const [storyCategory, setStoryCategory] = useState('All');

  // Sync tab with URL
  React.useEffect(() => {
    if (paramTab === 'travel-stories' || paramTab === 'travel_stories' || paramTab === 'stories') {
      setActiveTab('travel-stories');
    } else if (paramTab === 'published' || paramTab === 'mine') {
      setActiveTab('published');
    } else if (paramTab === 'entries') {
      setActiveTab('entries');
    }
  }, [paramTab]);

  const handleTabChange = (tab: 'entries' | 'travel-stories' | 'published') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const myStories = stories.filter(
    (s) =>
      s.author.name === user?.name ||
      s.author.username === user?.username ||
      s.author.name.toLowerCase() === (user?.name || '').toLowerCase()
  );

  const filteredTravelStories = stories.filter((story) => {
    const matchesSearch =
      !storySearch.trim() ||
      story.title.toLowerCase().includes(storySearch.toLowerCase()) ||
      story.destination.toLowerCase().includes(storySearch.toLowerCase()) ||
      story.author.name.toLowerCase().includes(storySearch.toLowerCase());
    const matchesCategory =
      storyCategory === 'All' ||
      (story.tags && story.tags.some((t) => t.toLowerCase() === storyCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  // Edit form state
  const [editPlace, setEditPlace] = useState('');
  const [editCategory, setEditCategory] = useState<DiaryEntry['category']>('Nature');
  const [editText, setEditText] = useState('');

  const tabs = [
    { id: 'entries', label: 'My Entries', badge: entries.length },
    { id: 'stories', label: 'Published Stories', badge: stories.length },
  ];

  const handleOpenEdit = async (entry: DiaryEntry) => {
    if (!await confirmAction('edit', 'this experience')) return;
    setEditingEntry(entry);
    setEditPlace(entry.place);
    setEditCategory(entry.category);
    setEditText(entry.text);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    updateEntry(editingEntry.id, {
      place: editPlace,
      category: editCategory,
      text: editText,
    });

    success('Diary entry updated!');
    setEditingEntry(null);
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-7xl 2xl:max-w-[1536px] mx-auto">
      {/* 1. HEADER (Matching Screen 8) */}
      <div className="flex items-center justify-between gap-3 pb-0 sm:pb-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading font-bold text-xl sm:text-3xl text-text">
            My Travel Diary
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Record your journey, collect memories, inspire others.
          </p>
        </div>

        <div className="flex shrink-0 items-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/app/diary/add')}
            icon={<Plus className="w-4 h-4" />}
            className="!rounded-full !min-h-[40px] !gap-1.5 !px-3 sm:!px-4 !text-xs sm:!text-sm !font-semibold whitespace-nowrap shadow-subtle hover:shadow-hover border border-emerald-600/20"
            aria-label="Add experience"
          >
            <span className="sm:hidden">Add entry</span><span className="hidden sm:inline">Add Experience</span>
          </Button>
        </div>
      </div>

      {/* 2. SUB-TABS (My Entries vs Travel Stories vs Published Stories) */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => handleTabChange('entries')}
          className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'entries'
              ? 'bg-white text-primary shadow-subtle border border-border border-b-2 border-b-primary font-bold'
              : 'bg-white/60 text-text-muted hover:text-text hover:bg-white border border-border/60'
          }`}
        >
          My Entries ({entries.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('travel-stories')}
          className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'travel-stories'
              ? 'bg-white text-primary shadow-subtle border border-border border-b-2 border-b-primary font-bold'
              : 'bg-white/60 text-text-muted hover:text-text hover:bg-white border border-border/60'
          }`}
        >
          Travel Stories ({stories.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('published')}
          className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 cursor-pointer ${
            activeTab === 'published'
              ? 'bg-white text-primary shadow-subtle border border-border border-b-2 border-b-primary font-bold'
              : 'bg-white/60 text-text-muted hover:text-text hover:bg-white border border-border/60'
          }`}
        >
          Published Stories ({myStories.length})
        </button>
      </div>

      {/* 3. SUB-TAB CONTENT */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          <div className="bg-light-bg rounded-xl p-3.5 border border-border flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-text-subtle" />
              Entries are private by default until you compose and publish them into a story.
            </span>
            <span className="font-semibold text-text shrink-0 ml-2">{entries.length} memories</span>
          </div>

          <div className="space-y-3.5">
            {entries.map((entry) => (
              <DiaryEntryCard
                key={entry.id}
                entry={entry}
                onEdit={handleOpenEdit}
                onDelete={async (id) => {
                  if (!await confirmAction('delete', 'this diary entry')) return;
                  deleteEntry(id);
                  success('Entry deleted.');
                }}
                onAddToStory={() => {
                  navigate('/app/diary/create-story');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'travel-stories' && (
        <div className="space-y-4">
          {/* Header banner */}
          <div className="bg-light-bg rounded-2xl p-4 sm:p-5 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-900 block">
                  Community Travel Stories
                </span>
                <span className="text-xs text-gray-500">
                  Real itineraries, photo memories & recommendations from verified travellers.
                </span>
              </div>
            </div>
            <Link
              to="/stories"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs shrink-0 self-start sm:self-auto"
            >
              <span>Explore stories directory</span>
              <Globe className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Search bar & Category filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search stories, destinations, authors..."
                value={storySearch}
                onChange={(e) => setStorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-border text-xs sm:text-sm text-text focus:outline-none focus:border-primary shadow-2xs transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {['All', 'Nature', 'Beach', 'Culture', 'Adventure', 'Food'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setStoryCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    storyCategory === cat
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-white text-text-muted hover:text-text border border-border hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stories List */}
          <div className="space-y-3 sm:space-y-3.5">
            {filteredTravelStories.length > 0 ? (
              filteredTravelStories.map((story) => (
                <StoryCard key={story.id} story={story} variant="horizontal" />
              ))
            ) : (
              <div className="p-8 text-center bg-light-bg rounded-2xl border border-border text-xs sm:text-sm text-text-muted">
                <p className="font-semibold text-gray-700">No travel stories match your search</p>
                <p className="text-xs text-gray-400 mt-1">Try searching another destination or category</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'published' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-text-muted">
              Stories you have composed and published for the global Tripzobox community:
            </p>
            <button
              type="button"
              onClick={() => navigate('/app/diary/create-story')}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              + New Story
            </button>
          </div>
          <div className="space-y-3 sm:space-y-3.5">
            {myStories.length > 0 ? (
              myStories.map((story) => (
                <StoryCard key={story.id} story={story} variant="horizontal" />
              ))
            ) : (
              <div className="p-8 text-center bg-light-bg rounded-2xl border border-border text-xs sm:text-sm text-text-muted">
                <p className="font-semibold text-gray-700">You haven't composed a public story yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/app/diary/create-story')}
                  className="inline-block mt-2 font-semibold text-primary underline"
                >
                  Compose your first story &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Compose Story FAB — mobile only, above bottom nav */}
      <button
        type="button"
        onClick={() => navigate('/app/diary/create-story')}
        className="fixed bottom-20 right-4 lg:hidden z-40 flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-semibold text-sm px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
        aria-label="Compose Story"
      >
        <Plus className="w-5 h-5" />
        <span>Compose Story</span>
      </button>

      {/* EDIT MODAL */}
      {editingEntry && (
        <Modal
          isOpen={true}
          onClose={() => setEditingEntry(null)}
          title="Edit Experience"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <Input
              label="Place Name"
              value={editPlace}
              onChange={(e) => setEditPlace(e.target.value)}
              required
            />
            <Select
              label="Category"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as any)}
              options={[
                { label: 'Nature', value: 'Nature' },
                { label: 'Food', value: 'Food' },
                { label: 'Culture', value: 'Culture' },
                { label: 'Beach', value: 'Beach' },
                { label: 'Adventure', value: 'Adventure' },
                { label: 'Other', value: 'Other' },
              ]}
            />
            <Textarea
              label="Write your experience"
              rows={4}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setEditingEntry(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
