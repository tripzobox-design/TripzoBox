import { DiaryEntry } from '../types';

export const mockDiaryEntries: DiaryEntry[] = [
  {
    id: 'diary_1',
    userId: 'user_mubarak',
    place: 'Munnar',
    date: '18 May 2025',
    category: 'Nature',
    text: 'Beautiful hill gardens and cool weather. A must visit! The morning mist hovering over the Lockhart tea estate was pure magic. We stopped at a small roadside stall for cardamom tea and warm banana fritters.',
    photos: [
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    price: 500,
    rating: 5,
    tips: 'Reach Top Station before 8:00 AM for the clearest views above the cloud line.',
    isPublished: true,
    storyId: 'story_gods_own_country'
  },
  {
    id: 'diary_2',
    userId: 'user_mubarak',
    place: 'Varkala',
    date: '24 May 2025',
    category: 'Beach',
    text: 'Amazing sunset and cliff vibes. Loved the atmosphere. Watching the sky turn purple from the North Cliff cafes while waves crashed 50 feet below was unforgettable.',
    photos: [
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80'
    ],
    price: 350,
    rating: 5,
    tips: 'Try the fresh fish catch roasted in banana leaf at the cliffside Tibetan cafe.',
    isPublished: true,
    storyId: 'story_varkala_vibes'
  },
  {
    id: 'diary_3',
    userId: 'user_mubarak',
    place: 'Kochi',
    date: '8 Jun 2025',
    category: 'Culture',
    text: 'Fort Kochi is a blend of history, art and amazing food. Walking through Princess Street feels like stepping back 200 years. The Chinese fishing nets against the sunset was breathtaking.',
    photos: [
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80'
    ],
    price: 450,
    rating: 4,
    tips: 'Take the public ferry between Fort Kochi and Ernakulam — costs only ₹6 and great views!',
    isPublished: false
  },
  {
    id: 'diary_4',
    userId: 'user_mubarak',
    place: 'Ooty',
    date: '14 Jul 2025',
    category: 'Nature',
    text: 'Crisp morning air and fragrant pine cones near Avalanche Lake. The Nilgiri mountain railway steam engine brought back childhood memories.',
    photos: [
      'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80'
    ],
    price: 600,
    rating: 5,
    tips: 'Book first-class toy train tickets at least 2 months in advance via IRCTC.',
    isPublished: false
  }
];
