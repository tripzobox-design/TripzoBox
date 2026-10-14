import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, MapPin, Camera } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { StarRating } from '../components/ui/StarRating';
import { Dropzone } from '../components/ui/Dropzone';
import { DiaryEntry } from '../types';

export const AddExperiencePage: React.FC = () => {
  const navigate = useNavigate();
  const { addEntry } = useDiary();
  const { success } = useToast();

  const [place, setPlace] = useState('Munnar');
  const [category, setCategory] = useState<DiaryEntry['category']>('Nature');
  const [rating, setRating] = useState(5);
  const [price, setPrice] = useState('500');
  const [text, setText] = useState(
    'Beautiful hill gardens and cool weather. A must visit! The morning mist hovering over the Lockhart tea estate was pure magic. We stopped at a small roadside stall for cardamom tea and warm banana fritters.'
  );
  const [tips, setTips] = useState('Reach Top Station early morning for views above the cloud line.');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
  ]);

  const [errors, setErrors] = useState<{ place?: string; text?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { place?: string; text?: string } = {};
    if (!place.trim()) newErrors.place = 'Place name is required';
    if (!text.trim()) newErrors.text = 'Please write a brief description of your experience';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addEntry({
      place: place.trim(),
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      category,
      text: text.trim(),
      photos,
      price: price ? parseInt(price.replace(/[^0-9]/g, ''), 10) : undefined,
      rating,
      tips: tips.trim() || undefined,
    });

    success(`Experience at ${place} saved to your private diary!`, 'Experience Recorded');
    navigate('/app/diary');
  };

  return (
    <div className="flex flex-col gap-6 text-left max-w-4xl mx-auto">
      {/* 1. HEADER (Matching Screen 9) */}
      <div>
        <Link
          to="/app/diary"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Diary</span>
        </Link>
        <h1 className="font-heading font-bold text-2xl sm:text-3xl text-text">
          Add Experience
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Share your travel experience with the community.
        </p>
      </div>

      {/* 2. FORM PANEL (2 Columns: Dropzone Left / Fields Right matching Reference Screen 9) */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-border p-6 sm:p-8 shadow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Media Dropzone */}
          <div className="h-full flex flex-col">
            <div className="border-2 border-dashed border-accent hover:border-primary/80 rounded-3xl min-h-[340px] flex-1 flex flex-col items-center justify-center p-8 text-center bg-light-bg/40 transition-all">
              <Dropzone
                label="Add photos or videos"
                subtext="Drag and drop or click to upload"
                onFilesSelected={setPhotos}
                previewUrls={photos}
                className="w-full"
              />
            </div>
            <p className="text-[11px] text-text-subtle mt-3 text-center">
              *Images are previewed locally in your session.
            </p>
          </div>

          {/* Right Column: Form Inputs & Save CTA (Matching Reference Screen 9) */}
          <div className="space-y-4">
            <Input
              label="Place Name *"
              placeholder="e.g. Munnar"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              error={errors.place}
            />

            <Select
              label="Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { label: 'Nature / Food / Hotel / Activity / Other', value: 'Nature' },
                { label: 'Nature', value: 'Nature' },
                { label: 'Food', value: 'Food' },
                { label: 'Hotel', value: 'Culture' },
                { label: 'Activity', value: 'Adventure' },
                { label: 'Beach', value: 'Beach' },
                { label: 'Other', value: 'Other' },
              ]}
            />

            {/* Interactive 5-Star Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text tracking-wide block">
                Rating
              </label>
              <div className="flex items-center gap-3 py-1">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>
            </div>

            <Input
              label="Price (optional)"
              placeholder="₹ 500"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />

            <Textarea
              label="Write your experience *"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Tell people about your experience..."
              error={errors.text}
            />

            {/* Full-width Save Experience button matching Reference Screen 9 */}
            <div className="pt-2">
              <Button
                variant="primary"
                type="submit"
                size="lg"
                className="w-full py-3.5 font-semibold text-sm shadow-subtle hover:shadow-hover"
              >
                Save Experience
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
