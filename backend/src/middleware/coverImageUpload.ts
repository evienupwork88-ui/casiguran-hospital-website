import multer from "multer";
import { env } from "../config/env";

export const coverImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadImageBytes,
    files: 1,
  },
});
