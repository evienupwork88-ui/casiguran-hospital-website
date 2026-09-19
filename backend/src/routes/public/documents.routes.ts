import { Router } from "express";
import { listPublicDocuments } from "../../controllers/documents.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listPublicDocuments));

export default router;
