const express = require("express");
const router = express.Router();

const { getMessagesByUserId } = require("../controllers/messageControllers");

router.get("/getMessagesByUserId/:userId", getMessagesByUserId);

module.exports = router;