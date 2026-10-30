import { Request, Response, NextFunction } from 'express';
import { Destination } from '../models/Destination.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getDestinations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, search, q, sortBy = 'popular', page = '1', limit = '12' } =
      req.query as Record<string, string>;

    const query: any = { isPublic: true };

    if (category && category !== 'All') {
      if (category === 'Hidden Spots') {
        query.$or = [{ isHiddenSpot: true }, { category: 'Hidden Spots' }];
      } else {
        query.category = category;
      }
    }

    const searchTerm = (search || q || '').trim();
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: regex },
          { state: regex },
          { shortDescription: regex },
          { tags: regex },
        ],
      });
    }

    let sort: any = { rating: -1, createdAt: -1 };
    if (sortBy === 'newest') sort = { createdAt: -1 };
    else if (sortBy === 'rating') sort = { rating: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [destinations, total] = await Promise.all([
      Destination.find(query).sort(sort).skip(skip).limit(limitNum),
      Destination.countDocuments(query),
    ]);

    sendSuccess(res, destinations, 'Destinations retrieved successfully', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + destinations.length < total,
    });
  } catch (error) {
    next(error);
  }
};

export const getDestinationBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const destination = await Destination.findOne({
      $or: [{ slug }, { id: slug }],
    });

    if (!destination) {
      sendError(res, 'Destination not found', 404);
      return;
    }

    sendSuccess(res, destination);
  } catch (error) {
    next(error);
  }
};

export const createDestination = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body = req.body;
    const timestamp = Date.now();
    const cleanName = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `spot-${timestamp}`;
    const slug = `${cleanName}-${timestamp.toString().slice(-4)}`;

    const newDest = new Destination({
      ...body,
      id: `dest_${timestamp}`,
      slug,
      isPublic: body.isPublic !== false,
      createdBy: req.user
        ? {
            id: req.user.id,
            name: req.user.name,
            avatarUrl: req.user.avatarUrl,
          }
        : undefined,
    });

    await newDest.save();
    sendSuccess(res, newDest, 'Destination added successfully', 201);
  } catch (error) {
    next(error);
  }
};

