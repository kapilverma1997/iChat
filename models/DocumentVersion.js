import mongoose, { Schema } from 'mongoose';

const DocumentVersionSchema = new Schema(
  {
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeSummary: {
      type: String,
      default: '',
    },
    changes: [{
      type: {
        type: String,
        enum: ['insert', 'delete', 'format'],
      },
      position: Number,
      length: Number,
      text: String,
    }],
    metadata: {
      wordCount: Number,
      characterCount: Number,
      lineCount: Number,
    },
  },
  {
    timestamps: true,
  }
);

DocumentVersionSchema.index({ documentId: 1, version: -1 });
DocumentVersionSchema.index({ createdAt: -1 });

const DocumentVersion = mongoose.models.DocumentVersion || mongoose.model('DocumentVersion', DocumentVersionSchema);

export default DocumentVersion;

