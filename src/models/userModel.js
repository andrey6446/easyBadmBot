import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  chatId: { type: Number, required: true },
  username: String,
  firstName: String,
  lastName: String,
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);