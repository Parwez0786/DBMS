const express = require("express");

const app = express();
const hbs = require("hbs");
const path = require("path");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "parwez";
//const cookieParser = require("cookie-parser");
const transport = require("../src/mailer/mailsend");
var db = require("../src/database/db");
require("./auth");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
var userkiId;
var genereted_account_no;
var password_from_database;
var email_from_database;
var enrollment;

var session = require("express-session");
var flush = require("connect-flash");
const bodyparser = require("body-parser");
app.use(bodyparser.urlencoded({ extended: true }));
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const { constants } = require("buffer");
const passport = require("passport");
const { profile } = require("console");

//path set up
const staticpath = path.join(__dirname, "../public");
const partialpath = path.join(__dirname, "../templates/partials");
const templatepath = path.join(__dirname, "../templates/views");
app.set("view engine", "hbs");
app.set("views", templatepath);
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(express.static(staticpath));
hbs.registerPartials(partialpath);
var global_enroll;

app.use(
  session({
    secret: "secret",
    cookie: {
      maxAge: 60000,
    },
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flush());
const port = 80; //IF PROCESS.ENV NOT AVAILABLE THEN GOES ON 3000

app.use(session({ secret: "cats" }));
app.use(passport.initialize());
app.use(passport.session());

//////////////////////////////////////////////////////////////
//google authentication
function isloggedIn(req, res, next) {
  req.user ? next() : res.sendStatus(401);
}

//google authenticate
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);
app.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/student_profile",
    failureRedirect: "/auth/failure",
  })
);
//github authenticate
app.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["email", "profile"] })
);
app.get(
  "/github/callback",
  passport.authenticate("github", {
    successRedirect: "/homepage",
    failureRedirect: "/auth/failure",
  })
);

// facebook authenticate

app.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email", "profile"] })
);
app.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/homepage",
    failureRedirect: "/auth/failure",
  })
);

app.get("/auth/failure", (req, res) => {
  res.send("something went wrong");
});
app.get("/protected", isloggedIn, (req, res) => {
  res.send(`hello ${req.user.email}`);
});
app.get("/logout", (req, res) => {
  req.logOut();
  req.session.destroy();
  res.render("homepage");
});

///////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////

// student personal details

//render login page

app.get("/stock_display", (req, res) => {
  res.render("stock_display");
});
app.get("/homepage", isloggedIn, (req, res) => {
  var profile_pic;
  if (req.user.picture == null) {
    profile_pic = req.user.photos[0].value;
  } else {
    profile_pic = req.user.picture;
  }
  console.log(profile_pic);

  res.render("homepage", { email: req.user.email, picture: profile_pic });
});
app.get("/home2", (req, res) => {
  res.render("home2", { message: req.flash("message") });
});
app.get("/congrats_message", (req, res) => {
  res.render("congrats_message", {
    genereted_account_no: genereted_account_no,
  });
});

// forgot passwords
//using router file
// app.use("/api/projectauth", require("./router/projectauth"));
app.use("/api/auth", require("./router/auth"));
app.use("/api/registerauth", require("./router/registerauth"));
app.use("/api/profileauth", require("./router/profileauth"));
app.use("/api/showUserStocks", require("./router/showUserStocks"));
app.use("/api/loginauth", require("./router/loginauth"));
app.use("/api/sell", require("./router/sell"));
var request = require("request");
app.get("/get_data",async (req, res) => {
  var url =
    "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=9Q7QICP9RWAT4SAS";

 await request.get(
    {
      url: url,
      json: true,
      headers: { "User-Agent": "request" },
    },
    (err, ress, data) => {
      if (err) {
        console.log("Error:", err);
      } else if (ress.statusCode !== 200) {
        console.log("Status:", ress.statusCode);
      } else {
        // data is successfully parsed as a JSON object:
        // console.log(data);
        //console.log(data)
        const arrayOfObj = Object.entries(data).map((e) => ({
          [e[0]]: e[1],
        }));
        // console.log(arrayOfObj[1]);
        //    console.log(arrayOfObj[0]);

        let data2 = arrayOfObj[0]["Meta Data"];
        // data  = data.json();
        const newData = {};
        for (const key in data2) {
          let newKey = key;
          newKey = newKey.split(" ")[1];
          //console.log(newKey);
          newData[newKey] = data2[key];
        }
        console.log(newData)
       res.status(200).json(newData);

        //   res.send(dd);
        // var d  = JSON.stringify(data);
        // console.log(d)
        // res.render("stock_display", {data });

        //  res.json(arrayOfObj[0]);
      }
    }
  );
});
// replace the "demo" apikey below with your own key from https://www.alphavantage.co/support/#api-key

////////

//post request on login


var update = function () {
  // Select a random ID from table
  const sql =
    "SELECT id, price FROM stocks WHERE price IS NOT NULL ORDER BY RAND() LIMIT 1";

  db.query(sql, (err, result) => {
    if (err) throw err;
    const id = result[0].id;
    const price = result[0].price;

    function getRandomStockPriceChange(price) {
      // Define constants for the distribution of price changes
      const mean = 0; // mean of the distribution (no change in price)
      const stdev = 0.2; // standard deviation (controls the magnitude of the change)

      // Generate a random price change using a normal distribution
      let priceChange = price * (mean + stdev * getRandomNormal(mean, stdev));

      // Ensure that the price change does not cause the price to go below 1
      if (price + priceChange < 1) {
        priceChange = 1 - price;
      }

      return priceChange;
    }

    function getRandomNormal(mean, stdev) {
      let u = 0,
        v = 0;
      while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
      while (v === 0) v = Math.random();
      const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
      return num * stdev + mean;
    }

    const priceChange = getRandomStockPriceChange(price);
    const newPrice = price + priceChange;

    const sql = `UPDATE stocks SET price=${newPrice} WHERE id='${id}'`;
    db.query(sql, (err, result) => {
      if (err) throw err;
      // console.log(`Price for ID ${id} updated to ${newPrice}`);
    });
  });
};


app.get("/landing", (req, res) => {
  res.render("landing");
});



// Set timer to run endpoint every 6 seconds
setInterval(() => {
  update();
}, 1000);

//////////////////////////////////////////////////////////////////////////////////////

app.listen(port, () => {
  console.log(`listening to ${port} `);
});
