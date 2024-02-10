const router = require("express").Router();
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SECRET = process.env.JWT;
const requireValidation = require("../middleware/validate-session");

const serverError = (res, error) => {
  console.log("Server-side error");
  return res.status(500).json({
    Error: error.message,
  });
};

//? POST Route for Register
router.post("/register", async (req, res) => {
  try {
    const user = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 13),
    });

    //* Save the new user with this info to our database
    const newUser = await user.save();

    //* Provide the user a token to use
    const token = jwt.sign({ id: user._id }, SECRET, {
      expiresIn: "3 days",
    });

    //* Give them a positive response as long as no errors have occurred
    return res.status(200).json({
      user: newUser,
      message: "New user created!",
      token,
    });
  } catch (err) {
    serverError(res, err);
  }
});

//? POST Route for login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) throw new Error("Credentials do not match!");

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) throw new Error("Credentials do not match!");

    //4. After verified, provide a jwt token
    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "3 days" });

    //5. response status returned
    return res.status(200).json({
      message: "Login successful!",
      user,
      token,
    });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET Route for Own Info
router.get("/find", requireValidation, async (req, res) => {
  try {
    const id = req.user._id;

    const findUser = await User.findOne({ _id: id });

    findUser
      ? res.status(200).json({
          message: "Found!",
          findUser,
        })
      : res.status(404).json({
          message: "Not found!",
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? PATCH Route to Edit Profile
router.patch("/adjust", requireValidation, async (req, res) => {
  try {
    //* Save the user's id and create the filter
    const id = req.user._id;
    const userFilter = { _id: id };
    const householdFilter = { _id: req.user.householdID };

    //* Pull update-able info from the req.body
    const { userName, email } = req.body;
    let userNewInfo;
    if (req.body.password) {
      password = bcrypt.hashSync(req.body.password, 13);
      userNewInfo = { userName, email, password };
    } else {
      userNewInfo = {userName, email}
    }

    const returnOption = { new: true };

    //* Attempt to update the corresponding user item in the database
    const updateUser = await User.findOneAndUpdate(
      userFilter,
      userNewInfo,
      returnOption
    );

    if (!updateUser) {
      //* Unable to update user in the database
      return res.status(404).json({
        message: "Error in updating user profile. Usernames and emails cannot be shared with other users. Please try again.",
      });
    }

  } catch (err) {
    serverError(res, err);
  }
});

//? DELETE Route for Own Account Removals
router.delete("/quit", requireValidation, async (req, res) => {
  try {
    //* Pull the user's info from the req
    const id = req.user._id;

    //* Constants to update both the User and Household objects in the db
    const userFilter = { _id: id };

    //* Remove user profile
    const deleteUser = await User.deleteOne(userFilter);

    deleteUser.deletedCount === 1
      ? res.status(200).json({
          message: `User was successfully removed from the household and deleted!`,
        })
      : res.status(404).json({
          message: `User data unable to be deleted.`,
        });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;