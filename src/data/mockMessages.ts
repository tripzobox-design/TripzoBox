import { NotificationItem, ChatMessage } from '../types';
import { mockUsers } from './mockUsers';

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif_1',
    type: 'trip_invite',
    title: 'Trip Invite Accepted',
    message: 'Arjun Sharma confirmed your spot in the Munnar Adventure group.',
    timestamp: '10 mins ago',
    read: false,
    link: '/app/trips/trip_munnar_1'
  },
  {
    id: 'notif_2',
    type: 'story_like',
    title: 'New Story Kudos',
    message: 'Riya Sharma and 8 others loved your Munnar tea plantation diary entry.',
    timestamp: '2 hours ago',
    read: false,
    link: '/app/diary'
  },
  {
    id: 'notif_3',
    type: 'trip_update',
    title: 'Trip Chat Update',
    message: 'New packing tips posted in Varkala Beach vibes group discussion.',
    timestamp: '1 day ago',
    read: true,
    link: '/app/trips/trip_varkala_1'
  },
  {
    id: 'notif_4',
    type: 'system',
    title: 'Vault Security Verification',
    message: 'Your Driving License offline copy was refreshed successfully.',
    timestamp: '3 days ago',
    read: true,
    link: '/app/vault'
  }
];

export interface ChatThread {
  id: string;
  tripId: string;
  tripName: string;
  coverImage: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  membersCount: number;
  messages: { id: string; senderName: string; avatarUrl: string; isCurrentUser: boolean; text: string; time: string }[];
}

export const mockChatThreads: ChatThread[] = [
  {
    id: 'thread_munnar',
    tripId: 'trip_munnar_1',
    tripName: 'Munnar Adventure Group',
    coverImage: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Looking forward to the local spice walk! See you all in Kochi.',
    time: '2:40 PM',
    unreadCount: 2,
    membersCount: 4,
    messages: [
      { id: '1', senderName: 'Arjun Sharma', avatarUrl: mockUsers[1].avatarUrl, isCurrentUser: false, text: 'Hey everyone! Excited to have you all on the Munnar trek. Don’t forget to pack a light fleece jacket.', time: '10:30 AM' },
      { id: '2', senderName: 'Mubarak Ali', avatarUrl: mockUsers[0].avatarUrl, isCurrentUser: true, text: 'Can’t wait! Are hiking poles needed or will regular sports shoes do?', time: '11:15 AM' },
      { id: '3', senderName: 'Arjun Sharma', avatarUrl: mockUsers[1].avatarUrl, isCurrentUser: false, text: 'Good grip sports shoes are plenty! The trails are gentle and scenic.', time: '11:20 AM' },
      { id: '4', senderName: 'Riya Sharma', avatarUrl: mockUsers[2].avatarUrl, isCurrentUser: false, text: 'Looking forward to the local spice walk! See you all in Kochi next week.', time: '2:40 PM' }
    ]
  },
  {
    id: 'thread_varkala',
    tripId: 'trip_varkala_1',
    tripName: 'Varkala Beach Vibes Crew',
    coverImage: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=400&q=80',
    lastMessage: 'Sunset juice meet-and-greet on North Cliff at 5:30 PM!',
    time: 'Yesterday',
    unreadCount: 0,
    membersCount: 3,
    messages: [
      { id: '1', senderName: 'Riya Sharma', avatarUrl: mockUsers[2].avatarUrl, isCurrentUser: false, text: 'Varkala sunsets await! Pack breezy cottons and sunscreen ☀️', time: 'Yesterday' }
    ]
  }
];
