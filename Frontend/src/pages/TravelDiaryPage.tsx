import { confirmAction } from '../lib/confirmAction';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Globe, Lock, Sparkles } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
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
  const { entries, stories, deleteEntry, updateEntry } = useDiary();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<'entries' | 'stories'>('entries');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

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
    <div className="flex flex-col gap-6 text-left max-w-5xl mx-auto">
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

      {/* 2. SUB-TABS (Matching Reference Screen 8: My Entries vs Published Stories) */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => setActiveTab('entries')}
          className={`relative px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === 'entries'
              ? 'bg-white text-primary shadow-subtle border border-border border-b-2 border-b-primary font-bold'
              : 'bg-white/60 text-text-muted hover:text-text hover:bg-white border border-border/60'
          }`}
        >
          My Entries
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stories')}
          className={`relative px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === 'stories'
              ? 'bg-white text-primary shadow-subtle border border-border border-b-2 border-b-primary font-bold'
              : 'bg-white/60 text-text-muted hover:text-text hover:bg-white border border-border/60'
          }`}
        >
          Published Stories
        </button>
      </div>

      {/* 3. SUB-TAB CONTENT */}
      {activeTab === 'entries' ? (
        <div className="space-y-4">
          <div className="bg-light-bg rounded-xl p-3.5 border border-border flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-text-subtle" />
              Entries are private by default until you compose and publish them into a story.
            </span>
            <span className="font-semibold text-text">{entries.length} memories recorded</span>
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
      ) : (
        <div className="space-y-6">
          <p className="text-xs sm:text-sm text-text-muted">
            Stories you have published for the global Tripzobox community:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}

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
