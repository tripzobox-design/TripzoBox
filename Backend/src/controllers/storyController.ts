import { Request, Response, NextFunction } from 'express';
import { Story, IStory } from '../models/Story.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';

export const getStories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      search,
      q,
      destination,
      tripType,
      duration,
      styles,
      languages,
      tab = 'all',
      sortBy = 'latest',
      page = '1',
      limit = '9',
    } = req.query as Record<string, string>;

    const query: any = {};

    // Tab 'mine' vs 'all'
    if (tab === 'mine') {
      if (!req.user) {
        sendError(res, 'Unauthenticated', 401);
        return;
      }
      query['author.id'] = req.user.id;
    } else {
      // Visibility check
      if (req.user) {
        query.$or = [{ visibility: 'public' }, { 'author.id': req.user.id }];
      } else {
        query.visibility = 'public';
      }
      query.status = { $ne: 'draft' };
    }

    // Search query
    const searchTerm = (search || q || '').trim();
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: regex },
          { destination: regex },
          { summary: regex },
          { 'author.name': regex },
          { fullContent: regex },
        ],
      });
    }

    // Destination filter
    if (destination && destination.trim()) {
      query.destination = new RegExp(destination.trim(), 'i');
    }

    // Trip Type
    if (tripType && tripType !== 'All') {
      query.tripType = new RegExp(tripType.trim(), 'i');
    }

    // Duration
    if (duration && duration !== 'All') {
      if (duration === '1–3 days' || duration === '1-3') {
        query.days = { $gte: 1, $lte: 3 };
      } else if (duration === '4–7 days' || duration === '4-7') {
        query.days = { $gte: 4, $lte: 7 };
      } else if (duration === '8+ days' || duration === '8+') {
        query.days = { $gte: 8 };
      }
    }

    // Styles
    if (styles) {
      const styleList = (Array.isArray(styles) ? styles : styles.split(',')).map(
        (s) => new RegExp(s.trim(), 'i')
      );
      if (styleList.length > 0) {
        query.travelStyle = { $in: styleList };
      }
    }

    // Languages
    if (languages) {
      const langList = (Array.isArray(languages) ? languages : languages.split(',')).map(
        (l) => new RegExp(l.trim(), 'i')
      );
      if (langList.length > 0) {
        query.languages = { $in: langList };
      }
    }

    let sort: any = { createdAt: -1 };
    if (sortBy === 'popular') sort = { likes: -1, views: -1 };
    else if (sortBy === 'rating') sort = { rating: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [stories, total] = await Promise.all([
      Story.find(query).sort(sort).skip(skip).limit(limitNum),
      Story.countDocuments(query),
    ]);

    sendSuccess(res, stories, 'Stories retrieved successfully', 200, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
      hasMore: skip + stories.length < total,
    });
  } catch (error) {
    next(error);
  }
};

export const getStoryBySlug = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;
    const story = await Story.findOne({
      $or: [{ slug }, { id: slug }],
    });

    if (!story) {
      sendError(res, 'Story not found', 404);
      return;
    }

    if (story.visibility === 'private') {
      if (!req.user || req.user.id !== story.author.id) {
        sendError(res, 'This story is private to its author', 403);
        return;
      }
    }

    // Increment views asynchronously
    story.views += 1;
    await story.save();

    sendSuccess(res, story);
  } catch (error) {
    next(error);
  }
};

export const createStory = async (
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
    const title = body.title || 'My Travel Journey';
    const timestamp = Date.now();
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + `-${timestamp.toString().slice(-4)}`;

    const newStory = new Story({
      ...body,
      id: `story_${timestamp}`,
      slug,
      author: {
        id: req.user.id,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl,
        city: req.user.city,
      },
      status: body.status || 'published',
    });

    await newStory.save();

    req.user.stats.stories += 1;
    await req.user.save();

    sendSuccess(res, newStory, 'Story posted successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateStory = async (
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
    const story = await Story.findOne({ id });

    if (!story) {
      sendError(res, 'Story not found', 404);
      return;
    }

    if (story.author.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the author can edit this story', 403);
      return;
    }

    Object.assign(story, req.body);
    await story.save();

    sendSuccess(res, story, 'Story updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteStory = async (
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
    const story = await Story.findOne({ id });

    if (!story) {
      sendError(res, 'Story not found', 404);
      return;
    }

    if (story.author.id !== req.user.id && req.user.role !== 'admin') {
      sendError(res, 'Only the author can delete this story', 403);
      return;
    }

    await Story.deleteOne({ id });
    sendSuccess(res, null, 'Story deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const likeStory = async (
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
    const story = await Story.findOne({ id });

    if (!story) {
      sendError(res, 'Story not found', 404);
      return;
    }

    const hasLiked = story.likedBy.includes(req.user.id);
    if (hasLiked) {
      story.likedBy = story.likedBy.filter((uid) => uid !== req.user!.id);
      story.likes = Math.max(0, story.likes - 1);
    } else {
      story.likedBy.push(req.user.id);
      story.likes += 1;
    }

    await story.save();
    sendSuccess(res, { liked: !hasLiked, likes: story.likes });
  } catch (error) {
    next(error);
  }
};

