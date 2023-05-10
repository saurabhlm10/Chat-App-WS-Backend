const express = require("express");
const { getProfile, getAllProfiles } = require("../controllers/profileControllers");
const router = express.Router();

router.get('/getprofile', getProfile)
router.get('/getallprofiles', getAllProfiles)

module.exports = router;
