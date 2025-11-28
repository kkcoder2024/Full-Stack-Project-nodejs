import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").get(registerUser); //for register
// router.route("/login").post(loginUser); //for login

export { router };
