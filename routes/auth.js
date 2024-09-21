var express = require("express");
var router = express.Router();
const MySql = require("../routes/utils/MySql");
const DButils = require("../routes/utils/DButils");
const bcrypt = require("bcrypt");

/**
 * @route POST /Register
 * @desc Register a new user by providing the necessary details.
 * @param {string} username - The desired username for the user.
 * @param {string} firstName - The user's first name.
 * @param {string} lastName - The user's last name.
 * @param {string} country - The user's country.
 * @param {string} password - The user's password.
 * @param {string} email - The user's email address.
 * @param {string} [profilePic] - Optional profile picture URL.
 * @access Public
 */
router.post("/Register", async (req, res, next) => {
  try {
    // Extract user details from the request body
    let user_details = {
      username: req.body.username,
      firstname: req.body.firstName,
      lastname: req.body.lastName,
      country: req.body.country,
      password: req.body.password,
      email: req.body.email,
      profilePic: req.body.profilePic
    };

    // Check if username already exists in the database
    let users = await DButils.execQuery("SELECT username from users");
    if (users.find((x) => x.username === user_details.username))
      throw { status: 409, message: "Username taken" };

    // Hash the password before storing
    let hash_password = bcrypt.hashSync(
      user_details.password,
      parseInt(process.env.bcrypt_saltRounds)
    );

    // Insert the new user into the database
    await DButils.execQuery(
      `INSERT INTO users (username, firstname, lastname, country, password, email) VALUES ('${user_details.username}', '${user_details.firstname}', '${user_details.lastname}', '${user_details.country}', '${hash_password}', '${user_details.email}')`
    );

    // Send success response
    res.status(201).send({ message: "User created", success: true });
  } catch (error) {
    next(error); // Forward error to the error-handling middleware
  }
});

/**
 * @route POST /Login
 * @desc Log in a user by verifying their username and password.
 * @param {string} username - The user's username.
 * @param {string} password - The user's password.
 * @access Public
 */
router.post("/Login", async (req, res, next) => {
  const { username, password } = req.body;
  try {
    // Check if the username exists
    const users = await DButils.execQuery(`SELECT * FROM users WHERE username = '${username}'`);
    if (users.length === 0) {
      return res.status(401).send({ message: "Username or Password incorrect", success: false });
    }

    const user = users[0];

    // Verify the password
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).send({ message: "Username or Password incorrect", success: false });
    }

    // Set up user session after successful login
    req.session.authenticated = true;
    req.session.user = {
      user_id: user.user_id,
      username: user.username
    };

    // Send success response
    res.status(200).send({ message: "Login succeeded", success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /Logout
 * @desc Log out the currently logged-in user by destroying the session.
 * @access Private (authenticated users only)
 */
router.post("/Logout", (req, res) => {
  // Destroy the session to log out the user
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ message: "Logout failed", success: false });
    }

    // Clear the session cookie and send success response
    res.clearCookie('template');
    res.status(200).send({ message: "Logout succeeded", success: true });
  });
});

module.exports = router;
