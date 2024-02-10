const router = require("express").Router();
const User = require("../models/user.model");
const Household = require("../models/household.model");
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

function breakdownPercents(totalUsers) {
  //* Split 100% of costs between users, then round that number to the nearest whole
  let breakdownPercent = 100 / totalUsers;
  breakdownPercent = Math.round(breakdownPercent);

  //* In the event that these numbers will now not = 100 when added, determine an amount that one user (admin) will take to even things out
  let disparity = 100 - breakdownPercent * totalUsers;
  disparity = disparity + breakdownPercent;

  //* Use an array to track the percentage inputs in the order that the user IDs are listed
  let breakdownArray = [];

  //* In the case that disparity is not needed (numbers are completely even)
  if (disparity === 0) {
    for (x = 0; x < totalUsers; x++) {
      // every user will pay exactly the same
      breakdownArray.push(breakdownPercent);
    }
    //* In the case that disparity IS needed...
  } else {
    //push the disparity to the admin
    breakdownArray.push(disparity);
    for (x = 1; x < totalUsers; x++) {
      // starting with one should skip the admin
      breakdownArray.push(breakdownPercent);
    }
  }
  return breakdownArray;
}

//? POST Route for Register
router.post("/register", async (req, res) => {
  try {
    //* Take the info from the request body and match it to the schema keys
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 11),
      householdID: null,
      //* householdID MUST be null in leu of any actual ID - undefined will delete the key/value pair altogether, creating an issue for other routes
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

//? PATCH Route to Leave Household
router.patch("/abandon", requireValidation, async (req, res) => {
  try {
    //* Pull the user's info from the req
    const id = req.user._id;
    const householdID = req.user.householdID;

    //* Constants to update both the User and Household objects in the db
    const userFilter = { _id: id };
    const householdFilter = { _id: householdID };
    const userNewInfo = { householdID: null };
    const returnOption = { new: true };

    //* Check if the user has a household
    if (householdID == null) {
      return res.status(404).json({
        message: "Household not found within user profile!",
      });
    }

    //* Attempt to find the HH based on given ID
    const findHousehold = await Household.findOne({ _id: householdID });

    //* Confirm that the household is findable
    if (!findHousehold) {
      return res.status(404).json({
        message: "Household not found in database!",
      });
    }

    let updateIDs = findHousehold.participantIDs;
    let updateNames = findHousehold.participantNames;

    updateIDs.splice(updateIDs.indexOf(id), 1);
    updateNames.splice(updateIDs.indexOf(id), 1);

    //* Track how many users are now in the household
    let numOfUsers = updateIDs.length;

    //* Update the percentages based on how many users there are
    let breakdownArray = breakdownPercents(numOfUsers);

    //*Update HH
    const householdNewInfo = {
      participantIDs: updateIDs,
      participantNames: updateNames,
      participantPercents: breakdownArray,
    };

    //* findOneAndUpdate(query/filter, document, options)
    const updatedHousehold = await Household.findOneAndUpdate(
      householdFilter,
      householdNewInfo,
      returnOption
    );

    if (updatedHousehold == false) {
      return res.status(400).json({
        message:
          "Something went wrong when trying to remove you from the household!",
      });
    }
    //* Remove household from user profile

    const updateUser = await User.findOneAndUpdate(
      userFilter,
      userNewInfo,
      returnOption
    );

    updateUser
      ? res.status(200).json({
          message: `User was successfully removed from the household!`,
          updateUser,
        })
      : res.status(404).json({
          message: `User data unable to be updated.`,
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
    const { firstName, lastName, email } = req.body;
    let userNewInfo;
    if (req.body.password) {
      password = bcrypt.hashSync(req.body.password, 11);
      userNewInfo = { firstName, lastName, email, password };
    } else {
      userNewInfo = {firstName, lastName, email}
    }
    // const userNewInfo = { firstName, lastName, email, password };

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
        message: "Error in updating user profile. Please log out & back in.",
      });
    }

    //* Check to see if user has a household to update
    if (req.user.householdID == null) {
      // User does not have a household to update
      return res.status(200).json({
        message: "Profile successfully updated!",
        updateUser
      });
    }

    //* Now that we know they have a household, locate the household that the user is part of to update their name there
    const findHousehold = await Household.findOne({
      _id: req.user.householdID,
    });

    //* Confirm that the user is a part of the household found
    if (findHousehold.participantIDs.includes(id)) {
      // if the user is found, replace their old first name with their new first name in the correct spot
      findHousehold.participantNames.splice(
        findHousehold.participantIDs.indexOf(id),
        1,
        firstName
      );
    } else {
      // if the user is not found
      return res.status(404).json({
        message: "User not found within household...",
      });
    }

    //* Save the new array in a constant to send to the database
    const householdNewInfo = {
      participantNames: findHousehold.participantNames,
    };

    //* Update the household in the database with the new info
    const updateHousehold = await Household.findOneAndUpdate(
      householdFilter,
      householdNewInfo,
      returnOption
    );

    //* Send response based on success/failure to update
    updateHousehold
      ? res.status(200).json({
          message: `Profile successfully updated!`,
updateUser
        })
      : res.status(404).json({
          message: `User data unable to be updated.`,
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? DELETE Route for Own Account Removals
router.delete("/quit", requireValidation, async (req, res) => {
  try {
    //* Pull the user's info from the req
    const id = req.user._id;
    const householdID = req.user.householdID;

    //* Constants to update both the User and Household objects in the db
    const userFilter = { _id: id };
    const householdFilter = { _id: householdID };
    const returnOption = { new: true };

    //* Check if the user has a household
    if (householdID != null) {
      //* Attempt to find the HH based on given ID
      const findHousehold = await Household.findOne({ _id: householdID });

      //* Confirm that the household is findable
      if (!findHousehold) {
        return res.status(404).json({
          message: "Household not found in database!",
        });
      }

      let updateIDs = findHousehold.participantIDs;
      let updateNames = findHousehold.participantNames;

      updateIDs.splice(updateIDs.indexOf(id), 1);
      updateNames.splice(updateIDs.indexOf(id), 1);

      //* Track how many users are now in the household
      let numOfUsers = updateIDs.length;

      //* Update the percentages based on how many users there are
      let breakdownArray = breakdownPercents(numOfUsers);

      //*Update HH
      const householdNewInfo = {
        participantIDs: updateIDs,
        participantNames: updateNames,
        participantPercents: breakdownArray,
      };

      //* findOneAndUpdate(query/filter, document, options)
      const updatedHousehold = await Household.findOneAndUpdate(
        householdFilter,
        householdNewInfo,
        returnOption
      );

      if (updatedHousehold == false) {
        return res.status(400).json({
          message:
            "Something went wrong when trying to remove you from the household!",
        });
      }
    }

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