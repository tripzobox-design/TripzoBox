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
  },
  {
    id: 'trip_coorg_1',
    name: 'Coorg Coffee Trails & Camping',
    destination: 'Coorg, Karnataka',
    startCity: 'Bengaluru',
    startDate: '28 Jun 2025',
    endDate: '02 Jul 2025',
    durationDays: 5,
    budgetPerPerson: 5800,
    tripType: 'group',
    preferences: ['Mountains', 'Nature', 'Food', 'Hiking'],
    description: 'Camp inside historic estate plantations, harvest aromatic Arabica beans, trek Tadiandamol peak, and taste authentic spicy Pandi curry with rice rotis.',
    highlights: ['Coffee Tasting', 'Tadiandamol Trek', 'Abbey Falls', 'Estate Campfire'],
    leader: mockUsers[7] || mockUsers[1], // Ananya Sen
    members: [
      currentUser,
      mockUsers[7] || mockUsers[1],
      mockUsers[2],
      mockUsers[5]
    ],
    maxMembers: 8,
    difficulty: 'medium',
    coverImageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 95,
    itinerary: [
      { day: 1, title: 'Drive to Madikeri', desc: 'Scenic morning drive from Bengaluru via Kushalnagar. Visit Namdroling Golden Temple.' },
      { day: 2, title: 'Tadiandamol Peak Trek', desc: 'Ascend Karnataka’s 2nd highest peak with 360-degree views of the Western Ghats.' },
      { day: 3, title: 'Coffee & Spice Walk', desc: 'Hands-on cupping session and pepper harvesting at an 80-year-old organic plantation.' },
      { day: 4, title: 'Abbey Falls & Raja’s Seat', desc: 'Mist walks, sunset viewpoint over Coorg valleys, and traditional Kodava feast.' },
      { day: 5, title: 'Return Journey', desc: 'Souvenir spice and homemade chocolate shopping, followed by drive back to Bengaluru.' }
    ]
  },
  {
    id: 'trip_alleppey_1',
    name: 'Alleppey Backwaters & Lagoons',
    destination: 'Alleppey, Kerala',
    startCity: 'Kochi',
    startDate: '08 Jul 2025',
    endDate: '11 Jul 2025',
    durationDays: 4,
    budgetPerPerson: 6500,
    tripType: 'group',
    preferences: ['Nature', 'Beaches', 'Food', 'Photography'],
    description: 'Glide gently aboard traditional wooden kettuvallam houseboats through tranquil canals, palm-fringed villages, and golden lake sunsets.',
    highlights: ['Houseboat Stay', 'Karimeen Fry', 'Village Kayaking', 'Marari Beach'],
    leader: mockUsers[4], // Priya Nair
    members: [
      currentUser,
      mockUsers[4],
      mockUsers[2],
      mockUsers[6]
    ],
    maxMembers: 6,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 91
  },
  {
    id: 'trip_hampi_1',
    name: 'Hampi Boulders & Empires',
    destination: 'Hampi, Karnataka',
    startCity: 'Bengaluru',
    startDate: '14 Jul 2025',
    endDate: '18 Jul 2025',
    durationDays: 5,
    budgetPerPerson: 4500,
    tripType: 'group',
    preferences: ['Culture', 'Photography', 'Adventure', 'Food'],
    description: 'Explore the surreal granite boulder moonscapes and UNESCO stone monuments of the Vijayanagara Empire on rented bicycles.',
    highlights: ['Vittala Stone Chariot', 'Matanga Hill Sunrise', 'Coracle Boat Ride', 'Hippie Island Sunset'],
    leader: mockUsers[8] || mockUsers[3], // Vikram
    members: [
      currentUser,
      mockUsers[8] || mockUsers[3],
      mockUsers[1],
      mockUsers[5]
    ],
    maxMembers: 8,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 94
  },
  {
    id: 'trip_gokarna_1',
    name: 'Gokarna 5-Beach Cliff Trek',
    destination: 'Gokarna, Karnataka',
    startCity: 'Goa / Hubli',
    startDate: '20 Jul 2025',
    endDate: '23 Jul 2025',
    durationDays: 4,
    budgetPerPerson: 4200,
    tripType: 'group',
    preferences: ['Beaches', 'Hiking', 'Adventure', 'Nature'],
    description: 'Hike across coastal cliff trails linking Kudle, Om, Half Moon, and Paradise beaches with midnight bioluminescent swims and acoustic campfires.',
    highlights: ['5-Beach Trek', 'Dolphin Watching', 'Om Beach Shacks', 'Cliffside Camping'],
    leader: mockUsers[9] || mockUsers[2], // Kavya
    members: [
      currentUser,
      mockUsers[9] || mockUsers[2],
      mockUsers[3],
      mockUsers[6]
    ],
    maxMembers: 6,
    difficulty: 'medium',
    coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 90
  },
  {
    id: 'trip_kodaikanal_1',
    name: 'Kodaikanal Mist & Pines',
    destination: 'Kodaikanal, Tamil Nadu',
    startCity: 'Madurai',
    startDate: '26 Jul 2025',
    endDate: '30 Jul 2025',
    durationDays: 5,
    budgetPerPerson: 4900,
    tripType: 'group',
    preferences: ['Mountains', 'Nature', 'Hiking', 'Photography'],
    description: 'Wander through dense eucalyptus pine forests, take wooden rowboats across the star-shaped Kodai Lake, and discover hidden waterfalls.',
    highlights: ['Pillar Rocks', 'Pine Forest Walks', 'Kodai Lake Boating', 'Homemade Chocolates'],
    leader: mockUsers[1], // Arjun
    members: [
      currentUser,
      mockUsers[1],
      mockUsers[4],
      mockUsers[5]
    ],
    maxMembers: 8,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 89
  },
  {
    id: 'trip_wayanad_1',
    name: 'Wayanad Chembra Rainforests',
    destination: 'Wayanad, Kerala',
    startCity: 'Kozhikode',
    startDate: '05 Aug 2025',
    endDate: '09 Aug 2025',
    durationDays: 5,
    budgetPerPerson: 5400,
    tripType: 'group',
    preferences: ['Hiking', 'Nature', 'Adventure', 'Food'],
    description: 'Trek to the heart-shaped lake at Chembra Peak, explore Neolithic petroglyphs in Edakkal Caves, and stay in elevated canopy treehouses.',
    highlights: ['Heart Lake Trek', 'Edakkal Caves', 'Bamboo Rafting', 'Treehouse Stay'],
    leader: mockUsers[5], // Rohan
    members: [
      currentUser,
      mockUsers[5],
      mockUsers[2],
      mockUsers[7] || mockUsers[1]
    ],
    maxMembers: 6,
    difficulty: 'hard',
    coverImageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 93
  },
  {
    id: 'trip_pondicherry_1',
    name: 'Pondicherry French Quarter & Surf',
    destination: 'Pondicherry, Puducherry',
    startCity: 'Chennai',
    startDate: '12 Aug 2025',
    endDate: '15 Aug 2025',
    durationDays: 4,
    budgetPerPerson: 5900,
    tripType: 'group',
    preferences: ['Culture', 'Beaches', 'Food', 'Photography'],
    description: 'Bicycle through mustard-yellow French colonial villas, enjoy artisanal French croissants, meditate in Auroville, and catch morning waves.',
    highlights: ['White Town Cycling', 'Auroville Matrimandir', 'Surfing Lessons', 'Promenade Beach Walk'],
    leader: mockUsers[2], // Riya
    members: [
      currentUser,
      mockUsers[2],
      mockUsers[6],
      mockUsers[8] || mockUsers[3]
    ],
    maxMembers: 6,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 96
  },
  {
    id: 'trip_meghalaya_1',
    name: 'Meghalaya Living Root Bridges',
    destination: 'Meghalaya, Northeast',
    startCity: 'Guwahati',
    startDate: '18 Aug 2025',
    endDate: '24 Aug 2025',
    durationDays: 7,
    budgetPerPerson: 12500,
    tripType: 'group',
    preferences: ['Adventure', 'Nature', 'Hiking', 'Culture'],
    description: 'An expedition into the wettest place on earth. Descend 3,500 stone stairs to the Double Decker Root Bridge and boat on glassy Dawki river.',
    highlights: ['Living Root Bridges', 'Dawki Umngot Boating', 'Nohkalikai Falls', 'Caving in Mawsmai'],
    leader: mockUsers[10] || mockUsers[1], // Tarun
    members: [
      currentUser,
      mockUsers[10] || mockUsers[1],
      mockUsers[1],
      mockUsers[3]
    ],
    maxMembers: 6,
    difficulty: 'hard',
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 92
  },
  {
    id: 'trip_coimbatore_1',
    name: 'Coimbatore & Isha Retreat',
    destination: 'Coimbatore, Tamil Nadu',
    startCity: 'Coimbatore',
    startDate: '28 Aug 2025',
    endDate: '31 Aug 2025',
    durationDays: 4,
    budgetPerPerson: 3800,
    tripType: 'group',
    preferences: ['Culture', 'Nature', 'Food'],
    description: 'Experience tranquil Dhyanalinga meditations, gaze upon the illuminated Adiyogi Shiva consecrated statue, and hike Siruvani foothills.',
    highlights: ['Adiyogi Shiva', 'Dhyanalinga Meditation', 'Siruvani Falls', 'Tamil Sadhya Feast'],
    leader: mockUsers[4], // Priya
    members: [
      currentUser,
      mockUsers[4],
      mockUsers[5]
    ],
    maxMembers: 8,
    difficulty: 'easy',
    coverImageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
    status: 'open',
    compatibilityScore: 97
  }
];
