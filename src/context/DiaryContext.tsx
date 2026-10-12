import React, { createContext, useContext, useState, useEffect } from 'react';
import { DiaryEntry, Story } from '../types';
import { mockDiaryEntries } from '../data/mockDiary';
import { mockStories } from '../data/mockStories';
import { useAuth } from './AuthContext';

interface DiaryContextType {
  entries: DiaryEntry[];
  stories: Story[];
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'userId' | 'isPublished'>) => DiaryEntry;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updated: Partial<DiaryEntry>) => void;
  publishStory: (storyData: Omit<Story, 'id' | 'slug' | 'author' | 'likes' | 'comments' | 'views'>) => Story;
  getStoryBySlug: (slug: string) => Story | undefined;
}

const DiaryContext = createContext<DiaryContextType | undefined>(undefined);

export const DiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [entries, setEntries] = useState<DiaryEntry[]>(() => {
    const saved = localStorage.getItem('tripzobox_diary_entries');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockDiaryEntries;
      }
    }
    return mockDiaryEntries;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('tripzobox_stories');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return mockStories;
      }
    }
    return mockStories;
  });

  useEffect(() => {
    localStorage.setItem('tripzobox_diary_entries', JSON.stringify(entries));
  }, [entries]);

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
    return newEntry;
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateEntry = (id: string, updated: Partial<DiaryEntry>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
  };

  const publishStory = (storyData: Omit<Story, 'id' | 'slug' | 'author' | 'likes' | 'comments' | 'views'>): Story => {
    const slug = storyData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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

    // Mark selected entries as published
    if (storyData.entries && storyData.entries.length > 0) {
      const entryIds = storyData.entries.map((e) => e.id);
      setEntries((prev) =>
        prev.map((e) => (entryIds.includes(e.id) ? { ...e, isPublished: true, storyId: newStory.id } : e))
      );
    }

    return newStory;
  };

  const getStoryBySlug = (slug: string) => {
    return stories.find((s) => s.slug === slug);
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
