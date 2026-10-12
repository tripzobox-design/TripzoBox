import { Trip } from '../types';
import { mockUsers, currentUser } from './mockUsers';

export const mockTrips: Trip[] = [
  {
    id: 'trip_munnar_1',
    name: 'Munnar Adventure',
    destination: 'Munnar, Kerala',
    startCity: 'Kochi',
    startDate: '12 May 2025',
    endDate: '18 May 2025',
    durationDays: 6,
    budgetPerPerson: 6000,
    tripType: 'group',
    preferences: ['Hiking', 'Nature', 'Food', 'Photography'],
    description: 'A short and peaceful trip to Munnar, with beautiful hills, tea gardens, and local food. Perfect for nature lovers and first-time travellers looking for gentle misty morning hikes and quiet mountain tea sampling.',
    highlights: ['Tea Gardens', 'Waterfalls', 'Local Food', 'Photography'],
    leader: mockUsers[1], // Arjun Sharma
    members: [
      currentUser,
      mockUsers[1],
      mockUsers[2],
      mockUsers[4],
    ],
    maxMembers: 8,
    difficulty: 'medium',
    coverImageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 94,
    itinerary: [
      { day: 1, title: 'Arrival & Check-in', desc: 'Meet in Kochi at 9:00 AM. Scenic 4-hour drive up the Western Ghats to our Munnar homestay. Evening welcome tea & trip briefing.' },
      { day: 2, title: 'Tea Plantations & Museum', desc: 'Early morning sunrise walk through Lockhart Tea Estate. Visit Tata Tea Museum and learn about orthodox tea processing.' },
      { day: 3, title: 'Meesapulimala Trek & Waterfalls', desc: 'Gentle trek towards high altitude grasslands. Stop by Attukad and Lakkom waterfalls for refreshing streams and photo stops.' },
      { day: 4, title: 'Eravikulam Wildlife & Top Station', desc: 'Spot the endangered Nilgiri Tahr at the national park. Panoramic views over Tamil Nadu border from Top Station.' },
      { day: 5, title: 'Local Village Spice Walk', desc: 'Guided stroll through cardamon and pepper plantations. Hands-on traditional Kerala banana leaf lunch cooked with local host.' },
      { day: 6, title: 'Farewell & Return to Kochi', desc: 'Morning group breakfast, memory exchange, souvenir tea shopping, and comfortable return journey to Kochi.' },
    ],
    chatMessages: [
      { id: 'm1', sender: mockUsers[1], text: 'Hey everyone! Excited to have you all on the Munnar trek. Don’t forget to pack a light fleece jacket.', time: '10:30 AM' },
      { id: 'm2', sender: currentUser, text: 'Can’t wait! Are hiking poles needed or will regular sports shoes do?', time: '11:15 AM' },
      { id: 'm3', sender: mockUsers[1], text: 'Good grip shoes are plenty! The trails are gentle and scenic.', time: '11:20 AM' },
      { id: 'm4', sender: mockUsers[2], text: 'Looking forward to the local spice walk! See you all in Kochi next week.', time: '02:40 PM' }
    ],
    reviews: [
      { id: 'r1', author: mockUsers[3], rating: 5, date: '20 April 2025', comment: 'Arjun is an incredible leader. Super attentive, knows every hidden scenic view, and keeps the whole group vibe welcoming.' },
      { id: 'r2', author: mockUsers[5], rating: 5, date: '15 March 2025', comment: 'Munnar with Tripzobox was an absolute dream. Made friends for life and the tea plantation sunrise was unforgettable.' }
    ]
  },
  {
    id: 'trip_varkala_1',
    name: 'Varkala Beach vibes',
    destination: 'Varkala, Kerala',
    startCity: 'Thiruvananthapuram',
    startDate: '20 May 2025',
    endDate: '26 May 2025',
    durationDays: 6,
    budgetPerPerson: 5500,
    tripType: 'group',
    preferences: ['Beaches', 'Food', 'Culture', 'Photography'],
    description: 'Cliffside sunset sessions, yoga by the Arabian sea, delicious coastal seafood shacks and tranquil black sand beaches.',
    highlights: ['Cliff Sunset', 'Beach Yoga', 'Seafood Shacks', 'Surfing'],
    leader: mockUsers[2], // Riya Sharma
    members: [
      currentUser,
      mockUsers[2],
      mockUsers[3]
    ],
    maxMembers: 6,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 89,
    itinerary: [
      { day: 1, title: 'Cliff Arrival', desc: 'Check in to cliffside boutique cottages. Sunset juice meet-and-greet on North Cliff.' },
      { day: 2, title: 'Black Sand & Surf', desc: 'Morning beginner surf lesson at Black Sand Beach. Afternoon beach hammock relaxation.' },
      { day: 3, title: 'Kappil Lake & Backwaters', desc: 'Kayaking excursion where the backwaters meet the Arabian Sea. Golden hour cliff dinner.' },
      { day: 4, title: 'Temple & Mineral Springs', desc: 'Visit ancient Janardhana temple and take a dip in natural mineral waters.' },
      { day: 5, title: 'Yoga & Bohemian Cafes', desc: 'Restorative evening yoga class followed by acoustic live music night.' },
      { day: 6, title: 'Departure', desc: 'Farewell breakfast overlooking the blue ocean horizon.' }
    ],
    chatMessages: [
      { id: 'm1', sender: mockUsers[2], text: 'Varkala sunsets await! Pack breezy cottons and sunscreen ☀️', time: '09:00 AM' }
    ],
    reviews: [
      { id: 'r1', author: currentUser, rating: 5, date: '10 Feb 2025', comment: 'Best coastal getaway ever! The group balance was perfect.' }
    ]
  },
  {
    id: 'trip_goa_1',
    name: 'Goa Backpacking',
    destination: 'Goa, Goa',
    startCity: 'Panaji',
    startDate: '5 Jun 2025',
    endDate: '10 Jun 2025',
    durationDays: 5,
    budgetPerPerson: 7000,
    tripType: 'group',
    preferences: ['Beaches', 'Food', 'Adventure', 'Culture'],
    description: 'Explore the Portuguese alleys of Fontainhas, secret southern coves of Palolem and Agonda, and vibrant food trails.',
    highlights: ['Fontainhas Walk', 'South Goa Coves', 'Night Markets', 'Kayaking'],
    leader: mockUsers[6], // Sneha
    members: [
      currentUser,
      mockUsers[6],
      mockUsers[3],
      mockUsers[5],
      mockUsers[4]
    ],
    maxMembers: 8,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 92,
    itinerary: [
      { day: 1, title: 'Latin Quarter Walk', desc: 'Walking tour through colorful Portuguese villas in Fontainhas, Panjim.' },
      { day: 2, title: 'Old Goa & Spice Plantation', desc: 'Visit UNESCO cathedrals followed by organic spice farm buffet.' },
      { day: 3, title: 'South Goa Hidden Beaches', desc: 'Scooter convoy to Butterfly Beach and Cola Beach freshwater lagoon.' },
      { day: 4, title: 'Dudhsagar Waterfalls', desc: 'Jeep safari into the Bhagwan Mahavir sanctuary and Dudhsagar falls.' },
      { day: 5, title: 'Beach Bonfire & Farewell', desc: 'Sunset cruise and farewell seaside dinner under the palms.' }
    ]
  },
  {
    id: 'trip_kochi_1',
    name: 'Kochi Explorer',
    destination: 'Kochi, Kerala',
    startCity: 'Kochi',
    startDate: '15 Jun 2025',
    endDate: '19 Jun 2025',
    durationDays: 4,
    budgetPerPerson: 4800,
    tripType: 'group',
    preferences: ['Culture', 'Food', 'Photography', 'Nature'],
    description: 'A heritage and culinary journey across colonial Fort Kochi, Jewish synagogues, spice markets, and serene backwater houseboats.',
    highlights: ['Chinese Fishing Nets', 'Kathakali Show', 'Mattancherry Palace', 'Backwaters'],
    leader: mockUsers[4], // Priya Nair
    members: [
      currentUser,
      mockUsers[4],
      mockUsers[2],
      mockUsers[1],
      mockUsers[5]
    ],
    maxMembers: 6,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 96
  },
  {
    id: 'trip_ooty_1',
    name: 'Ooty Heritage Trails',
    destination: 'Ooty, Tamil Nadu',
    startCity: 'Coimbatore',
    startDate: '22 Jun 2025',
    endDate: '26 Jun 2025',
    durationDays: 5,
    budgetPerPerson: 5200,
    tripType: 'group',
    preferences: ['Mountains', 'Nature', 'Culture', 'Photography'],
    description: 'Ride the iconic UNESCO Toy Train, walk through aromatic pine forests, and sip freshly brewed Nilgiri tea at sunset.',
    highlights: ['Toy Train', 'Doddabetta Peak', 'Botanical Gardens', 'Pykara Lake'],
    leader: mockUsers[5], // Rohan
    members: [
      currentUser,
      mockUsers[5],
      mockUsers[3]
    ],
    maxMembers: 6,
    difficulty: 'medium',
    coverImageUrl: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 88
  }
];
