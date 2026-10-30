import { EmergencyContact, SharedAccessRecord } from '../types';

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    id: 'em_1',
    name: 'Aisha Ali',
    relation: 'Sister',
    phone: '+91 98765 43210',
    isPrimary: true,
  },
  {
    id: 'em_2',
    name: 'Dr. Tariq Mahmood',
    relation: 'Family Physician',
    phone: '+91 90101 43211',
    isPrimary: false,
  },
  {
    id: 'em_3',
    name: 'Rashid Khan',
    relation: 'Close Friend',
    phone: '+91 97455 11223',
    isPrimary: false,
  },
];

export interface TrustedContact {
  id: string;
  name: string;
  relation: string;
  canViewVault: boolean;
  canTrackTripLocation: boolean;
  avatarUrl: string;
  isTripMember?: boolean;
}

export const mockTrustedContacts: TrustedContact[] = [
  {
    id: 'tc_ayesha',
    name: 'Ayesha Khan',
    relation: 'Trip member',
    canViewVault: true,
    canTrackTripLocation: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isTripMember: true,
  },
  {
    id: 'tc_rohit',
    name: 'Rohit Sharma',
    relation: 'Trip member',
    canViewVault: true,
    canTrackTripLocation: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isTripMember: true,
  },
  {
    id: 'tc_priya',
    name: 'Priya S.',
    relation: 'Trip member',
    canViewVault: true,
    canTrackTripLocation: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    isTripMember: true,
  },
  {
    id: 'tc_aisha',
    name: 'Aisha Ali',
    relation: 'Sister',
    canViewVault: true,
    canTrackTripLocation: true,
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isTripMember: false,
  },
];

export const mockSharedAccessRecords: SharedAccessRecord[] = [
  {
    id: 'share_1',
    documentId: 'doc_passport_india',
    documentName: 'Passport',
    documentType: 'Passport',
    sharedWithName: 'Ayesha Khan',
    sharedWithRole: 'Trip member',
    sharedWithAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    permission: 'View',
    expires: 'Until trip end',
    createdAt: '12 Oct 2025',
    active: true,
  },
  {
    id: 'share_2',
    documentId: 'doc_flight_ticket_delhi',
    documentName: 'Flight Ticket',
    documentType: 'FlightTicket',
    sharedWithName: 'Rohit Sharma',
    sharedWithRole: 'Trip member',
    sharedWithAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    permission: 'View • Download',
    expires: '15 Oct 2025',
    createdAt: '10 Oct 2025',
    active: true,
  },
  {
    id: 'share_3',
    documentId: 'doc_insurance_policy',
    documentName: 'Travel Insurance',
    documentType: 'Insurance',
    sharedWithName: 'Priya S.',
    sharedWithRole: 'Trip member',
    sharedWithAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    permission: 'View',
    expires: 'Until trip end',
    createdAt: '08 Oct 2025',
    active: true,
  },
  {
    id: 'share_4',
    documentId: 'doc_hotel_booking_munnar',
    documentName: 'Hotel Booking',
    documentType: 'HotelBooking',
    sharedWithName: 'Rohit Sharma',
    sharedWithRole: 'Trip member',
    sharedWithAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    permission: 'View',
    expires: '16 Oct 2025',
    createdAt: '07 Oct 2025',
    active: true,
  },
];
