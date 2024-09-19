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

router.post("/Logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ message: "Logout failed", success: false });
    }

    res.clearCookie('template');
    res.status(200).send({ message: "logout succeeded", success: true });
  });
});

module.exports = router;