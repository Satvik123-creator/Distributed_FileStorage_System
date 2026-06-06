import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storageRoot = path.resolve(__dirname, "..", "storage");

const generateUniqueFileName = (originalName) => {
  const extension = path.extname(originalName);
  const baseName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${baseName}_${Date.now()}_${randomUUID()}${extension}`;
};

const createUserFolderIfNotExists = async (nodeLocation, userId) => {
  const userFolder = path.join(storageRoot, nodeLocation, userId);
  await fs.mkdir(userFolder, { recursive: true });
  return userFolder;
};

const storeFile = async ({ buffer, nodeLocation, userId, storedName }) => {
  const userFolder = await createUserFolderIfNotExists(nodeLocation, userId);
  const filePath = path.join(userFolder, storedName);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

const getFilePath = (nodeLocation, userId, storedName) => {
  return path.join(storageRoot, nodeLocation, userId, storedName);
};

export { createUserFolderIfNotExists, storeFile, generateUniqueFileName, getFilePath };
