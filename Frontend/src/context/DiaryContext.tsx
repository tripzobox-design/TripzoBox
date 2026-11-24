import React, { createContext, useContext, useState, useEffect } from 'react';
import { DiaryEntry, Story } from '../types';
import { mockDiaryEntries } from '../data/mockDiary';
import { mockStories } from '../data/mockStories';
import { useAuth } from './AuthContext';
import { diaryApi, storiesApi } from '../lib/api';

interface DiaryContextType {
  entries: DiaryEntry[];
  stories: Story[];
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'userId' | 'isPublished'>) => DiaryEntry;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updated: Partial<DiaryEntry>) => void;
  publishStory: (storyData: Omit<Story, 'id' | 'slug' | 'author' | 'likes' | 'comments' | 'views'>) => Story;
  getStoryBySlug: (slug: string) => Story | undefined;
}

const scopedDiaryKey = (userId?: string): string =>
  userId ? `tripzobox_diary_entries:${userId}` : 'tripzobox_diary_entries';

const loadScopedEntries = (userId?: string): DiaryEntry[] => {
  if (!userId) return [];
  try {
    const saved = localStorage.getItem(scopedDiaryKey(userId));
    return saved ? (JSON.parse(saved) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
};

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();

  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    isLoggedIn ? loadScopedEntries(user?.id) : []
  );

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('tripzobox_stories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((s: Story) => s.id));
        const newStories = mockStories.filter((m) => !existingIds.has(m.id));
        if (newStories.length > 0) {
          const merged = [...parsed, ...newStories];
          localStorage.setItem('tripzobox_stories', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch {
        return mockStories;
      }
    }
    return mockStories;
  });

  // Sync private diary entries & public community stories when auth session changes
  useEffect(() => {
    let active = true;

    if (!isLoggedIn || !user?.id) {
      setEntries([]);
    } else {
      setEntries(loadScopedEntries(user.id));
      diaryApi
        .getEntries()
        .then((serverEntries) => {
          if (active && Array.isArray(serverEntries)) {
            setEntries(serverEntries);
          }
        })
        .catch(() => {});
    }

    storiesApi
      .getStories()
      .then((serverStories) => {
        if (active && Array.isArray(serverStories) && serverStories.length > 0) {
          setStories(serverStories);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    localStorage.setItem(scopedDiaryKey(user.id), JSON.stringify(entries));
  }, [entries, isLoggedIn, user?.id]);

  useEffect(() => {
    localStorage.setItem('tripzobox_stories', JSON.stringify(stories));
  }, [stories]);

  const addEntry = (entryData: Omit<DiaryEntry, 'id' | 'userId' | 'isPublished'>): DiaryEntry => {
    const newEntry: DiaryEntry = {
      ...entryData,
      id: `diary_${Date.now()}`,
      userId: user.id,
      isPublished: false,
    };
    setEntries((prev) => [newEntry, ...prev]);

    diaryApi.createEntry(newEntry).catch((err) => {
      console.warn('[DiaryContext] Failed to save entry to server:', err);
    });

    return newEntry;
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    diaryApi.deleteEntry(id).catch(() => {});
  };

  const updateEntry = (id: string, updated: Partial<DiaryEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    diaryApi.updateEntry(id, updated).catch(() => {});
  };

  const publishStory = (
    storyData: Omit<Story, 'id' | 'slug' | 'author' | 'likes' | 'comments' | 'views'>
  ): Story => {
    const slug = storyData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newStory: Story = {
      ...storyData,
      id: `story_${Date.now()}`,
      slug: slug || `story-${Date.now()}`,
      author: user,
      likes: 1,
      comments: 0,
      views: 12,
    };

    setStories((prev) => [newStory, ...prev]);

    if (storyData.entries && storyData.entries.length > 0) {
      const entryIds = storyData.entries.map((e) => e.id);
      setEntries((prev) =>
        prev.map((e) =>
          entryIds.includes(e.id) ? { ...e, isPublished: true, storyId: newStory.id } : e
        )
      );
    }

    storiesApi.createStory(newStory).catch((err) => {
      console.warn('[DiaryContext] Failed to publish story to server:', err);
    });

    return newStory;
  };

  const getStoryBySlug = (slug: string) => {
    return stories.find((s) => s.slug === slug || s.id === slug);
  };

  return (
    <DiaryContext.Provider
      value={{
        entries,
        stories,
        addEntry,
        deleteEntry,
        updateEntry,
        publishStory,
        getStoryBySlug,
      }}
    >
      {children}
    </DiaryContext.Provider>
  );
};

export const useDiary = () => {
  const context = useContext(DiaryContext);
  if (!context) throw new Error('useDiary must be used within DiaryProvider');
  return context;
};
