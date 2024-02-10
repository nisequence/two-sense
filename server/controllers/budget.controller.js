const router = require("express").Router();
const Budget = require("../models/budget.model");
const User = require("../models/user.model");

const serverError = (res, error) => {
  console.log("Server-side error");
  return res.status(500).json({
    Error: error.message,
  });
};

//! Concept Notes
// Budgets are dynamic. They can exist as a one-time object or recurring beginning at a specified date.

//? POST Route for Creation
// (id in URL refers to either personal or household id; dependant on base var)
router.post("/add", async (req, res) => {
  try {
    const { budgetName, budgetAmt, recurring, initialization } = req.body;

    //* Before assigning budget to this user, confirm user ID is findable
    const findUser = await User.findOne({ _id: req.user._id });

    if (!findUser) {
        // If user is not findable
        return res.status(404).json({
          message: "User not found!",
        });
      }

      //* As long as it's a good request, add the new budget to the user
      const budget = new Budget({
        budgetName: budgetName,
        budgetAmt: budgetAmt,
        recurring: recurring,
        initialization: initialization,
        ownerID: req.user._id,
      });

      const newBudget = await budget.save();

      return res.status(200).json({
        message: `You are now the owner of a brand-new budget!`,
        newBudget,
      });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET All Personal Budgets
router.get("/mine", async (req, res) => {
  try {
    //* This is what we will use to filter through the budget items
    const id = req.user._id;

    //* Search for budgets matching this filter
    const allBudgets = await Budget.find({ ownerID: id });

    //* Confirm that at least one was found
    allBudgets.length > 0
      ? res.status(200).json({
          message: "Budget(s) found!",
          allBudgets,
        })
      : res.status(404).json({
          message: `No budgets found for your account.`,
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET Budget By ID
router.get("/:id", async (req, res) => {
  try {
    //* Pull budget's id from params
    const { id } = req.params;

    //* Locating specific budget from database
    const getBudget = await Budget.findOne({ _id: id });

    //* Confirm that it was found
    getBudget
      ? res.status(200).json({
          message: `Budget was found!`,
          getBudget,
        })
      : res.status(404).json({
          message: "No budget found.",
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? PATCH Route for all budgets
router.patch("/edit/:id", async (req, res) => {
  try {
    //* Destructuring the budget ID, user ID, and req. body
    const { id } = req.params;
    const userID = req.user._id;
    const { budgetName, budgetAmt } = req.body;

    //* First, check the database for the budget
    const findBudget = await Budget.findOne({ _id: id });

    if (!findBudget) {
      // If budget is not findable
      return res.status(404).json({
        message: "Budget not found!",
      });
    }

    //* Second, we will check if the user has the ability to change the budget
    if (findBudget.ownerID != userID) {
      return res.status(401).json({
        message: "Sorry, you're not authorized!",
      });
    }

    //* Success! The user can edit
    const filter = { _id: id };
    const newInfo = { budgetName: budgetName, budgetAmt: budgetAmt };
    const returnOption = { new: true };

    // communicate with the database about what we are updating
    const updatedBudget = await Budget.findOneAndUpdate(
      filter,
      newInfo,
      returnOption
    );

    //* Send response to client based on successful update
    updatedBudget
      ? res.status(200).json({
          message: "Successfully updated budget!",
        })
      : res.status(520).json({
          message: "Unable to update budget.",
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? DELETE Route to delete budget if admin
router.delete("/delete/:id", async (req, res) => {
  try {
    //* Pull budget id from params
    const { id } = req.params;
    const userID = req.user._id;

    //* Find and confirm the user has access to the budget
    const deleteBudget = await Budget.deleteOne({ _id: id, ownerID: userID });

    deleteBudget.deletedCount === 1
      ? res.status(200).json({
          message: "Budget was successfully deleted!",
        })
      : res.status(404).json({
          message: "Access to or existence of this budget was not located",
        });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;
