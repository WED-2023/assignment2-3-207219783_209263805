var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

router.post("/Register", async (req, res, next) => {
  try {
    // parameters exists
    // valid parameters
    // username exists
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
      profilePic: req.body.profilePic
    }
    let users = [];
    console.log(user_details);
    users = await DButils.execQuery("SELECT username from users");

    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Username taken" };

    // add the new username
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );
    await DButils.execQuery(
      `INSERT INTO users (username, firstname, lastname, country, password, email) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}', '${user_details.country}', '${hash_password}', '${user_details.email}')`

    );
    res.status(201).send({ message: "user created", success: true });
  } catch (error) {
    next(error);
  }
});


router.post("/Login", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    // Check if username exists
    const users = await DButils.execQuery(`SELECT * FROM users WHERE username = '${username}'`);
    if (users.length === 0) {
      return res.status(401).send({ message: "Username or Password incorrect", success: false });
    }

    const user = users[0];

    // Check if password is correct
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).send({ message: "Username or Password incorrect", success: false });
    }

    // Set up session
    req.session.authenticated = true;
    req.session.user = {
      user_id: user.user_id,
      username: user.username
    };
    
    // console.log('Session after login:', req.session); // Add debug log

    // Return successful response
    res.status(200).send({ message: "login succeeded", success: true });
  } catch (error) {
    next(error);
  }
});

// router.post("/Login", async (req, res, next) => {
//   console.log(req.sessionID);
//   const {username, password} = req.body;
//   // console.log(username);
//   // console.log(password);
//   if(username && password){
//     if (req.session.authenticated){
//       res.json(req.session);
//     }
//     // if the user not logged in
//     else{
//       if (password === '123'){
//         req.session.authenticated = true;
//         req.session.user = {
//           username, password
//         };
//         res.json(req.session);
//       }
//       else{
//         res.status(403).send({ message: "Bad Credentials", success: false });
//       }
//     }
// }
// else {
//   res.status(403).send({ message: "Bad Credentials", success: false });

// }

//   // res.send(200);

// });


// router.post("/Login", async (req, res, next) => {
//   try {
//     // check that username exists
//     const users = await DButils.execQuery("SELECT username FROM users");
//     if (!users.find((x) => x.username === req.body.username))
//       throw { status: 401, message: "Username or Password incorrect" };

//     // check that the password is correct
//     const user = (
//       await DButils.execQuery(
//         `SELECT * FROM users WHERE username = '${req.body.username}'`
//       )
//     )[0];

//     if (!bcrypt.compareSync(req.body.password, user.password)) {
//       throw { status: 401, message: "Username or Password incorrect" };
//     }

//     // Set cookie
//     req.session.user_id = user.user_id;
//     console.log('Session after login:', req.session); // Add debug log


//     // return cookie
//     res.status(200).send({ message: "login succeeded", success: true });
//   } catch (error) {
//     next(error);
//   }
// });

// router.post("/login", async (req, res, next) => {
//   try {
//     const users = await DButils.execQuery("SELECT * FROM users WHERE username = ?", [req.body.username]);
//     if (users.length === 0) {
//       throw { status: 401, message: "Username or Password incorrect" };
//     }

//     const user = users[0];

//     if (!bcrypt.compareSync(req.body.password, user.password)) {
//       throw { status: 401, message: "Username or Password incorrect" };
//     }

//     req.session.user_id = user.user_id;

//     console.log('Session after login:', req.session);

//     res.status(200).send({ message: "Login succeeded", success: true });
//   } catch (error) {
//     next(error);
//   }
// });

router.post("/Logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ message: "Logout failed", success: false });
    }

    res.clearCookie('template');
    res.status(200).send({ message: "logout succeeded", success: true });
  });
});

// router.post("/Logout", function (req, res) {
//   req.session.reset(); // reset the session info --> send cookie when  req.session == undefined!!
//   res.send({ success: true, message: "logout succeeded" });
// });

// Route to destroy session (logout)
// router.post('/logout', (req, res) => {
//   req.session.destroy(err => {
//     if (err) {
//       return res.status(500).send('Could not log out.');
//     } else {
//       res.send('Logout successful');
//     }
//   });
// });
module.exports = router;