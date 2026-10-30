import { Story } from '../types';
import { mockUsers } from './mockUsers';
import { mockDiaryEntries } from './mockDiary';

export const mockStories: Story[] = [
  {
    id: 'story_varkala_beach',
    slug: 'varkala-more-than-just-a-beach',
    title: 'Varkala – More Than Just a Beach',
    destination: 'Varkala, Kerala',
    badge: 'Featured',
    days: 4,
    photosCount: 28,
    placesCount: 12,
    dates: '12 - 16 May 2025',
    summary: 'From cliffside cafes to peaceful beaches, this trip was a perfect mix of relaxation and adventure...',
    fullContent: [
      'Varkala is unlike any other beach in India. The sheer red laterite cliffs drop dramatically down to golden sands, lined on top with coconut trees and vibrant backpacker cafes.',
      'Spending four days here with fellow wanderers allowed us to surf at sunrise, taste coastal delicacies, and watch unforgettable fiery sunsets from the cliff promenade.',
      'The morning yoga sessions above the crashing waves and the quiet evenings listening to acoustic music at cafe rooftops made this journey pure magic.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80'
    ],
    author: {
      id: 'user_sneha_r',
      name: 'Sneha R.',
      username: 'sneha_r',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      city: 'Bengaluru',
      languages: ['English', 'Hindi'],
      bio: 'Beach lover, photographer, cafe hopper.',
      travelInterests: ['Beach', 'Photography', 'Food'],
      budgetStyle: 'comfort',
      stats: { trips: 8, stories: 5, followers: 240, following: 95 },
    },
    timeAgo: '3 days ago',
    rating: 4.8,
    reviewCount: 124,
    tripType: 'Solo',
    travelStyle: ['Relaxation', 'Adventure', 'Nature'],
    languages: ['Hindi', 'English'],
    likes: 482,
    comments: 34,
    views: 12500,
    readTimeMins: 4,
    visibility: 'public'
  },
  {
    id: 'story_munnar_escape',
    slug: 'munnar-a-weekend-escape',
    title: 'Munnar – A Weekend Escape',
    destination: 'Munnar, Kerala',
    badge: 'Popular',
    days: 3,
    photosCount: 32,
    placesCount: 10,
    dates: '18 - 21 May 2025',
    summary: "Cool weather, endless tea gardens and some of the best food I've ever had. Munnar truly has a different kind of magic...",
    fullContent: [
      'From Kochi, the drive to Munnar winds through mist-clad ravines and cascading waterfalls like Cheeyappara.',
      'We stayed at a quiet plantation homestay where morning tea is plucked right outside your window. The highlight of Munnar was waking up before dawn to hike up to Top Station.',
      'Homestays with home-cooked dinners saved us over ₹3,000 per person and offered authentic Kerala avial and spicy fish curry.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    author: {
      id: 'user_arjun_m',
      name: 'Arjun M.',
      username: 'arjun_m',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      city: 'Bengaluru',
      languages: ['English', 'Kannada', 'Hindi'],
      bio: 'Mountain enthusiast and landscape storyteller.',
      travelInterests: ['Mountains', 'Nature', 'Photography'],
      budgetStyle: 'mid-range',
      stats: { trips: 14, stories: 8, followers: 420, following: 110 },
    },
    timeAgo: '1 week ago',
    rating: 4.6,
    reviewCount: 98,
    tripType: 'Group',
    travelStyle: ['Nature', 'Photography', 'Backpacking'],
    languages: ['Hindi', 'English'],
    likes: 395,
    comments: 26,
    views: 9400,
    readTimeMins: 3,
    visibility: 'public'
  },
  {
    id: 'story_alleppey',
    slug: 'alleppey-backwaters-and-beyond',
    title: 'Alleppey – Backwaters & Beyond',
    destination: 'Alleppey, Kerala',
    badge: 'Hidden Gem',
    days: 2,
    photosCount: 25,
    placesCount: 8,
    dates: '24 - 26 May 2025',
    summary: 'Houseboats, calm waters, and sunsets that felt unreal. A short trip with a lot of beautiful moments...',
    fullContent: [
      'Gliding through narrow palm-fringed canals on a traditional wooden houseboat as kingfishers dive into the calm waters.',
      'Enjoying freshly caught Karimeen Pollichathu cooked on the boat by our local captain.',
      'Watching the golden sun dip below the vast expanse of Vembanad lake in total serenity.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80'
    ],
    author: {
      id: 'user_priya_s',
      name: 'Priya S.',
      username: 'priya_s',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      city: 'Kochi',
      languages: ['English', 'Malayalam'],
      bio: 'Backwaters wanderer and culinary explorer.',
      travelInterests: ['Nature', 'Relaxation', 'Food'],
      budgetStyle: 'comfort',
      stats: { trips: 6, stories: 4, followers: 180, following: 60 },
    },
    timeAgo: '1 week ago',
    rating: 4.9,
    reviewCount: 76,
    tripType: 'Solo',
    travelStyle: ['Nature', 'Relaxation'],
    languages: ['English', 'Tamil'],
    likes: 310,
    comments: 18,
    views: 7800,
    readTimeMins: 2,
    visibility: 'public'
  },
  {
    id: 'story_hampi',
    slug: 'hampi-history-hills-and-freedom',
    title: 'Hampi – History, Hills and Freedom',
    destination: 'Hampi, Karnataka',
    badge: 'Adventure',
    days: 4,
    photosCount: 40,
    placesCount: 15,
    dates: '01 - 05 Jun 2025',
    summary: 'Exploring ancient ruins, hidden trails and the best sunsets of my life. Hampi is pure magic.',
    fullContent: [
      'Renting bicycles to navigate through 600-year-old stone temple ruins and climbing Matanga Hill for golden hour.',
      'Crossing the Tungabhadra river in circular wicker coracles and jamming to acoustic guitar on Hippie Island.',
      'The sheer surreal scale of granite boulders balancing over ancient empire monuments.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=800&q=80'
    ],
    author: {
      id: 'user_rohit_v',
      name: 'Rohit V.',
      username: 'rohit_v',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      city: 'Chennai',
      languages: ['English', 'Hindi', 'Tamil'],
      bio: 'Bouldering enthusiast, heritage photographer.',
      travelInterests: ['Adventure', 'Culture', 'Backpacking'],
      budgetStyle: 'mid-range',
      stats: { trips: 12, stories: 7, followers: 350, following: 110 },
    },
    timeAgo: '2 weeks ago',
    rating: 4.7,
    reviewCount: 112,
    tripType: 'Group',
    travelStyle: ['Adventure', 'Culture', 'Backpacking'],
    languages: ['Hindi', 'English'],
    likes: 420,
    comments: 31,
    views: 11200,
    readTimeMins: 4,
    visibility: 'public'
  },
  {
    id: 'story_spiti',
    slug: 'spiti-valley-a-soulful-journey',
    title: 'Spiti Valley – A Soulful Journey',
    destination: 'Spiti Valley, Himachal Pradesh',
    badge: 'Solo Trip',
    days: 7,
    photosCount: 45,
    placesCount: 18,
    dates: '10 - 17 Jun 2025',
    summary: 'Remote villages, endless roads and the kindest people. This trip changed the way I see life.',
    fullContent: [
      'Driving across high altitude mountain passes, hanging prayer flags at Kunzum Pass, and staying in Key Monastery.',
      'Stargazing beneath zero light pollution skies at 14,000 feet in Langza with the giant Buddha statue.',
      'Sharing butter tea and piping hot thukpa with warm Tibetan homestay families.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80'
    ],
    author: {
      id: 'user_neha_k',
      name: 'Neha K.',
      username: 'neha_k',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      city: 'Delhi',
      languages: ['Hindi', 'English'],
      bio: 'High altitude solo wanderer and writer.',
      travelInterests: ['Adventure', 'Nature', 'Photography'],
      budgetStyle: 'budget',
      stats: { trips: 18, stories: 11, followers: 610, following: 140 },
    },
    timeAgo: '2 weeks ago',
    rating: 4.8,
    reviewCount: 154,
    tripType: 'Solo',
    travelStyle: ['Adventure', 'Nature', 'Photography'],
    languages: ['Hindi', 'English'],
    likes: 560,
    comments: 42,
    views: 16800,
    readTimeMins: 7,
    visibility: 'public'
  },
  {
    id: 'story_goa',
    slug: 'goa-sun-sand-and-good-vibes',
    title: 'Goa – Sun, Sand and Good Vibes',
    destination: 'Goa',
    badge: 'Budget Trip',
    days: 5,
    photosCount: 36,
    placesCount: 14,
    dates: '20 - 25 Jun 2025',
    summary: 'Beach days, local food, and amazing people. Goa is always a good idea!',
    fullContent: [
      'Exploring quiet South Goa coves like Butterfly beach and Galgibaga.',
      'Sipping fresh coconut water, renting scooters to explore Portuguese heritage villas in Fontainhas.',
      'Sunset beach barbecues with travellers met at our beachside hostel.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80'
    ],
    author: {
      id: 'user_aman_p',
      name: 'Aman P.',
      username: 'aman_p',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
      city: 'Ahmedabad',
      languages: ['English', 'Gujarati', 'Hindi'],
      bio: 'Budget beach backpacker and foodie.',
      travelInterests: ['Beach', 'Culture', 'Food'],
      budgetStyle: 'budget',
      stats: { trips: 9, stories: 6, followers: 270, following: 80 },
    },
    timeAgo: '3 weeks ago',
    rating: 4.5,
    reviewCount: 89,
    tripType: 'Group',
    travelStyle: ['Beach', 'Culture', 'Food'],
    languages: ['English', 'Hindi'],
    likes: 275,
    comments: 14,
    views: 6900,
    readTimeMins: 5,
    visibility: 'public'
  },
  {
    id: 'story_gods_own_country',
    slug: 'exploring-gods-own-country',
    title: "Exploring the God's Own Country",
    destination: 'Munnar & Alleppey, Kerala',
    dates: '15 - 20 May 2025',
    summary: 'Kerala has always been on my bucket list, and finally I made it! Here is my 5-day journey through Kochi, Munnar and Alleppey with tips, costs and must-visit places.',
    fullContent: [
      'Kerala welcomes you with a humid coastal breeze that turns into crisp mountain chill as you ascend the Western Ghats. Our journey kicked off in Fort Kochi, where colonial streets are lined with bougainvillea and Chinese fishing nets dip rhythmically into the Arabian Sea.',
      'From Kochi, the drive to Munnar winds through mist-clad ravines and cascading waterfalls like Cheeyappara. As you cross 1,200 meters, the landscape transforms into emerald blankets of tea gardens rolling as far as the eye can see.',
      'We stayed at a quiet plantation homestay where morning tea is plucked right outside your window. The highlight of Munnar was waking up before dawn to hike up to Top Station — looking down over the clouds drifting towards Tamil Nadu is an experience words barely capture.',
      'Practical Budget Tip: Homestays with home-cooked dinners saved us over ₹3,000 per person and offered authentic Kerala avial and spicy fish curry that no restaurant could match.',
      'Connecting with our small Tripzobox group gave the trip its true soul. Walking through silent tea gardens with people who appreciate quiet sunsets as much as you do turned strangers into lifelong travel partners.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[2], // Riya Sharma
    entries: [mockDiaryEntries[0]],
    likes: 482,
    comments: 34,
    views: 12500,
    readTimeMins: 6
  },
  {
    id: 'story_varkala_vibes',
    slug: 'varkala-beach-vibes',
    title: 'Varkala - Beach Vibes & Cliffs',
    destination: 'Varkala, Kerala',
    dates: '22 - 26 May 2025',
    summary: 'Red laterite cliffs, sunset yoga sessions, fresh seafood dinners and bohemian acoustic jams over the Arabian Sea.',
    fullContent: [
      'Varkala is unlike any other beach in India. The sheer red cliffs drop dramatically down to golden sands, lined on top with coconut trees and vibrant backpacker cafes.',
      'Spending five days here with fellow wanderers allowed us to surf at sunrise, taste coastal delicacies, and watch unforgettable fiery sunsets from the cliff promenade.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[3], // Aman
    likes: 312,
    comments: 19,
    views: 8900,
    readTimeMins: 4
  },
  {
    id: 'story_kochi_culture',
    slug: 'kochi-culture-food',
    title: 'Kochi - Culture & Food Trail',
    destination: 'Kochi, Kerala',
    dates: '10 - 14 Jun 2025',
    summary: 'A deep dive into Fort Kochi art biennale heritage, Jew Town spice warehouses, and mouthwatering coastal appams.',
    fullContent: [
      'Kochi smells of pepper, cardamom, and sea salt. Walking along the waterfront as the colossal Chinese fishing nets are hoisted in synchrony is pure visual poetry.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1558025638-565ae7710b3f?auto=format&fit=crop&w=1200&q=85',
    author: mockUsers[4], // Priya
    likes: 245,
    comments: 15,
    views: 6400,
    readTimeMins: 5
  },
  {
    id: 'story_munnar_escape',
    slug: 'munnar-nature-escape',
    title: 'Munnar - Nature Escape',
    destination: 'Munnar, Kerala',
    dates: '1 - 6 May 2025',
    summary: 'Solo backpacking turned into an unforgettable group trek through Meesapulimala and tea plantations.',
    fullContent: [
      'The best journeys are the ones where you leave with more friends than you started with. Munnar was cold, misty, and utterly restorative.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    author: mockUsers[5], // Rohan
    likes: 198,
    comments: 11,
    views: 5200,
    readTimeMins: 4
  },
  {
    id: 'story_goa_parties_beaches',
    slug: 'goa-party-beaches',
    title: 'Goa - Party & Beaches',
    destination: 'Goa, Goa',
    dates: '18 - 23 Apr 2025',
    summary: 'From quiet South Goa secret coves to spirited North Goa night markets and seaside beach bonfires.',
    fullContent: [
      'Finding the hidden sweet water lake in Arambol and sharing sunset views with travellers from across the globe made this Goa trip special.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    author: mockUsers[6], // Sneha
    likes: 389,
    comments: 28,
    views: 11200,
    readTimeMins: 5
  },
  {
    id: 'story_hampi_boulders',
    slug: 'hampi-sunset-boulders',
    title: 'Hampi - Sunset on the Matanga Boulders',
    destination: 'Hampi, Karnataka',
    dates: '10 - 15 Mar 2025',
    summary: 'Renting bicycles among 600-year-old stone temple ruins and climbing Matanga Hill for an unforgettable golden hour.',
    fullContent: [
      'Hampi looks like a landscape sculpted by giants. Colossal granite boulders balance precariously atop one another, and tucked between them are the breathtaking pavilions of the Vijayanagara Empire.',
      'Our group crossed the Tungabhadra river in circular wicker coracles, explored the musical pillars at Vittala Temple, and concluded every evening on Hippie Island with coconut water and acoustic guitar.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600100397608-f010f443b7d4?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[8] || mockUsers[1], // Vikram
    likes: 420,
    comments: 31,
    views: 14800,
    readTimeMins: 6
  },
  {
    id: 'story_coorg_coffee',
    slug: 'coorg-monsoons-coffee',
    title: 'Coorg - Monsoons & Coffee Blossoms',
    destination: 'Coorg, Karnataka',
    dates: '02 - 07 Jun 2025',
    summary: 'A mist-shrouded retreat through Kodagu coffee plantations, homestyle pepper pork curry, and Tadiandamol summit winds.',
    fullContent: [
      'Waking up in a 19th-century coffee plantation bungalow to the sound of cicadas and fresh roasted Arabica beans was pure heaven.',
      'The trek up Tadiandamol peak brought sudden mountain cloudbursts, but reaching the summit with our four-person crew made every muddy step worth it.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[7] || mockUsers[2], // Ananya
    likes: 367,
    comments: 22,
    views: 9800,
    readTimeMins: 5
  },
  {
    id: 'story_alleppey_canals',
    slug: 'alleppey-village-canals',
    title: 'Alleppey - Village Canals & Houseboat Living',
    destination: 'Alleppey, Kerala',
    dates: '12 - 16 Jan 2025',
    summary: 'Floating gently across Vembanad lake, eating fresh pearl spot fish on banana leaves, and canoe drifting through narrow canals.',
    fullContent: [
      'While the large houseboats are iconic, our best memory was waking up early and renting a small wooden country canoe to slip through the tiny canals where village children row themselves to school.',
      'The tranquility of life along the water teaches you to slow down and truly absorb each passing moment.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[4], // Priya
    likes: 512,
    comments: 44,
    views: 16700,
    readTimeMins: 7
  },
  {
    id: 'story_gokarna_cliffs',
    slug: 'gokarna-5-beach-cliff-walk',
    title: 'Gokarna - The 5-Beach Cliff Walk',
    destination: 'Gokarna, Karnataka',
    dates: '14 - 18 Feb 2025',
    summary: 'Skipping tourist buses and hiking the wild rocky headlands connecting Kudle, Om, Half Moon, and Paradise beaches.',
    fullContent: [
      'We started our hike at Kudle beach before the sun got fierce. Scrambling over the laterite rocks overlooking Om Beach, dolphins broke the calm morning surface.',
      'By sunset, we were sitting around a driftwood fire on Paradise Beach with nothing but the sound of the Arabian Sea.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[9] || mockUsers[3], // Kavya
    likes: 478,
    comments: 38,
    views: 13900,
    readTimeMins: 5
  },
  {
    id: 'story_meghalaya_roots',
    slug: 'meghalaya-living-root-bridges',
    title: 'Meghalaya - Trekking to the Living Root Bridges',
    destination: 'Meghalaya, Northeast',
    dates: '20 - 27 Nov 2024',
    summary: 'Descending 3,500 mossy steps into the dense Khasi jungle to touch centuries-old bio-engineered Ficus tree root bridges.',
    fullContent: [
      'Deep in the rainforest of Nongriat, human hands and living trees have formed a partnership spanning generations. Standing on the double-decker root bridge above a crystal-blue natural pool is humbling beyond description.',
      'Our small group of six bonded over tired knees, warm black tea in bamboo cups, and natural fish spa pools.'
    ],
    coverImageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
    ],
    author: mockUsers[10] || mockUsers[1], // Tarun
    likes: 640,
    comments: 52,
    views: 21500,
    readTimeMins: 8
  }
];
