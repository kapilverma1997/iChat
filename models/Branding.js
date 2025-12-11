import mongoose, { Schema } from 'mongoose';

const BrandingSchema = new Schema(
  {
    organizationId: {
      type: String,
      unique: true,
      default: 'default',
    },
    logo: {
      navbar: String,
      sidebar: String,
      login: String,
      favicon: String,
    },
    colors: {
      primary: {
        type: String,
        default: '#007bff',
      },
      secondary: {
        type: String,
        default: '#6c757d',
      },
      accent: {
        type: String,
        default: '#28a745',
      },
    },
    customCSS: {
      type: String,
      default: '',
    },
    loadingScreen: {
      enabled: {
        type: Boolean,
        default: false,
      },
      imageUrl: String,
      animationType: {
        type: String,
        enum: ['spinner', 'pulse', 'fade', 'custom'],
        default: 'spinner',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const Branding = mongoose.models.Branding || mongoose.model('Branding', BrandingSchema);

export default Branding;

