import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminAuditLog extends Document {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  targetType:
    | 'user'
    | 'trip'
    | 'join_request'
    | 'package'
    | 'cms'
    | 'review'
    | 'report'
    | 'notification'
    | 'system'
    | 'destination'
    | 'diary'
    | 'media'
    | 'auth';
  targetId?: string;
  targetName?: string;
  details?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    id: { type: String, unique: true, index: true },
    adminId: { type: String, required: true, index: true },
    adminEmail: { type: String, required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: {
      type: String,
      enum: [
        'user',
        'trip',
        'join_request',
        'package',
        'cms',
        'review',
        'report',
        'notification',
        'system',
        'destination',
        'diary',
        'media',
        'auth',
      ],
      required: true,
      index: true,
    },
    targetId: { type: String, index: true },
    targetName: { type: String },
    details: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AdminAuditLogSchema.pre('save', function (next) {
  if (!this.id) {
    this.id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }
  next();
});

export const AdminAuditLog: Model<IAdminAuditLog> = mongoose.model<IAdminAuditLog>(
  'AdminAuditLog',
  AdminAuditLogSchema
);

