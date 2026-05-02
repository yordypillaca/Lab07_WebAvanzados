import express from "express";
import AuthController from "../controllers/AuthController.js";

const router = express.Router();

router.post("/signUp", AuthController.signUp);
router.post("/signIn", AuthController.signIn);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);

export default router;

