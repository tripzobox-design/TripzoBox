import { VaultDocument } from '../types';

export const mockDocuments: VaultDocument[] = [
  {
    id: 'doc_1',
    type: 'Passport',
    name: 'Passport',
    validTill: '12 Jan 2030',
    referenceNumber: 'Z8942014',
    visibility: 'trusted-contacts',
    uploadedAt: '10 Jan 2024'
  },
  {
    id: 'doc_2',
    type: 'Aadhaar',
    name: 'Aadhaar Card',
    validTill: 'Lifetime',
    referenceNumber: '•••• •••• 9214',
    visibility: 'private',
    uploadedAt: '12 Jan 2024'
  },
  {
    id: 'doc_3',
    type: 'DrivingLicense',
    name: 'Driving License',
    validTill: '15 Mar 2033',
    referenceNumber: 'KL-07-201500412',
    visibility: 'offline-available',
    uploadedAt: '15 Feb 2024'
  },
  {
    id: 'doc_4',
    type: 'Insurance',
    name: 'Travel Insurance',
    validTill: '25 Dec 2025',
    referenceNumber: 'POL-TIB-884910',
    visibility: 'trusted-contacts',
    uploadedAt: '01 Mar 2024'
  },
  {
    id: 'doc_5',
    type: 'FlightTicket',
    name: 'Flight Tickets',
    validTill: '12 May 2025',
    referenceNumber: 'Ref: GF5K20 (Air India Kochi)',
    visibility: 'offline-available',
    uploadedAt: '20 Apr 2025'
  },
  {
    id: 'doc_6',
    type: 'HotelBooking',
    name: 'Hotel Bookings',
    validTill: '18 May 2025',
    referenceNumber: 'Munnar Forest View Resort · 12-18 May 2025',
    visibility: 'offline-available',
    uploadedAt: '22 Apr 2025'
  },
  {
    id: 'doc_7',
    type: 'Other',
    name: 'Eravikulam Trekking Permit',
    validTill: '16 May 2025',
    referenceNumber: 'KL-FOR-2025-0982',
    visibility: 'trusted-contacts',
    uploadedAt: '25 Apr 2025'
  },
  {
    id: 'doc_8',
    type: 'Other',
    name: 'IRCTC Vande Bharat Express',
    validTill: '20 May 2025',
    referenceNumber: 'PNR: 4429018422 (Kochi - TVM)',
    visibility: 'offline-available',
    uploadedAt: '28 Apr 2025'
  },
  {
    id: 'doc_9',
    type: 'HotelBooking',
    name: 'Zostel Varkala North Cliff',
    validTill: '26 May 2025',
    referenceNumber: 'ZOS-VRK-8812 · 20-26 May 2025',
    visibility: 'offline-available',
    uploadedAt: '30 Apr 2025'
  },
  {
    id: 'doc_10',
    type: 'Insurance',
    name: 'Vaccination & Medical ICE',
    validTill: 'Lifetime',
    referenceNumber: 'COV-VAX-882190-KL',
    visibility: 'trusted-contacts',
    uploadedAt: '02 May 2025'
  },
  {
    id: 'doc_11',
    type: 'DrivingLicense',
    name: 'International Driving Permit',
    validTill: '14 Oct 2026',
    referenceNumber: 'IDP-IND-2024-8841',
    visibility: 'trusted-contacts',
    uploadedAt: '05 May 2025'
  }
];
