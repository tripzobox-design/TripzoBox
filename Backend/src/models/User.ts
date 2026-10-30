import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  avatarUrl: string;
  coverUrl?: string;
  gender?: 'female' | 'male' | 'non-binary' | 'prefer-not-to-say';
  city: string;
  country?: string;
  languages: string[];
  bio: string;
  birthDate?: string;
  travelStyle?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  recoveryCodes?: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  travelInterests: string[];
  budgetStyle: 'budget' | 'mid-range' | 'comfort';
  travelPace?: string;
  preferredGroupSize?: string;
  dreamDestination?: string;
  stats: {
    trips: number;
    stories: number;
    followers: number;
    following: number;
  };
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeUser(): Record<string, any>;
}

const UserSchema = new Schema<IUser>(
  {
    id: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, index: true, lowercase: true, trim: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, sparse: true, trim: true, index: true },
    password: { type: String, select: false },
    avatarUrl: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    coverUrl: {
      type: String,
      default:
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80',
    },
    gender: {
      type: String,
      enum: ['female', 'male', 'non-binary', 'prefer-not-to-say'],
      default: 'prefer-not-to-say',
    },
    city: { type: String, default: 'Kerala' },
    country: { type: String, default: 'India' },
    languages: { type: [String], default: ['English', 'Hindi'] },
    bio: { type: String, default: 'Travel enthusiast exploring mountains and misty hills.' },
    birthDate: { type: String },
    travelStyle: { type: String, default: 'Solo' },
    securityQuestion: { type: String },
    securityAnswer: { type: String, select: false },
    recoveryCodes: { type: [String], select: false },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    travelInterests: { type: [String], default: ['Hiking', 'Nature', 'Photography', 'Food'] },
    budgetStyle: {
      type: String,
      enum: ['budget', 'mid-range', 'comfort'],
      default: 'comfort',
    },
    travelPace: { type: String, default: 'Balanced' },
    preferredGroupSize: { type: String, default: '4-8 travellers' },
    dreamDestination: { type: String, default: 'Ladakh' },
    stats: {
      trips: { type: Number, default: 0 },
      stories: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (this.isModified('id') && !this.id) {
    this.id = `user_${Date.now()}`;
  }
  if (!this.id) {
    this.id = `user_${Date.now()}`;
  }
  if (!this.username) {
    this.username = `user_${Math.random().toString(36).substring(2, 9)}`;
  }
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to verify password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to return safe user object (stripping password, security answers)
UserSchema.methods.toSafeUser = function (): Record<string, any> {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.securityAnswer;
  delete userObj.recoveryCodes;
  delete userObj.__v;
  delete userObj._id;
  return userObj;
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

