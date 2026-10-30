import { Request, Response, NextFunction } from 'express';
import { Trip, ITrip } from '../models/Trip.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Notification } from '../models/Notification.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTrips = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      q,
      destination,
      startCity,
      departureDate,
      tripType,
      budgetMax,
      durations,
      travelStyles,
      languages,
      groupSizes,
      inclusions,
      difficulties,
      onlyOpenSpots,
      minRating,
      categoryTab,
      sortBy = 'newest',
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const query: any = {};

    // 1. Visibility: Only show public trips or private trips user belongs to
    if (req.user) {
      query.$or = [
        { roomType: 'public', status: { $ne: 'draft' } },
        { 'leader.id': req.user.id },
        { 'members.id': req.user.id },
      ];
    } else {
      query.roomType = 'public';
      query.status = { $ne: 'draft' };
    }

    // 2. Search / Destination
    const searchTerm = (search || q || destination || '').trim();
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: regex },
          { destination: regex },
          { highlights: regex },
          { tags: regex },
        ],
      });
    }

    // 3. Start City
    if (startCity && startCity !== 'All Cities' && startCity !== 'all') {
      query.startCity = new RegExp(startCity.trim(), 'i');
    }

    // 4. Departure Date
    if (departureDate && departureDate.trim()) {
      const dateRegex = new RegExp(departureDate.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ startDate: dateRegex }, { endDate: dateRegex }],
      });
    }

    // 5. Trip Type
    if (tripType && tripType !== 'All' && tripType !== 'all') {
      const typeRegex = new RegExp(tripType.trim(), 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { tripType: typeRegex },
          { badge: typeRegex },
          { travelStyle: typeRegex },
          { tags: typeRegex },
        ],
      });
    }

    // 6. Budget Max
    if (budgetMax && parseInt(budgetMax, 10) < 10000) {
      query.budgetPerPerson = { $lte: parseInt(budgetMax, 10) };
    }

    // 7. Durations
    if (durations) {
      const durList = Array.isArray(durations) ? durations : durations.split(',');
      const durationConditions: any[] = [];
      for (const d of durList) {
        if (d === '1-2') durationConditions.push({ durationDays: { $gte: 1, $lte: 2 } });
        else if (d === '3-5') durationConditions.push({ durationDays: { $gte: 3, $lte: 5 } });
        else if (d === '6-10') durationConditions.push({ durationDays: { $gte: 6, $lte: 10 } });
        else if (d === '10+') durationConditions.push({ durationDays: { $gte: 10 } });
      }
      if (durationConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: durationConditions });
      }
    }

    // 8. Travel Styles
    if (travelStyles) {
      const styleList = (Array.isArray(travelStyles) ? travelStyles : travelStyles.split(',')).map(
        (s) => new RegExp(s.trim(), 'i')
      );
      if (styleList.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [{ preferences: { $in: styleList } }, { tags: { $in: styleList } }],
        });
      }
    }

    // 9. Languages
    if (languages) {
      const langList = (Array.isArray(languages) ? languages : languages.split(',')).map(
        (l) => new RegExp(l.trim(), 'i')
      );
      if (langList.length > 0) {
        query.languages = { $in: langList };
      }
    }

    // 10. Group Sizes
    if (groupSizes) {
      const sizeList = Array.isArray(groupSizes) ? groupSizes : groupSizes.split(',');
      const sizeConditions: any[] = [];
      for (const s of sizeList) {
        if (s === 'intimate') sizeConditions.push({ maxMembers: { $lte: 4 } });
        else if (s === 'standard') sizeConditions.push({ maxMembers: { $gte: 5, $lte: 8 } });
        else if (s === 'large') sizeConditions.push({ maxMembers: { $gt: 8 } });
      }
      if (sizeConditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push({ $or: sizeConditions });
      }
    }

    // 11. Inclusions
    if (inclusions) {
      const incList = Array.isArray(inclusions) ? inclusions : inclusions.split(',');
      const incRegexes = incList.map((inc) => {
        if (inc === 'transport') return /transport|suv|volvo|bus|flight|bike|ferry|scooter/i;
        if (inc === 'accommodation') return /stay|accommodation|hostel|hotel|homestay|tent|camp|cottage/i;
        if (inc === 'meals') return /meal|breakfast|dinner|food/i;
        if (inc === 'gear') return /gear|guide|equipment|tour|rafting|support/i;
        return new RegExp(inc, 'i');
      });
      if (incRegexes.length > 0) {
        query.inclusions = { $all: incRegexes };
      }
    }

    // 12. Difficulties
    if (difficulties) {
      const diffList = Array.isArray(difficulties) ? difficulties : difficulties.split(',');
      if (diffList.length > 0) {
        query.difficulty = { $in: diffList };
      }
    }

    // 13. Only Open Spots
    if (onlyOpenSpots === 'true') {
      query.status = 'open';
      query.$expr = { $lt: [{ $size: '$members' }, '$maxMembers'] };
    }

    // 14. Min Rating
    if (minRating && parseFloat(minRating) > 0) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // 15. Sort Order
    let sortQuery: any = { createdAt: -1 };
    if (sortBy === 'price_asc') sortQuery = { budgetPerPerson: 1 };
    else if (sortBy === 'price_desc') sortQuery = { budgetPerPerson: -1 };
    else if (sortBy === 'rating') sortQuery = { rating: -1 };
    else if (sortBy === 'duration') sortQuery = { durationDays: 1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [trips, total] = await Promise.all([
      Trip.find(query).sort(sortQuery).skip(skip).limit(limitNum),
      Trip.countDocuments(query),
    ]);

    sendSuccess(
      res,
      trips,
      'Trips retrieved successfully',
      200,
      {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + trips.length < total,
      }
    );
  } catch (error) {
    next(error);
  }
};

