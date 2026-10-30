import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Destination } from '../models/Destination.js';
import { DiaryEntry } from '../models/DiaryEntry.js';
import { Story } from '../models/Story.js';
import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { VaultDocument } from '../models/VaultDocument.js';
import {
  EmergencyContact,
  TrustedContact,
  SharedAccessRecord,
  VaultSettings,
} from '../models/VaultSettings.js';

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Purging existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Trip.deleteMany({}),
      JoinRequest.deleteMany({}),
      Destination.deleteMany({}),
      DiaryEntry.deleteMany({}),
      Story.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      VaultDocument.deleteMany({}),
      EmergencyContact.deleteMany({}),
      TrustedContact.deleteMany({}),
      SharedAccessRecord.deleteMany({}),
      VaultSettings.deleteMany({}),
    ]);

    console.log('[Seed] Collections purged. Inserting seed data...');

    // 1. Seed Users
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const currentUser = {
      id: 'user_mubarak',
      name: 'Mubarak Ali',
      username: 'mubarak_travels',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      coverUrl:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
      city: 'Kerala',
      country: 'India',
      languages: ['English', 'Malayalam', 'Hindi', 'Tamil'],
      email: 'mubarakallansari@gmail.com',
      phone: '+91 98765 43210',
      password: passwordHash,
      birthDate: '1998-05-14',
      gender: 'male' as const,
      travelStyle: 'Solo',
      securityQuestion: "What is your mother's name?",
      securityAnswer: 'amina',
      recoveryCodes: ['8P3K-2D9Q', '4G7P-1KDM', '2ZNV-988C', '6TQ1-3L5D', 'H9W2-7K4F', 'D5JS-0P3R'],
      emailVerified: true,
      phoneVerified: true,
      bio: 'Travel enthusiast | Nature lover | Food explorer. Exploring mountains and misty hills.',
      travelInterests: ['Hiking', 'Nature', 'Photography', 'Food', 'Culture'],
      budgetStyle: 'comfort' as const,
      travelPace: 'Balanced',
      preferredGroupSize: '4-8 travellers',
      dreamDestination: 'Ladakh',
      stats: { trips: 12, stories: 5, followers: 48, following: 12 },
      role: 'user' as const,
    };

    const otherUsers = [
      {
        id: 'user_aarav',
        name: 'Aarav Sharma',
        username: 'aarav_sharma',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        city: 'Bengaluru',
        country: 'India',
        languages: ['Hindi', 'English'],
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 11111',
        password: passwordHash,
        bio: 'Trip Leader & explorer. Love gathering nature lovers for unforgettable mountain hikes.',
        travelInterests: ['Nature', 'Trekking', 'Photography', 'Food'],
        budgetStyle: 'mid-range' as const,
        stats: { trips: 4, stories: 3, followers: 240, following: 80 },
        role: 'user' as const,
      },
      {
        id: 'user_neha',
        name: 'Neha Sharma',
        username: 'neha_explores',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        city: 'Bengaluru, Karnataka',
        country: 'India',
        languages: ['Hindi', 'English'],
        email: 'neha.sharma@example.com',
        phone: '+91 98765 22222',
        password: passwordHash,
        travelStyle: 'Solo',
        bio: 'Hi! I love trekking and exploring new places. This trip looks amazing. I would love to join!',
        travelInterests: ['Nature', 'Trekking', 'Adventure'],
        budgetStyle: 'mid-range' as const,
        stats: { trips: 6, stories: 4, followers: 150, following: 70 },
        role: 'user' as const,
      },
      {
        id: 'user_rohit',
        name: 'Rohit Verma',
        username: 'rohit_verma',
        avatarUrl:
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        city: 'Chennai, Tamil Nadu',
        country: 'India',
        languages: ['English', 'Hindi'],
        email: 'rohit.verma@example.com',
        phone: '+91 98765 33333',
        password: passwordHash,
        travelStyle: 'Group',
        bio: 'Hey! I am a nature and photography enthusiast. Would love to be part of this trip.',
        travelInterests: ['Photography', 'Mountains', 'Nature'],
        budgetStyle: 'comfort' as const,
        stats: { trips: 8, stories: 5, followers: 310, following: 120 },
        role: 'user' as const,
      },
      {
        id: 'user_priya',
        name: 'Priya Nair',
        username: 'priya_nair',
        avatarUrl:
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        city: 'Kochi, Kerala',
        country: 'India',
        languages: ['English', 'Malayalam'],
        email: 'priya.nair@example.com',
        phone: '+91 98765 44444',
        password: passwordHash,
        travelStyle: 'Solo',
        bio: 'Quiet tea plantation wanderer and amateur botanist.',
        travelInterests: ['Nature', 'Tea Gardens', 'Photography'],
        budgetStyle: 'mid-range' as const,
        stats: { trips: 3, stories: 2, followers: 90, following: 45 },
        role: 'user' as const,
      },
      {
        id: 'user_arjun',
        name: 'Arjun Mehta',
        username: 'arjun_mehta',
        avatarUrl:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        city: 'Mumbai',
        country: 'India',
        languages: ['Hindi', 'English'],
        email: 'arjun.mehta@example.com',
        phone: '+91 98765 55555',
        password: passwordHash,
        travelStyle: 'Group',
        bio: 'Backpacker, sunrise chaser, foodie.',
        travelInterests: ['Trekking', 'Food', 'Culture'],
        budgetStyle: 'budget' as const,
        stats: { trips: 10, stories: 6, followers: 420, following: 110 },
        role: 'user' as const,
      },
    ];

    await User.insertMany([currentUser, ...otherUsers]);
    console.log('[Seed] Users inserted.');

    // 2. Seed Trips
    const trips = [
      {
        id: 'trip_munnar_1',
        name: 'Munnar Weekend Escape',
        destination: 'Munnar, Kerala',
        startCity: 'Bengaluru',
        startDate: '12 Dec 2025',
        endDate: '14 Dec 2025',
        durationDays: 3,
        budgetPerPerson: 3500,
        tripType: 'group',
        travelStyle: 'Group',
        badge: 'Group Trip',
        rating: 4.8,
        reviewCount: 24,
        spotsLeft: 2,
        organizerName: 'Priya S.',
        tags: ['Nature', 'Trekking', 'Photography'],
        languages: ['Hindi', 'English', 'Tamil'],
        preferences: ['Nature', 'Trekking', 'Photography', 'Food'],
        description:
          'Escape to the misty hills of Munnar! Perfect for nature lovers with tea gardens, waterfalls and local food.',
        highlights: ['Tea Gardens', 'Waterfalls', 'Local Food', 'Trekking'],
        inclusions: ['Transport', 'Accommodation', 'Meals (breakfast + dinner)'],
        rules: ['Be respectful', 'No alcohol', 'Keep the group active'],
        leader: {
          id: otherUsers[3].id,
          name: otherUsers[3].name,
          username: otherUsers[3].username,
          avatarUrl: otherUsers[3].avatarUrl,
          city: otherUsers[3].city,
        },
        members: [
          { id: otherUsers[3].id, name: otherUsers[3].name, avatarUrl: otherUsers[3].avatarUrl, role: 'Trip Leader' },
          { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: 'Member' },
          { id: otherUsers[0].id, name: otherUsers[0].name, avatarUrl: otherUsers[0].avatarUrl, role: 'Member' },
        ],
        maxMembers: 5,
        difficulty: 'medium' as const,
        coverImageUrl:
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
        galleryImages: [
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        ],
        status: 'open' as const,
        roomType: 'public' as const,
        savedBy: [currentUser.id],
      },
      {
        id: 'trip_goa_vibes',
        name: 'Goa Beach Vibes',
        destination: 'Goa',
        startCity: 'Kochi',
        startDate: '20 Dec 2025',
        endDate: '23 Dec 2025',
        durationDays: 4,
        budgetPerPerson: 4500,
        tripType: 'group',
        travelStyle: 'Group',
        badge: 'Group Trip',
        rating: 4.6,
        reviewCount: 18,
        spotsLeft: 1,
        organizerName: 'Arjun M.',
        tags: ['Beaches', 'Nightlife', 'Food'],
        languages: ['Hindi', 'English'],
        preferences: ['Beaches', 'Food', 'Culture', 'Relaxation'],
        description: 'Golden sunsets, serene coconut groves, coastal seafood shacks, and night markets in North and South Goa.',
        highlights: ['Sunset Beach', 'Coastal Cafes', 'Nightlife', 'Scooter Rides'],
        inclusions: ['Hostel Stay', 'Scooter Rental', 'Breakfast'],
        rules: ['Good vibes only', 'Respect local culture'],
        leader: {
          id: otherUsers[4].id,
          name: otherUsers[4].name,
          username: otherUsers[4].username,
          avatarUrl: otherUsers[4].avatarUrl,
        },
        members: [
          { id: otherUsers[4].id, name: otherUsers[4].name, avatarUrl: otherUsers[4].avatarUrl, role: 'Trip Leader' },
          { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: 'Member' },
          { id: otherUsers[1].id, name: otherUsers[1].name, avatarUrl: otherUsers[1].avatarUrl, role: 'Member' },
          { id: otherUsers[2].id, name: otherUsers[2].name, avatarUrl: otherUsers[2].avatarUrl, role: 'Member' },
          { id: otherUsers[3].id, name: otherUsers[3].name, avatarUrl: otherUsers[3].avatarUrl, role: 'Member' },
        ],
        maxMembers: 6,
        difficulty: 'easy' as const,
        coverImageUrl:
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
        status: 'open' as const,
        roomType: 'public' as const,
        savedBy: [],
      },
      {
        id: 'trip_spiti_road',
        name: 'Spiti Valley Road Trip',
        destination: 'Himachal Pradesh',
        startCity: 'Delhi',
        startDate: '10 Jun 2025',
        endDate: '16 Jun 2025',
        durationDays: 7,
        budgetPerPerson: 6500,
        tripType: 'solo',
        travelStyle: 'Solo',
        badge: 'Solo Friendly',
        rating: 4.9,
        reviewCount: 32,
        spotsLeft: 2,
        organizerName: 'Neha K.',
        tags: ['Adventure', 'Mountains', 'Road Trip'],
        languages: ['Hindi', 'English'],
        preferences: ['Mountains', 'Adventure', 'Photography', 'Backpacking'],
        description: 'High mountain passes, Tibetan monasteries, starry skies at 14,000 ft, and unforgettable road trip.',
        highlights: ['Key Monastery', 'Kunzum Pass', 'Chandra Taal', 'Langza Buddha'],
        inclusions: ['SUV Transport', 'Homestays', 'Oxygen Support', 'Meals'],
        rules: ['Carry warm layers', 'Stay hydrated'],
        leader: {
          id: otherUsers[1].id,
          name: otherUsers[1].name,
          username: otherUsers[1].username,
          avatarUrl: otherUsers[1].avatarUrl,
        },
        members: [
          { id: otherUsers[1].id, name: otherUsers[1].name, avatarUrl: otherUsers[1].avatarUrl, role: 'Trip Leader' },
          { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: 'Member' },
        ],
        maxMembers: 4,
        difficulty: 'hard' as const,
        coverImageUrl:
          'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
        status: 'open' as const,
        roomType: 'public' as const,
        savedBy: [],
      },
      {
        id: 'trip_rishikesh_camp',
        name: 'Rishikesh Adventure Camp',
        destination: 'Rishikesh, Uttarakhand',
        startCity: 'Delhi',
        startDate: '05 Nov 2025',
        endDate: '08 Nov 2025',
        durationDays: 4,
        budgetPerPerson: 3800,
        tripType: 'group',
        travelStyle: 'Group',
        badge: 'Group Trip',
        rating: 4.7,
        reviewCount: 21,
        spotsLeft: 4,
        organizerName: 'Karan S.',
        tags: ['Rafting', 'Camping', 'Nature'],
        languages: ['Hindi', 'English'],
        preferences: ['Adventure', 'Nature', 'Camping', 'Photography'],
        description: 'Conquer rapids on the Ganges, camp beside sandy banks, and enjoy acoustic bonfire jams.',
        highlights: ['River Rafting 16km', 'Cliff Jumping', 'Riverside Campfire', 'Ganga Aarti'],
        inclusions: ['Camp Tents', 'Rafting Gear & Guide', 'All Meals', 'Bonfire'],
        rules: ['Wear life jackets', 'No littering river'],
        leader: {
          id: otherUsers[2].id,
          name: otherUsers[2].name,
          username: otherUsers[2].username,
          avatarUrl: otherUsers[2].avatarUrl,
        },
        members: [
          { id: otherUsers[2].id, name: otherUsers[2].name, avatarUrl: otherUsers[2].avatarUrl, role: 'Trip Leader' },
          { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl, role: 'Member' },
          { id: otherUsers[3].id, name: otherUsers[3].name, avatarUrl: otherUsers[3].avatarUrl, role: 'Member' },
          { id: otherUsers[4].id, name: otherUsers[4].name, avatarUrl: otherUsers[4].avatarUrl, role: 'Member' },
        ],
        maxMembers: 8,
        difficulty: 'medium' as const,
        coverImageUrl:
          'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=1200&q=80',
        status: 'open' as const,
        roomType: 'public' as const,
        savedBy: [],
      },
      {
        id: 'trip_kochi_heritage',
        name: 'Kochi Heritage & Food Trail',
        destination: 'Kochi, Kerala',
        startCity: 'Kochi',
        startDate: '14 Nov 2025',
        endDate: '16 Nov 2025',
        durationDays: 3,
        budgetPerPerson: 4000,
        tripType: 'couple',
        travelStyle: 'Couple',
        badge: 'Couple Friendly',
        rating: 4.5,
        reviewCount: 16,
        spotsLeft: 2,
        organizerName: 'Sneha P.',
        tags: ['Culture', 'Food', 'Heritage'],
        languages: ['Hindi', 'English', 'Tamil'],
        preferences: ['Culture', 'Food', 'Photography', 'Heritage'],
        description: 'Sunset walks past giant Chinese fishing nets, spicy culinary trails in Jew Town, and cozy cafe hopping.',
        highlights: ['Chinese Fishing Nets', 'Jew Town Spice Walk', 'Kathakali', 'Seafood Trail'],
        inclusions: ['Boutique Stay', 'Guided Food Walk', 'Ferry Tickets', 'Breakfast'],
        rules: ['Respect historical sites', 'Try local delicacies'],
        leader: {
          id: otherUsers[0].id,
          name: otherUsers[0].name,
          username: otherUsers[0].username,
          avatarUrl: otherUsers[0].avatarUrl,
        },
        members: [
          { id: otherUsers[0].id, name: otherUsers[0].name, avatarUrl: otherUsers[0].avatarUrl, role: 'Trip Leader' },
          { id: otherUsers[1].id, name: otherUsers[1].name, avatarUrl: otherUsers[1].avatarUrl, role: 'Member' },
        ],
        maxMembers: 4,
        difficulty: 'easy' as const,
        coverImageUrl:
          'https://images.unsplash.com/photo-1558025638-565ae7710b3f?auto=format&fit=crop&w=1200&q=80',
        status: 'open' as const,
        roomType: 'public' as const,
        savedBy: [],
      },
      {
        id: 'trip_ladakh_bike',
        name: 'Ladakh Bike Trip',
        destination: 'Ladakh',
        startCity: 'Chandigarh',
        startDate: '25 Jun 2025',
        endDate: '02 Jul 2025',
        durationDays: 8,
        budgetPerPerson: 7500,
        tripType: 'group',
        travelStyle: 'Group',
        badge: 'Group Trip',
        rating: 4.8,
        reviewCount: 27,
        spotsLeft: 3,
        organizerName: 'Rahul T.',
        tags: ['Adventure', 'Biking', 'Mountains'],
        languages: ['Hindi', 'English'],
        preferences: ['Mountains', 'Adventure', 'Photography', 'Biking'],
        description: 'Ride across Khardung La at 17,582 ft, camp beside Pangong Lake, and experience Ladakh on two wheels.',
        highlights: ['Khardung La Pass', 'Pangong Tso', 'Nubra Valley Dunes', 'Magnet Hill'],
        inclusions: ['Royal Enfield Himalayan', 'Fuel & Mechanic Support', 'Homestay & Tents'],
        rules: ['Valid Motorcycle License', 'Helmet mandatory', 'Acclimatize in Leh'],
        leader: {
          id: otherUsers[0].id,
          name: otherUsers[0].name,
          username: otherUsers[0].username,
          avatarUrl: otherUsers[0].avatarUrl,
        },
        members: [
          { id: otherUsers[0].id, name: otherUsers[0].name, avatarUrl: otherUsers[0].avatarUrl, role: 'Trip Leader' },
          { id: otherUsers[2].id, name: otherUsers[2].name, avatarUrl: otherUsers[2].avatarUrl, role: 'Member' },
        ],
        maxMembers: 6,
        difficulty: 'hard' as const,
        coverImageUrl:
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
        status: 'open' as const,
        roomType: 'public' as const,
        savedBy: [],
      },
    ];

    await Trip.insertMany(trips);
    console.log('[Seed] Trips inserted.');

    // 3. Seed Join Requests for Munnar Trip
    const joinRequests = [
      {
        id: 'req_neha',
        tripId: 'trip_munnar_1',
        userId: otherUsers[1].id,
        user: {
          id: otherUsers[1].id,
          name: 'Neha Sharma',
          location: 'Bengaluru, Karnataka',
          avatarUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          travelStyle: 'Solo',
          languages: 'Hindi, English',
          budget: '₹5k - ₹8k',
        },
        message:
          'Hi! I love trekking and exploring new places. This trip looks amazing. I would love to join!',
        status: 'pending' as const,
        requestedAt: '2h ago',
      },
      {
        id: 'req_rohit',
        tripId: 'trip_munnar_1',
        userId: otherUsers[2].id,
        user: {
          id: otherUsers[2].id,
          name: 'Rohit Verma',
          location: 'Chennai, Tamil Nadu',
          avatarUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          travelStyle: 'Group',
          languages: 'English, Hindi',
          budget: '₹5k - ₹10k',
        },
        message:
          'Hey! I am a nature and photography enthusiast. Would love to be part of this trip.',
        status: 'pending' as const,
        requestedAt: '5h ago',
      },
    ];

    await JoinRequest.insertMany(joinRequests);
    console.log('[Seed] Join requests inserted.');

    // 4. Seed Destinations (8 matching Explore Page screenshot)
    const destinations = [
      {
        id: 'dest_munnar',
        slug: 'munnar',
        name: 'Munnar',
        state: 'Kerala',
        category: 'Mountains' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Tea gardens, misty mountains and peaceful vibes. Perfect for nature lovers.',
        bestTimeToVisit: 'Sep - Mar',
        topAttractions: ['Echo Point', 'Tea Museum', 'Attukad Waterfalls', 'Anamudi Peak'],
        rating: 4.8,
        reviewCount: '1.2k',
        estimatedCostPerDay: '₹1,500 - ₹2,500',
        badge: 'Popular',
        tags: ['Trekking', 'Tea Gardens', 'Photo Spots'],
      },
      {
        id: 'dest_varkala',
        slug: 'varkala',
        name: 'Varkala',
        state: 'Kerala',
        category: 'Beaches' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Cliffside beaches, great food and chill vibes. A perfect place to relax and recharge.',
        bestTimeToVisit: 'Oct - Mar',
        topAttractions: ['Varkala Cliff', 'Papanasam Beach', 'Janardhana Temple', 'Kappil Beach'],
        rating: 4.7,
        reviewCount: '980',
        estimatedCostPerDay: '₹1,200 - ₹2,000',
        badge: 'Popular',
        tags: ['Beach', 'Cliff View', 'Food'],
      },
      {
        id: 'dest_ooty',
        slug: 'ooty',
        name: 'Ooty',
        state: 'Tamil Nadu',
        category: 'Mountains' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Blooming gardens, cool weather and scenic train rides. A classic hill station.',
        bestTimeToVisit: 'Apr - Jun',
        topAttractions: ['Botanical Garden', 'Nilgiri Mountain Railway', 'Ooty Lake', 'Doddabetta Peak'],
        rating: 4.6,
        reviewCount: '860',
        estimatedCostPerDay: '₹1,800 - ₹2,800',
        badge: 'Popular',
        tags: ['Botanical Garden', 'Train Ride', 'Nature'],
      },
      {
        id: 'dest_goa',
        slug: 'goa',
        name: 'Goa',
        state: 'Goa',
        category: 'Beaches' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Golden beaches, vibrant nightlife and laid-back vibes.',
        bestTimeToVisit: 'Nov - Feb',
        topAttractions: ['Palolem Beach', 'Fort Aguada', 'Anjuna Flea Market', 'Dudhsagar Falls'],
        rating: 4.5,
        reviewCount: '2.1k',
        estimatedCostPerDay: '₹1,500 - ₹2,500',
        badge: 'Popular',
        tags: ['Beaches', 'Nightlife', 'Water Sports'],
      },
      {
        id: 'dest_kochi',
        slug: 'kochi',
        name: 'Kochi',
        state: 'Kerala',
        category: 'Culture' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1558025638-565ae7710b3f?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Colonial charm, local food and beautiful backwaters.',
        bestTimeToVisit: 'Oct - Feb',
        topAttractions: ['Chinese Fishing Nets', 'Fort Kochi', 'Jew Town', 'Mattancherry Palace'],
        rating: 4.4,
        reviewCount: '1.1k',
        estimatedCostPerDay: '₹1,200 - ₹2,000',
        tags: ['Fort Kochi', 'Food', 'Culture'],
      },
      {
        id: 'dest_hampi',
        slug: 'hampi',
        name: 'Hampi',
        state: 'Karnataka',
        category: 'Culture' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Ancient ruins, boulders and surreal landscapes. A must-visit for history lovers.',
        bestTimeToVisit: 'Oct - Feb',
        topAttractions: ['Virupaksha Temple', 'Vijaya Vittala Temple', 'Matanga Hill', 'Lotus Mahal'],
        rating: 4.7,
        reviewCount: '1.5k',
        estimatedCostPerDay: '₹1,000 - ₹1,800',
        tags: ['Heritage', 'Trekking', 'Photography'],
      },
      {
        id: 'dest_rishikesh',
        slug: 'rishikesh',
        name: 'Rishikesh',
        state: 'Uttarakhand',
        category: 'Nature' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'River rafting, yoga and peaceful mountain views. Great for adventure and relaxation.',
        bestTimeToVisit: 'Sep - Nov',
        topAttractions: ['Laxman Jhula', 'Beatles Ashram', 'Triveni Ghat', 'Shivpuri Rafting'],
        rating: 4.3,
        reviewCount: '900',
        estimatedCostPerDay: '₹1,000 - ₹1,800',
        tags: ['Adventure', 'Yoga', 'Nature'],
      },
      {
        id: 'dest_alleppey',
        slug: 'alleppey',
        name: 'Alleppey',
        state: 'Kerala',
        category: 'Nature' as const,
        imageUrl:
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
        shortDescription:
          'Famous backwaters, houseboats and tranquil village life.',
        bestTimeToVisit: 'Oct - Mar',
        topAttractions: ['Alappuzha Beach', 'Vembanad Lake', 'Marari Beach', 'Kuttanad'],
        rating: 4.5,
        reviewCount: '760',
        estimatedCostPerDay: '₹1,500 - ₹2,500',
        tags: ['Houseboat', 'Backwaters', 'Nature'],
      },
    ];

    await Destination.insertMany(destinations);
    console.log('[Seed] Destinations inserted.');

    // 5. Seed Stories
    const stories = [
      {
        id: 'story_varkala',
        slug: 'varkala-more-than-just-a-beach',
        title: 'Varkala – More Than Just a Beach',
        destination: 'Varkala, Kerala',
        dates: '12 - 16 May 2025',
        summary:
          'From cliffside cafes to peaceful beaches, this trip was a perfect mix of relaxation and adventure...',
        coverImageUrl:
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        author: {
          id: otherUsers[3].id,
          name: otherUsers[3].name,
          avatarUrl: otherUsers[3].avatarUrl,
        },
        likes: 124,
        comments: 18,
        views: 890,
        readTimeMins: 4,
        badge: 'Featured',
        days: 4,
        photosCount: 28,
        placesCount: 12,
        timeAgo: '3 days ago',
        rating: 4.8,
        reviewCount: 124,
        tripType: 'Solo',
        travelStyle: ['Relaxation', 'Beaches', 'Food'],
        languages: ['English', 'Hindi'],
        tags: ['Beach', 'Sunset', 'Yoga'],
      },
      {
        id: 'story_munnar',
        slug: 'munnar-a-weekend-escape',
        title: 'Munnar – A Weekend Escape',
        destination: 'Munnar, Kerala',
        dates: '01 - 04 May 2025',
        summary:
          'Cool weather, endless tea gardens and some of the best food I have ever had. Munnar truly has a different kind of magic...',
        coverImageUrl:
          'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80',
        author: {
          id: otherUsers[4].id,
          name: otherUsers[4].name,
          avatarUrl: otherUsers[4].avatarUrl,
        },
        likes: 98,
        comments: 12,
        views: 650,
        readTimeMins: 3,
        badge: 'Popular',
        days: 3,
        photosCount: 32,
        placesCount: 10,
        timeAgo: '1 week ago',
        rating: 4.6,
        reviewCount: 98,
        tripType: 'Group',
        travelStyle: ['Nature', 'Trekking', 'Photography'],
        languages: ['Hindi', 'English'],
        tags: ['Tea Plantation', 'Misty Hills', 'Trekking'],
      },
    ];

    await Story.insertMany(stories);
    console.log('[Seed] Stories inserted.');

    // 6. Seed Vault Documents
    const vaultDocs = [
      {
        id: 'doc_passport_india',
        userId: currentUser.id,
        type: 'Passport' as const,
        name: 'Passport',
        validTill: '12 May 2030',
        referenceNumber: 'R21234567',
        visibility: 'trusted-contacts' as const,
        uploadedAt: '12 Oct 2025',
        isVerified: true,
        issuingCountry: 'India',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'doc_aadhaar_india',
        userId: currentUser.id,
        type: 'Aadhaar' as const,
        name: 'Aadhar Card',
        validTill: 'Lifetime',
        referenceNumber: 'XXXX-1234',
        visibility: 'private' as const,
        uploadedAt: '10 Oct 2025',
        isVerified: true,
        issuingCountry: 'India',
        thumbnailUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'doc_flight_ticket_delhi',
        userId: currentUser.id,
        type: 'FlightTicket' as const,
        name: 'Flight Ticket (Bengaluru → Delhi)',
        validTill: '15 Oct 2025',
        referenceNumber: '6E 217 • 15 Oct 2025',
        visibility: 'offline-available' as const,
        uploadedAt: '08 Oct 2025',
        isVerified: false,
        thumbnailUrl:
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'doc_insurance_policy',
        userId: currentUser.id,
        type: 'Insurance' as const,
        name: 'Travel Insurance',
        validTill: '25 Dec 2025',
        referenceNumber: 'Policy No. T-4567',
        visibility: 'trusted-contacts' as const,
        uploadedAt: '06 Oct 2025',
        isVerified: true,
        thumbnailUrl:
          'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=300&q=80',
      },
    ];

    await VaultDocument.insertMany(vaultDocs);
    console.log('[Seed] Vault documents inserted.');

    // 7. Seed Emergency & Trusted Contacts & Shared Records
    await EmergencyContact.insertMany([
      {
        id: 'em_1',
        userId: currentUser.id,
        name: 'Aisha Ali',
        relation: 'Sister',
        phone: '+91 98765 43210',
        isPrimary: true,
      },
      {
        id: 'em_2',
        userId: currentUser.id,
        name: 'Dr. Tariq Mahmood',
        relation: 'Family Physician',
        phone: '+91 90101 43211',
        isPrimary: false,
      },
    ]);

    await TrustedContact.insertMany([
      {
        id: 'tc_ayesha',
        userId: currentUser.id,
        name: 'Ayesha Khan',
        email: 'ayesha.khan@example.com',
        phone: '+91 98765 43210',
        hasVaultAccess: true,
      },
      {
        id: 'tc_rohit',
        userId: currentUser.id,
        name: 'Rohit Sharma',
        email: 'rohit.sharma@example.com',
        phone: '+91 98765 43212',
        hasVaultAccess: true,
      },
    ]);

    await SharedAccessRecord.insertMany([
      {
        id: 'share_passport_ayesha',
        userId: currentUser.id,
        documentId: 'doc_passport_india',
        documentName: 'Passport',
        documentType: 'Passport',
        sharedWithName: 'Ayesha Khan',
        sharedWithRole: 'Trip member',
        permission: 'View',
        expires: 'Until trip end',
        active: true,
      },
      {
        id: 'share_flight_rohit',
        userId: currentUser.id,
        documentId: 'doc_flight_ticket_delhi',
        documentName: 'Flight Ticket',
        documentType: 'FlightTicket',
        sharedWithName: 'Rohit Sharma',
        sharedWithRole: 'Trip member',
        permission: 'View • Download',
        expires: '15 Oct 2025',
        active: true,
      },
    ]);

    await VaultSettings.create({
      userId: currentUser.id,
      emergencyConfig: {
        includedDocTypes: ['Passport', 'Insurance'],
        primaryContact: '+91 98765 43210',
        secondaryContact: '+91 98765 43211',
      },
      securitySettings: {
        twoFactorEnabled: true,
        autoLockTime: '15 minutes',
      },
    });

    // 8. Seed Messages
    await Message.insertMany([
      {
        id: 'msg_1',
        tripId: 'trip_munnar_1',
        sender: {
          id: otherUsers[3].id,
          name: otherUsers[3].name,
          avatarUrl: otherUsers[3].avatarUrl,
        },
        text: 'Welcome to Munnar group coordination everyone! Looking forward to meeting in Kochi.',
        timestamp: 'Yesterday',
        readBy: [currentUser.id, otherUsers[3].id],
      },
      {
        id: 'msg_2',
        tripId: 'trip_munnar_1',
        sender: {
          id: currentUser.id,
          name: currentUser.name,
          avatarUrl: currentUser.avatarUrl,
        },
        text: 'Looking forward to the local spice walk! See you all in Kochi.',
        timestamp: '2:40 PM',
        readBy: [currentUser.id],
      },
    ]);

    // 9. Seed Notifications
    await Notification.insertMany([
      {
        id: 'notif_1',
        userId: currentUser.id,
        type: 'trip_invite',
        title: 'Trip Invite Accepted',
        message: 'Priya Nair confirmed your spot in the Munnar Weekend Escape group.',
        timestamp: '10 mins ago',
        read: false,
        link: '/app/trips/trip_munnar_1',
      },
      {
        id: 'notif_2',
        userId: currentUser.id,
        type: 'story_like',
        title: 'New Story Kudos',
        message: 'Riya Sharma and 8 others loved your Munnar tea plantation diary entry.',
        timestamp: '2 hours ago',
        read: false,
        link: '/app/diary',
      },
      {
        id: 'notif_3',
        userId: currentUser.id,
        type: 'system',
        title: 'Vault Security Verification',
        message: 'Your Driving License offline copy was refreshed successfully.',
        timestamp: '3 days ago',
        read: true,
        link: '/app/vault',
      },
    ]);

    console.log('✅ [Seed] Database successfully populated with realistic seed data!');
    process.exit(0);
  } catch (err) {
    console.error('❌ [Seed] Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();

