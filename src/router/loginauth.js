const express = require("express");
var db = require("../database/db");
const router = express.Router();
const jwt = require("jsonwebtoken");

const middlewares = require("../utils/verifyUser.js");
router.get("/login", (req, res) => {
  res.render("login", { message: req.flash("message") });
});


router.post("/login", async (req, res) => {
  // console.log(userkiId);

  var user = req.body.custid;
  if (user.length == 0) {
    req.flash("message", "please enter  custid");
    res.redirect("login");
  } else {
    var pass = req.body.password;
    console.log(user + " " + pass);

    var sql = `select   * from stockuser where username="${user}"`;

    db.query(sql, function (err, result) {
      if (err) {
        console.log(err);

        console.log("username password doesnot matched");
        req.flash("message", "username and password does not match");
        res.redirect("login");
      } else {
        console.log(result);
        if (result.length == 0) {
          req.flash("message", "please enter valid password");
          res.redirect("login");
        } else {
          // console.log(result[0].password);
          let gg = result[0].password;
          console.log(gg);
          if (gg.localeCompare(pass) == 0) {
            var kk = result[0].fname;
            gname = kk;
            let token = jwt.sign(result[0], "parwez");
            res
              .cookie("access_token", token, { httpOnly: true })
              .redirect("/api/showUserStocks/showStocks");

            //   req.user=result[0];

            //  res.redirect("/api/showUserStocks/showStocks");
            // res.send("successfully registered");
          } else {
            console.log("username or password doesnot matched");
            global_enroll = user;
            req.flash("message", {
              email: "1",
              picture: profile_pic,
            });
            res.redirect("login");
          }
        }
      }
    });
  }
});
module.exports=router;


