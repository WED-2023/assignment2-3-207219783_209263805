require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
// const session = require("client-sessions");

const session = require('express-session');
const store = new session.MemoryStore();

const DButils = require("./routes/utils/DButils");
const cors = require('cors')

const  app = express();
app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json

app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
//local:
app.use(express.static(path.join(__dirname, "dist")));
//remote:
// app.use(express.static(path.join(__dirname, '../assignment-3-3-basic/dist')));
app.get("/", function (req, res) {
  //remote: 
  // res.sendFile(path.join(__dirname, '../assignment-3-3-basic/dist/index.html'));
  //local:
  res.sendFile(__dirname + "/index.html");

});

// const corsConfig = {
//   origin: true,
//   credentials: true
// };
const corsConfig = {
  origin: 'http://localhost:8080',
  credentials: true
};
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));

// app.use(cors());
// app.options("*", cors());

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

// // client session
// app.use(
//   session({
//     cookieName: "session", // the cookie key name
//     //secret: process.env.COOKIE_SECRET, // the encryption key
//     secret: "template", // the encryption key
//     duration: 24 * 60 * 60 * 1000, // expired after 20 sec
//     activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
//     cookie: {
//       httpOnly: true,
//       secure: false, // set this to true if using HTTPS

//     }
//   })
// );

// Express Session configuration
app.use(
  session({
    // name: "session", // the cookie key name
    secret: process.env.COOKIE_SECRET || "template", // the encryption key
    resave: false,
    saveUninitialized: false, // Dont init cookie befoe the user logged in
    store,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: false, // set this to true if using HTTPS
    },
  })
);

app.use((req, res, next) => {
  // console.log(store);
  // console.log('Session middleware:', req.session);
  next();
});


	
var port = process.env.PORT || "3000"; //local=3000 remote=80
//#endregion
const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth = require("./routes/auth");

//#region cookie middleware
app.use(function (req, res, next) {
  //console.log(`Middleware triggered for ${req.method} ${req.url}`);
  //console.log('Session:', req.session);

  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        next();
      })
      .catch((error) => next());
  } else {
    next();
  }
});

// ----> For cheking that our server is alive
app.get("/alive", (req, res) => res.send("I'm alive"));

// Routings
app.use("/users", user);
app.use("/recipes", recipes);
app.use("/auth", auth);  

// Default router
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});



const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});
