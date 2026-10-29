import multer from "multer";
import { Router } from "express";
import { addAdminNutritionAndDieteticsImages, getAdminNutritionAndDietetics, removeAdminNutritionAndDieteticsImage, updateAdminNutritionAndDietetics, uploadAdminNutritionAndDieteticsOrganizationalChart } from "../../controllers/nutrition-and-dietetics.controller";
import { env } from "../../config/env";
import { requireAuth } from "../../middleware/requireAuth";
import { requireChangeApproval } from "../../middleware/admin-change-approval";
import { requireCsrf } from "../../middleware/requireCsrf";
import { requireRole } from "../../middleware/requireRole";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { updateNutritionAndDieteticsSchema } from "../../validation/nutrition-and-dietetics.schema";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadImageBytes },
});
const uploadOrgChart = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxOrgChartImageBytes },
});

router.use(requireAuth, requireRole("admin", "editor"));
router.get("/", asyncHandler(getAdminNutritionAndDietetics));
router.put("/", requireCsrf, validateBody(updateNutritionAndDieteticsSchema), requireChangeApproval("Nutrition and Dietetics", "Update"), asyncHandler(updateAdminNutritionAndDietetics));
router.post("/images", requireCsrf, upload.array("images", 10), requireChangeApproval("Nutrition and Dietetics", "Add images"), asyncHandler(addAdminNutritionAndDieteticsImages));
router.delete("/images/:index", requireCsrf, requireChangeApproval("Nutrition and Dietetics", "Remove image"), asyncHandler(removeAdminNutritionAndDieteticsImage));
router.put("/organizational-chart-image", requireCsrf, uploadOrgChart.single("chartImage"), requireChangeApproval("Nutrition and Dietetics", "Update organizational chart"), asyncHandler(uploadAdminNutritionAndDieteticsOrganizationalChart));

export default router;
