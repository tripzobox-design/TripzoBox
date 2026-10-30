import { Trip } from '../models/Trip.js';
import { JoinRequest } from '../models/JoinRequest.js';

export interface TripFilterQuery {
  destination?: string;
  category?: string;
  travelStyle?: string;
  minBudget?: number;
  maxBudget?: number;
  search?: string;
  roomType?: string;
  status?: string;
}

export const tripService = {
  /**
   * Builds Mongoose query criteria from search parameters
   */
  buildFilterQuery: (filters: TripFilterQuery) => {
    const query: any = {};

    if (filters.search) {
      const regex = new RegExp(filters.search.trim(), 'i');
      query.$or = [
        { name: regex },
        { destination: regex },
        { startCity: regex },
        { description: regex },
      ];
    } else if (filters.destination) {
      query.destination = new RegExp(filters.destination.trim(), 'i');
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.travelStyle) {
      query.travelStyle = filters.travelStyle;
    }

    if (filters.roomType) {
      query.roomType = filters.roomType;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.minBudget !== undefined || filters.maxBudget !== undefined) {
      query.budgetPerPerson = {};
      if (filters.minBudget !== undefined) query.budgetPerPerson.$gte = filters.minBudget;
      if (filters.maxBudget !== undefined) query.budgetPerPerson.$lte = filters.maxBudget;
    }

    return query;
  },

  /**
   * Verifies if a user can request to join a trip
   */
  canUserJoinTrip: async (
    tripId: string,
    userId: string
  ): Promise<{ canJoin: boolean; reason?: string }> => {
    const trip = await Trip.findOne({ id: tripId });
    if (!trip) {
      return { canJoin: false, reason: 'Trip not found' };
    }

    if (trip.leader && trip.leader.id === userId) {
      return { canJoin: false, reason: 'Trip leader is already a member' };
    }

    if (trip.members && trip.members.some((m) => m.id === userId)) {
      return { canJoin: false, reason: 'User is already a confirmed member of this trip' };
    }

    if (trip.members && trip.members.length >= trip.maxMembers) {
      return { canJoin: false, reason: 'Trip has reached its maximum member capacity' };
    }

    const existingRequest = await JoinRequest.findOne({
      tripId,
      userId,
      status: 'pending',
    });

    if (existingRequest) {
      return { canJoin: false, reason: 'A join request is already pending for this trip' };
    }

    return { canJoin: true };
  },
};
