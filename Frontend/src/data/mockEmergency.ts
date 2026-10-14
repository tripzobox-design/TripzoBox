import { EmergencyContact } from '../types';

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: 'em_1',
    name: 'Aisha Ali',
    relation: 'Sister',
    phone: '+91 98471 23456',
    isPrimary: true
  },
  {
    id: 'em_2',
    name: 'Dr. Tariq Mahmood',
    relation: 'Family Physician',
    phone: '+91 94470 98765',
    isPrimary: false
  },
  {
    id: 'em_3',
    name: 'Rashid Khan',
    relation: 'Close Friend',
    phone: '+91 97455 11223',
    isPrimary: false
  }
];

export interface TrustedContact {
  id: string;
  name: string;
  relation: string;
  canViewVault: boolean;
  canTrackTripLocation: boolean;
  avatarUrl: string;
}

export const mockTrustedContacts: TrustedContact[] = [
  {
    id: 'tc_1',
    name: 'Aisha Ali',
    relation: 'Sister',
    canViewVault: true,
    canTrackTripLocation: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'tc_2',
    name: 'Arjun Sharma',
    relation: 'Trip Leader (Munnar)',
    canViewVault: false,
    canTrackTripLocation: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
  }
];
