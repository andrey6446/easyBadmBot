import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  telegramId: { type: Number, required: true },
  timeRange: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  weekdays: [{
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6],
    required: true
  }], // 0 - воскресенье, 1 - понедельник и т.д.
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', notificationSchema);
