const express = require("express");
const router = express.Router();
const { login, refresh, logout, createAdmin, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { restrictTo } = require("../middleware/role.middleware");
const { loginSchema, createAdminSchema, validate } = require("../validators/auth.validator");

router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", protect, logout);
router.post("/admin", protect, restrictTo("superadmin"), validate(createAdminSchema), createAdmin);
router.get("/me", protect, getMe);

module.exports = router;