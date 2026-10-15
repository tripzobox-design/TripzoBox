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
      'https://images.unsplash.com/photo-1558025638-565ae7710b3f?auto=format&fit=crop&w=800&q=85'
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
  },
  {
    id: 'diary_5',
    userId: 'user_mubarak',
    place: 'Coorg',
    date: '28 Jun 2025',
    category: 'Nature',
    text: 'Sipping fresh dark-roast coffee while gentle monsoons drum on the tin roof of our plantation cottage. The aroma of wild cardamom and damp red soil is unforgettable.',
    photos: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80'
    ],
    price: 750,
    rating: 5,
    tips: 'Pack a waterproof dry bag for your camera if hiking Tadiandamol in monsoon.',
    isPublished: true,
    storyId: 'story_coorg_coffee'
  },
  {
    id: 'diary_6',
    userId: 'user_mubarak',
    place: 'Hampi',
    date: '16 Jul 2025',
    category: 'Culture',
    text: 'Climbed 570 stone steps to Anjaneya Hill at sunset. Looking across the Tungabhadra river valley filled with ancient granite pillars and palm trees felt like traveling through time.',
    photos: [
      'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=800&q=80'
    ],
    price: 300,
    rating: 5,
    tips: 'Rent a geared cycle or moped for ₹250/day to cross between Hampi ruins and Hippie Island.',
    isPublished: true,
    storyId: 'story_hampi_boulders'
  },
  {
    id: 'diary_7',
    userId: 'user_mubarak',
    place: 'Alleppey',
    date: '10 Jul 2025',
    category: 'Beach',
    text: 'Drifting down tranquil backwater canals in a hand-paddled wooden canoe. The water was so glassy it mirrored the coconut fronds and puffy monsoon clouds perfectly.',
    photos: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'
    ],
    price: 1200,
    rating: 5,
    tips: 'Ask the boatman to stop by a local toddy shop for authentic tapioca and spicy fish curry.',
    isPublished: true,
    storyId: 'story_alleppey_canals'
  },
  {
    id: 'diary_8',
    userId: 'user_mubarak',
    place: 'Gokarna',
    date: '22 Jul 2025',
    category: 'Beach',
    text: 'The cliff trail from Om Beach to Half Moon Beach was thrilling. Ocean swells on one side and green shrubs on the other. We rested at a quiet cafe with fresh ginger lemon honey.',
    photos: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
    ],
    price: 400,
    rating: 4,
    tips: 'Wear shoes with good grip on the cliff trails — loose gravel can be slippery.',
    isPublished: true,
    storyId: 'story_gokarna_cliffs'
  },
  {
    id: 'diary_9',
    userId: 'user_mubarak',
    place: 'Pondicherry',
    date: '14 Aug 2025',
    category: 'Culture',
    text: 'Early morning run along the Rock Beach promenade followed by warm pain au chocolat at Baker Street. The French quarter architecture in the morning light is breathtaking.',
    photos: [
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80'
    ],
    price: 550,
    rating: 5,
    tips: 'Book passes for the inner chamber of Matrimandir in Auroville at least 3 days in advance.',
    isPublished: false
  },
  {
    id: 'diary_10',
    userId: 'user_mubarak',
    place: 'Meghalaya',
    date: '22 Aug 2025',
    category: 'Adventure',
    text: 'Dipping tired feet into the blue natural pool under the Double Decker Living Root Bridge after descending thousands of forest steps. Pure natural rejuvenation.',
    photos: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    price: 900,
    rating: 5,
    tips: 'Carry bamboo trekking sticks available for ₹20 at Tyrna village trailhead.',
    isPublished: true,
    storyId: 'story_meghalaya_roots'
  }
];
