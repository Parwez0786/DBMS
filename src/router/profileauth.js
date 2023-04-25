const express = require("express");
var db = require("../database/db");
const router = express.Router();
router.get("/profileView", async (req, res, next) => {
  res.render("profileView");
});
module.exports=router;