import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, Search } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { useAuth } from '../context/AuthContext';
import { StoryCard } from '../components/feature/StoryCard';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';

export const StoriesPage: React.FC = () => {
  const { stories } = useDiary();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const visibleStories = stories.filter((story) =>
    (activeTab !== 'mine' || (isLoggedIn && story.author.id === user.id)) &&
    (!search || [story.title, story.destination, story.author.name, story.summary].some((value) => value.toLowerCase().includes(search)))
  );
  const createPath = '/app/diary/create-story';

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 lg:py-12 space-y-4 lg:space-y-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">From the travel community</p>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-text">Travel Stories</h1>
          <p className="text-sm text-text-muted mt-3">Discover journeys shared by fellow travellers and share your own.</p>
        </div>
        <Button className="hidden lg:inline-flex" variant="primary" icon={<PenLine className="w-4 h-4" />} onClick={() => navigate(isLoggedIn ? createPath : `/login?redirect=${encodeURIComponent(createPath)}`, { state: { from: { pathname: createPath } } })}>Write a Story</Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-stretch gap-2 sm:gap-3">
        <Button size="sm" className="lg:hidden shrink-0 min-h-[44px] px-3" variant="primary" icon={<PenLine className="w-4 h-4" />} onClick={() => navigate(isLoggedIn ? createPath : `/login?redirect=${encodeURIComponent(createPath)}`, { state: { from: { pathname: createPath } } })}>Write a Story</Button>
        <label className="flex items-center gap-2 bg-white rounded-xl border border-border px-3 py-2.5 flex-1 min-w-0 max-w-xl">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input type="search" aria-label="Search stories" placeholder="Search stories..." value={query} onChange={(event) => setQuery(event.target.value)} className="w-full min-w-0 bg-transparent outline-none text-sm" />
        </label>
        </div>
        <Tabs tabs={[{ id: 'all', label: 'All Stories', badge: stories.length }, ...(isLoggedIn ? [{ id: 'mine', label: 'My Stories', badge: stories.filter((story) => story.author.id === user.id).length }] : [])]} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {visibleStories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
          {visibleStories.map((story) => <StoryCard key={story.id} story={story} />)}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-white p-10 text-center">
          <h2 className="font-heading font-semibold text-xl">{search ? 'No matching stories' : 'Your first story starts here'}</h2>
          <p className="text-sm text-text-muted mt-2">{search ? 'Try a different destination, author, or keyword.' : 'Publish a story to share your journey with the community.'}</p>
        </div>
      )}
    </div>
  );
};
