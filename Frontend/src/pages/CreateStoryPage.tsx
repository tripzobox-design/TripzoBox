import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Check, Sparkles, Eye, MapPin, Search, X, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useDiary } from '../context/DiaryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
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

  const [pickerOpen, setPickerOpen] = useState(false);
  const [entryQuery, setEntryQuery] = useState('');
  const [entryPage, setEntryPage] = useState(0);
  const selectedEntries = entries.filter((entry) => selectedEntryIds.includes(entry.id));
  const matchingEntries = entries.filter((entry) => `${entry.place} ${entry.category} ${entry.date}`.toLowerCase().includes(entryQuery.trim().toLowerCase()));
  const pageSize = 5;
  const pageEntries = matchingEntries.slice(entryPage * pageSize, (entryPage + 1) * pageSize);
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
    <div className="flex flex-col gap-3 lg:gap-6 text-left max-w-4xl mx-auto">
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

      <form onSubmit={handlePublish} className="space-y-4 lg:space-y-6">
        <section className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-subtle space-y-3" aria-labelledby="selected-experiences-title">
          <div className="flex items-center justify-between gap-3"><h2 id="selected-experiences-title" className="font-heading font-bold text-base text-text">1. Your experiences</h2><span className="text-xs font-semibold text-primary shrink-0">{selectedEntries.length} selected</span></div>
          <p className="text-xs text-text-muted">Choose diary entries to include. Selected private entries become public when you publish.</p>
          <Button type="button" variant="secondary" icon={<Search className="w-4 h-4" />} onClick={() => setPickerOpen(true)} className="w-full justify-start">Search & select experiences</Button>
          {selectedEntries.length > 0 ? <div className="flex flex-wrap gap-2">{selectedEntries.slice(0, 3).map((entry) => <div key={entry.id} className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 py-1 pl-2 pr-1 min-w-0 max-w-full"><span className="text-xs font-semibold text-primary truncate">{entry.place}</span><button type="button" aria-label={`Remove ${entry.place} from story`} onClick={() => toggleEntrySelection(entry.id)} className="rounded-full p-1.5 hover:bg-emerald-100 shrink-0"><X className="w-3 h-3 text-primary" /></button></div>)}{selectedEntries.length > 3 && <button type="button" onClick={() => setPickerOpen(true)} className="text-xs font-semibold text-primary">+{selectedEntries.length - 3} more</button>}</div> : <p className="text-xs text-text-muted">No experiences selected yet.</p>}
        </section>
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
        <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-text-muted">
            <span className="font-semibold text-text block">Preview and Publish</span>
            Your story will be visible to the public community on the Explore and Stories feeds.
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto shrink-0">
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
      <Drawer isOpen={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose experiences" description="Search your diary and select the moments to include." closeLabel="Close experience picker" footer={<Button type="button" className="w-full" onClick={() => setPickerOpen(false)}>Use {selectedEntries.length} {selectedEntries.length === 1 ? 'experience' : 'experiences'}</Button>}>
        <div className="space-y-4">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-light-bg px-3 py-3"><Search className="w-4 h-4 text-primary shrink-0" /><input type="search" value={entryQuery} onChange={(event) => { setEntryQuery(event.target.value); setEntryPage(0); }} aria-label="Search diary experiences" placeholder="Search place, category, or date..." className="w-full min-w-0 bg-transparent outline-none text-sm" /></label>
          <p className="text-xs text-text-muted" role="status">{matchingEntries.length} experiences found · {selectedEntries.length} selected</p>
          <div className="space-y-2">{pageEntries.map((entry) => {
            const chosen = selectedEntryIds.includes(entry.id);
            return <button key={entry.id} type="button" aria-pressed={chosen} onClick={() => toggleEntrySelection(entry.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${chosen ? 'border-primary bg-emerald-50' : 'border-border bg-white hover:bg-light-bg'}`}>
              {entry.photos[0] ? <img src={entry.photos[0]} alt="" className="w-10 h-10 rounded-lg shrink-0 object-cover" /> : <span className="w-10 h-10 rounded-lg shrink-0 bg-light-bg text-primary flex items-center justify-center"><BookOpen className="w-5 h-5" /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{entry.place}</span><span className="block text-[11px] text-text-muted mt-1">{entry.category} · {entry.date}</span></span>
              <span className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${chosen ? 'bg-primary border-primary text-white' : 'border-border'}`}>{chosen && <Check className="w-3 h-3" />}</span>
            </button>;
          })}</div>
          {!matchingEntries.length && <div className="rounded-xl bg-light-bg p-5 text-center"><p className="text-sm text-text-muted">{entries.length ? 'No matching experiences. Try another search.' : 'Add your first diary experience to include it in a story.'}</p>{!entries.length && <Link to="/app/diary/add" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-3"><Plus className="w-4 h-4" />Add an experience</Link>}</div>}
          {matchingEntries.length > pageSize && <div className="flex items-center justify-between gap-2"><Button type="button" size="sm" variant="secondary" disabled={entryPage === 0} onClick={() => setEntryPage((page) => page - 1)}>Previous</Button><span className="text-xs text-text-muted">{entryPage + 1} / {Math.ceil(matchingEntries.length / pageSize)}</span><Button type="button" size="sm" variant="secondary" disabled={(entryPage + 1) * pageSize >= matchingEntries.length} onClick={() => setEntryPage((page) => page + 1)}>Next</Button></div>}
        </div>
      </Drawer>
    </div>
  );
};
