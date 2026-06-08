import mongoose from "mongoose";

const encryptionKeySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    keyId: {
      type: String,
      required: true,
      unique: true,
    },
    encryptedKey: {
      type: String,
      required: true,
    },
    algorithm: {
      type: String,
      default: "aes-256-gcm",
    },
    version: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    rotatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
  },
);

const EncryptionKey = mongoose.model("EncryptionKey", encryptionKeySchema);

export default EncryptionKey;
