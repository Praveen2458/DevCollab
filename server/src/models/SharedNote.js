import mongoose from 'mongoose';

const sharedNoteSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, unique: true, index: true },
    content: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

sharedNoteSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const SharedNote = mongoose.model('SharedNote', sharedNoteSchema);
