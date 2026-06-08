import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import EncryptionKey from "../models/EncryptionKey.js";
import File from "../models/File.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KEYFILE = path.resolve(__dirname, "..", "storage", ".master_key");
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

let masterKey = null;

const getOrCreateMasterKey = async () => {
  if (masterKey) return masterKey;

  if (process.env.MASTER_ENCRYPTION_KEY) {
    const raw = Buffer.from(process.env.MASTER_ENCRYPTION_KEY, "hex");
    if (raw.length === KEY_LENGTH) {
      masterKey = raw;
      return masterKey;
    }
    console.warn("MASTER_ENCRYPTION_KEY has invalid length — expected 64 hex chars (32 bytes)");
  }

  try {
    const stored = await fs.readFile(KEYFILE);
    masterKey = stored;
    return masterKey;
  } catch {
    // generate new master key
    masterKey = crypto.randomBytes(KEY_LENGTH);
    await fs.mkdir(path.dirname(KEYFILE), { recursive: true });
    await fs.writeFile(KEYFILE, masterKey);
    console.warn(`Encryption master key generated at ${KEYFILE}. Set MASTER_ENCRYPTION_KEY in .env for persistence across restarts.`);
    return masterKey;
  }
};

const getOrCreateUserKey = async (userId) => {
  const existing = await EncryptionKey.findOne({ userId });
  if (existing) {
    return existing;
  }

  const mk = await getOrCreateMasterKey();
  const userKey = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, mk, iv);
  const encrypted = Buffer.concat([cipher.update(userKey), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const keyId = crypto.randomUUID();
  const encryptedKey = Buffer.concat([iv, authTag, encrypted]).toString("hex");

  const record = await EncryptionKey.create({
    userId,
    keyId,
    encryptedKey,
    algorithm: ALGORITHM,
    version: 1,
  });

  return record;
};

const getUserKey = async (userId) => {
  const mk = await getOrCreateMasterKey();
  const record = await EncryptionKey.findOne({ userId });
  if (!record) {
    throw new Error(`Encryption key not found for user ${userId}`);
  }

  const raw = Buffer.from(record.encryptedKey, "hex");
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, mk, iv);
  decipher.setAuthTag(authTag);
  const userKey = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return { key: userKey, keyId: record.keyId, version: record.version };
};

const encryptBuffer = async (buffer, userId) => {
  const { key, keyId, version } = await getOrCreateUserKey(userId);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const payload = Buffer.concat([iv, authTag, encrypted]);

  return {
    encryptedBuffer: payload,
    encryptionIv: iv.toString("hex"),
    encryptionVersion: version,
  };
};

const decryptBuffer = async (encryptedBuffer, ivHex, userId) => {
  const { key } = await getUserKey(userId);

  const iv = Buffer.from(ivHex, "hex");
  const authTag = encryptedBuffer.subarray(0, AUTH_TAG_LENGTH);
  const encrypted = encryptedBuffer.subarray(AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted;
};

const getEncryptionStatus = async (userId) => {
  const keyRecord = await EncryptionKey.findOne({ userId });
  const encryptedFileCount = await File.countDocuments({
    ownerId: userId,
    isDeleted: false,
    encrypted: true,
  });
  const totalFileCount = await File.countDocuments({
    ownerId: userId,
    isDeleted: false,
  });

  return {
    enabled: Boolean(keyRecord),
    algorithm: keyRecord ? keyRecord.algorithm : null,
    keyVersion: keyRecord ? keyRecord.version : null,
    keyCreatedAt: keyRecord ? keyRecord.createdAt : null,
    encryptedFileCount,
    totalFileCount,
    encryptionRate: totalFileCount > 0
      ? Number(((encryptedFileCount / totalFileCount) * 100).toFixed(1))
      : 0,
  };
};

// Reset master key cache (useful for testing)
const resetMasterKey = () => {
  masterKey = null;
};

export {
  getOrCreateMasterKey,
  getOrCreateUserKey,
  getUserKey,
  encryptBuffer,
  decryptBuffer,
  getEncryptionStatus,
  resetMasterKey,
};