export const getMyTrips = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const myTrips = await Trip.find({
      $or: [{ 'leader.id': req.user.id }, { 'members.id': req.user.id }],
    }).sort({ createdAt: -1 });

    sendSuccess(res, myTrips, 'User trips retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getSavedTrips = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const saved = await Trip.find({ savedBy: req.user.id });
    const savedIds = saved.map((t) => t.id);

    sendSuccess(res, { savedTripIds: savedIds, trips: saved });
  } catch (error) {
    next(error);
  }
};

export const toggleSaveTrip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    const isSaved = trip.savedBy.includes(req.user.id);
    if (isSaved) {
      trip.savedBy = trip.savedBy.filter((uid) => uid !== req.user!.id);
    } else {
      trip.savedBy.push(req.user.id);
    }

    await trip.save();

    sendSuccess(
      res,
      { saved: !isSaved, tripId: trip.id },
      !isSaved ? 'Trip bookmarked' : 'Trip removed from bookmarks'
    );
  } catch (error) {
    next(error);
  }
};

export const getTripById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    // Access check for private trips
    if (trip.roomType === 'private') {
      const isAuthorized =
        req.user &&
        (trip.leader.id === req.user.id || trip.members.some((m) => m.id === req.user!.id));
      const roomCodeMatches = req.query.code && req.query.code === trip.roomCode;

      if (!isAuthorized && !roomCodeMatches) {
        sendError(res, 'This trip is private. An invitation or room code is required.', 403);
        return;
      }
    }

    sendSuccess(res, trip);
  } catch (error) {
    next(error);
  }
};

export const createTrip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const body = req.body;
    const roomCode = body.roomCode || `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTrip = new Trip({
      ...body,
      id: `trip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leader: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        avatarUrl: req.user.avatarUrl,
        city: req.user.city,
        email: req.user.email,
        phone: req.user.phone,
      },
      members: [
        {
          id: req.user.id,
          name: req.user.name,
          avatarUrl: req.user.avatarUrl,
          role: 'Trip Leader',
          city: req.user.city,
          email: req.user.email,
        },
      ],
      roomCode,
      status: body.status || 'open',
    });

    await newTrip.save();

    // Increment user's trips stat
    req.user.stats.trips += 1;
    await req.user.save();

    sendSuccess(res, newTrip, 'Trip created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.leader.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the trip leader can update this trip', 403);
      return;
    }

    Object.assign(trip, req.body);
    await trip.save();

    sendSuccess(res, trip, 'Trip updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.leader.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the trip leader can delete this trip', 403);
      return;
    }

    await Trip.deleteOne({ id });
    await JoinRequest.deleteMany({ tripId: id });

    sendSuccess(res, null, 'Trip cancelled and removed');
  } catch (error) {
    next(error);
  }
};

export const updateRoomType = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const { roomType } = req.body;

    if (!['public', 'private'].includes(roomType)) {
      sendError(res, 'Invalid roomType. Must be public or private.', 400);
      return;
    }

    const trip = await Trip.findOne({ id });
    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.leader.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the trip leader can alter visibility', 403);
      return;
    }

    trip.roomType = roomType;
    await trip.save();

    sendSuccess(res, { roomType: trip.roomType }, `Trip visibility set to ${roomType}`);
  } catch (error) {
    next(error);
  }
};

