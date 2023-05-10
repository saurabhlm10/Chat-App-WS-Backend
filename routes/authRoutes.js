const express = require("express");
const router = express.Router();

const { login, register, logout } = require("../controllers/authControllers");

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);

module.exports = router;