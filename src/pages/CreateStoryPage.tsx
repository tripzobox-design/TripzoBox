import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Sparkles, Eye, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDiary } from '../context/DiaryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';

export const CreateStoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { entries, publishStory } = useDiary();
  const { success } = useToast();

  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>(
    entries.length > 0 ? [entries[0].id] : []
  );
  const [title, setTitle] = useState('My Unforgettable Western Ghats Journey');
  const [destination, setDestination] = useState('Munnar & Varkala, Kerala');
  const [dates, setDates] = useState('May 2025');
  const [summary, setSummary] = useState(
    'From early misty mornings in Lockhart tea plantations to crimson sunsets over Varkala cliffs, here is how we explored Kerala with a small group of travellers.'
  );
  const [readTimeMins, setReadTimeMins] = useState(5);

  const toggleEntrySelection = (id: string) => {
    setSelectedEntryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim() || !summary.trim()) return;

    const chosenEntries = entries.filter((e) => selectedEntryIds.includes(e.id));
    const coverImageUrl =
      chosenEntries[0]?.photos[0] ||
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80';

    const newStory = publishStory({
      title: title.trim(),
      destination: destination.trim(),
      dates: dates.trim(),
      summary: summary.trim(),
      fullContent: chosenEntries.map((e) => e.text),
      coverImageUrl,
      galleryImages: chosenEntries.flatMap((e) => e.photos).slice(0, 3),
      entries: chosenEntries,
      readTimeMins,
    });

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    success(`Story "${title}" is now published to the public community!`, 'Story Live');
    navigate(`/stories/${newStory.slug}`);
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto">
      <div>
        <Link
          to="/app/diary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Travel Diary</span>
        </Link>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text">
          Compose Travel Story
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Turn your private diary experiences into an inspiring, practical travel story for fellow travellers.
        </p>
      </div>

      <form onSubmit={handlePublish} className="space-y-6">
        {/* Step A: Select Diary Entries */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-text">
              1. Select Experiences to Include ({selectedEntryIds.length} selected)
            </h3>
            <span className="text-xs text-text-muted">
              Private entries become public in this story
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {entries.map((entry) => {
              const isSelected = selectedEntryIds.includes(entry.id);
              return (
                <div
                  key={entry.id}
                  onClick={() => toggleEntrySelection(entry.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-primary bg-accent/20'
                      : 'border-border bg-light-bg hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      {entry.photos[0] ? (
                        <img src={entry.photos[0]} alt={entry.place} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-primary">
                          {entry.place[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-text truncate">{entry.place}</p>
                      <p className="text-[11px] text-text-muted truncate">{entry.category} · {entry.date}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      isSelected ? 'bg-primary text-white' : 'border border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step B: Story Narrative Details */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
          <h3 className="font-heading font-bold text-base text-text">
            2. Story Details & Summary
          </h3>

          <Input
            label="Story Title *"
            placeholder="e.g. Exploring God’s Own Country"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Destination *"
              placeholder="e.g. Munnar, Kerala"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <Input
              label="Travel Dates / Duration"
              placeholder="e.g. 15-20 May 2025"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
            />
          </div>

          <Textarea
            label="Story Intro / Executive Summary *"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Give travellers a quick overview of why this trip was special, key tips, and itinerary highlights..."
            required
          />
        </div>

        {/* Step C: Preview & Publish */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle flex items-center justify-between gap-4">
          <div className="text-xs text-text-muted">
            <span className="font-semibold text-text block">Preview and Publish</span>
            Your story will be visible to the public community on the Explore and Stories feeds.
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => navigate('/app/diary')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={<Sparkles className="w-4 h-4" />}
              className="font-semibold px-6 shadow-hover"
            >
              Publish Story
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