export const requestJoinTrip = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const { message, budget, travelStyle, languages } = req.body;

    const trip = await Trip.findOne({ id });
    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.roomType === 'private') {
      sendError(res, 'This trip is private and requires an invitation to join', 403);
      return;
    }

    if (trip.status !== 'open') {
      sendError(res, 'This trip is no longer open for new joins', 409);
      return;
    }

    // Check if user is the trip leader
    if (trip.leader && trip.leader.id === req.user!.id) {
      sendError(res, 'You are the trip leader and cannot submit a join request to your own trip', 400);
      return;
    }

    // Check if user is already a member
    if (trip.members.some((m) => m.id === req.user!.id)) {
      sendError(res, 'You are already a member of this trip', 409);
      return;
    }

    // Check if user already has a pending or accepted join request
    const existingReq = await JoinRequest.findOne({
      tripId: id,
      userId: req.user.id,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingReq) {
      sendError(res, 'You already have an active join request for this trip', 409);
      return;
    }

    // Create join request
    const joinReq = new JoinRequest({
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tripId: id,
      userId: req.user.id,
      user: {
        id: req.user.id,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl,
        city: req.user.city,
        location: `${req.user.city || 'Kerala'}, ${req.user.country || 'India'}`,
        travelStyle: travelStyle || req.user.travelStyle || 'Solo',
        languages: languages || req.user.languages.join(', ') || 'English, Hindi',
        budget: budget || 'Flexible',
      },
      message: message || `Hi! I would love to join your ${trip.name} trip!`,
      status: 'pending',
    });

    await joinReq.save();

    // Create notification for trip leader
    await Notification.create({
      id: `notif_${Date.now()}`,
      userId: trip.leader.id,
      type: 'join_request',
      title: `${req.user.name} wants to join`,
      message: `${trip.name}: ${message || 'Review this request in your Trip Leader Console.'}`,
      timestamp: 'Just now',
      read: false,
      link: `/app/trips/${trip.id}/requests`,
    });

    sendSuccess(res, joinReq, 'Join request submitted to trip leader', 201);
  } catch (error) {
    next(error);
  }
};

export const getTripJoinRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.leader.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the trip leader can view join requests', 403);
      return;
    }

    const requests = await JoinRequest.find({ tripId: id }).sort({ createdAt: -1 });
    sendSuccess(res, requests);
  } catch (error) {
    next(error);
  }
};

export const acceptJoinRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id, requestId } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.leader.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the trip leader can approve requests', 403);
      return;
    }

    const joinReq = await JoinRequest.findOne({ id: requestId, tripId: id });
    if (!joinReq) {
      sendError(res, 'Join request not found', 404);
      return;
    }

    if (joinReq.status === 'accepted') {
      sendError(res, 'Request has already been accepted', 409);
      return;
    }

    // Atomic check-and-push to prevent race conditions and overbooking
    const updatedTrip = await Trip.findOneAndUpdate(
      {
        id,
        'members.id': { $ne: joinReq.user.id },
        $expr: { $lt: [{ $size: '$members' }, '$maxMembers'] },
      },
      {
        $push: {
          members: {
            id: joinReq.user.id,
            name: joinReq.user.name,
            avatarUrl: joinReq.user.avatarUrl,
            role: 'Member',
            city: joinReq.user.city,
          },
        },
      },
      { new: true }
    );

    // If trip was not updated because capacity was full
    if (!updatedTrip && !trip.members.some((m) => m.id === joinReq.user.id)) {
      sendError(res, 'This trip has reached maximum capacity', 409);
      return;
    }

    joinReq.status = 'accepted';
    await joinReq.save();

    // Create notification for accepted applicant
    await Notification.create({
      id: `notif_${Date.now()}`,
      userId: joinReq.userId,
      type: 'trip_invite',
      title: 'Your join request was accepted! 🎉',
      message: `${trip.leader.name} confirmed your spot in ${trip.name}.`,
      timestamp: 'Just now',
      read: false,
      link: `/app/trips/${trip.id}`,
    });

    sendSuccess(res, { request: joinReq, trip }, 'Applicant accepted into trip');
  } catch (error) {
    next(error);
  }
};

export const declineJoinRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'Unauthenticated', 401);
      return;
    }

    const { id, requestId } = req.params;
    const trip = await Trip.findOne({ id });

    if (!trip) {
      sendError(res, 'Trip not found', 404);
      return;
    }

    if (trip.leader.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the trip leader can decline requests', 403);
      return;
    }

    const joinReq = await JoinRequest.findOne({ id: requestId, tripId: id });
    if (!joinReq) {
      sendError(res, 'Join request not found', 404);
      return;
    }

    joinReq.status = 'declined';
    await joinReq.save();

    sendSuccess(res, joinReq, 'Join request declined');
  } catch (error) {
    next(error);
  }
};

