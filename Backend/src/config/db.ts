import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      autoIndex: true,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.name} at ${conn.connection.host}`);

    // Clean up legacy demo seed stories
    try {
      const { Story } = await import('../models/Story.js');
      await Story.deleteMany({
        $or: [
          { id: { $in: ['story_varkala', 'story_munnar', 'story_1793971438921'] } },
          { slug: { $in: ['varkala-more-than-just-a-beach', 'munnar-a-weekend-escape', 'my-unforgettable-western-ghats-journey-8921'] } },
          { 'author.id': { $in: ['user_priya', 'user_arjun'] } },
          { 'author.name': { $in: ['Priya Nair', 'Arjun Mehta'] } },
          { title: { $in: ['My Unforgettable Western Ghats Journey', 'Varkala – More Than Just a Beach', 'Munnar – A Weekend Escape'] } },
        ],
      });
    } catch {
      // Non-fatal cleanup
    }

    return conn;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected successfully');
  } catch (error) {
    console.error('[MongoDB] Error disconnecting:', error);
  }
};

