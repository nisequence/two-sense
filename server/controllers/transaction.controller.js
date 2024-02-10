const router = require("express").Router();
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const Household = require("../models/household.model");
const Budget = require("../models/budget.model");
const Bills = require("../models/bill.model");

const serverError = (res, error) => {
  console.log("Server-side error");
  return res.status(500).json({
    Error: error.message,
  });
};

//? POST ROUTE "/add"
//* Successful on Postman MR
router.post("/add", async (req, res) => {
  try {
    const {
      month,
      day,
      year,
      // desc,
      merchant,
      amount,
      finAccount,
      type,
      category,
      base,
      billID,
    } = req.body;
    const userID = req.user._id;
    let newAmount;
    if (type == "expense") {
      newAmount = 0 - amount;
    } else {
      newAmount = amount;
    }
    if (base == "personal") {
      // make sure ID is correct & findable
      const findUser = await User.findOne({ _id: req.user._id });

      if (!findUser) {
        // if user is not findable
        return res.status(404).json({
          message: "User not found!",
        });
      }

      // If user works add new transaction
      const transaction = new Transaction({
        ownerID: userID,
        month: month,
        day: day,
        year: year,
        // desc: desc,
        merchant: merchant,
        amount: newAmount,
        finAccount: finAccount,
        type: type,
        category: category,
        base: req.user._id,
        billID: req.body.billID,
      });

      const newTransaction = await transaction.save();

      return res.status(200).json({
        message: `You have created a new transaction!`,
        newTransaction,
      });
    } else if (base == "household") {
      // get household ID
      const findHousehold = await Household.findOne({
        _id: req.user.householdID,
      });

      if (!findHousehold) {
        // if household can't be found
        return res.status(404).json({
          message: "Household not found!",
        });
      }

      // if works add new transaction to household
      const transaction = new Transaction({
        ownerID: userID,
        merchant: merchant,
        amount: newAmount,
        type: type,
        category: category,
        month: month,
        day: day,
        year: year,
        // desc: desc,
        finAccount: req.user.firstName,
        //! We don't want to show bank info on household!
        base: req.user.householdID,
      });

      const newTransaction = await transaction.save();

      return res.status(200).json({
        message: `Your household has a new transaction!`,
        newTransaction,
      });
    } else {
      return res.status(400).json({
        message: `Must select personal or household as base`,
      });
    }
  } catch (err) {
    serverError(res, err);
  }
});
//? GET ALL HOUSEHOLD ROUTE "/household"

router.get("/household", async (req, res) => {
  try {
    const id = req.user.householdID;

    const getAllTransactions = await Transaction.find({ base: id });

    getAllTransactions
      ? res.status(200).json({
          message: "All transaction from household collection",
          getAllTransactions,
        })
      : res.status(404).json({
          message: `No transactions found.`,
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET ALL PERSONAL ROUTE "/mine"
//* Successful on Postman

router.get("/mine", async (req, res) => {
  try {
    const id = req.user._id;

    const getAllTransactions = await Transaction.find({ base: id });

    getAllTransactions
      ? res.status(200).json({
          message: "All transaction from user collection",
          getAllTransactions,
        })
      : res.status(404).json({
          message: `No transactions found.`,
        });
  } catch (err) {
    serverError(res, err);
  }
});
//? GET BY DATE ROUTE "/date/:date"
//* Successful in postman

// router.get("/date/:month/:day", async (req, res) => {
//   try {
//     const { month, day } = req.params;

//     const getDate = await Transaction.find({ month: month, day: day });

//     getDate.length > 0
//       ? res.status(200).json({
//           getDate,
//         })
//       : res.status(404).json({
//           message: "No transactions found for this date.",
//         });
//   } catch (err) {
//     serverError(res, err);
//   }
// });

//? GET BY CATEGORY ROUTE "/category/:category"
//* Successful on Postman

router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const getCategories = await Transaction.find({ category: category });

    getCategories.length > 0
      ? res.status(200).json({
          getCategories,
        })
      : res.status(404).json({
          message: "No category found.",
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET USER TOTALS IN HOUSEHOLD BY MONTH ("/household/:month")

router.get("/household/:month", async (req, res) => {
  try {
    const { month } = req.params;

    const getTransactions = await Transaction.find(
      { month: month, year: year, base: req.user.householdID }
    );

    getTransactions.length > 0
      ? res.status(200).json({
          message: "Found transactions!",
          getTransactions,
        })
      : res.status(404).json({
          message: "No transactions found.",
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET ONE ROUTE "/find/:id"
//* Successful on Postman

router.get("/find/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const getTransaction = await Transaction.findOne({ _id: id });

    getTransaction
      ? res.status(200).json({
          message: `${getTransaction.category} transaction was found!`,
          getTransaction,
        })
      : res.status(404).json({
          message: "No transaction found.",
        });
  } catch (err) {
    serverError(res, err);
  }
});


//? PATCH ROUTE "/edit/:id"
//* Working on Postman MR

router.patch("/edit/:id", async (req, res) => {
  try {
    // pull value from parameter (id)
    const { id } = req.params;

    const { month, day, year, desc, merchant, amount, category, type } = req.body;
    let newAmount;
    if (type == "expense") {
      newAmount = 0 - amount;
    } else {
      newAmount = amount;
    }
    // pull info from body
    const info = {
      month: month,
      day: day,
      year: year,
      desc: desc,
      merchant: merchant,
      amount: newAmount,
      category: category,
      type: type,
    };
    const userID = req.user._id;

    const returnOption = { new: true };

    //* findOneAndUpdate(query/filter, document, options)
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: id, ownerID: userID },
      info,
      returnOption
    );

    updatedTransaction
    ? res.status(200).json({
      message: `Transaction has been updated successfully`,
      updatedTransaction,
    })
    :res.status(404).json({
      message: `Transaction unable to be edited`,
    })
  } catch (err) {
    serverError(res, err);
  }
});

//? DELETE ROUTE "/delete/:id"
//* Successful on Postman
router.delete("/delete/:id", async (req, res) => {
  try {
    //* Pull transaction id from params
    const { id } = req.params;
    const userID = req.user._id;

    //* Find and confirm the user has access to the transaction
    const deleteTransaction = await Transaction.deleteOne({
      _id: id,
      ownerID: userID,
    });

    deleteTransaction.deletedCount === 1
      ? res.status(200).json({
          message: "Transaction was successfully deleted!",
        })
      : res.status(404).json({
          message: "Access to or existence of this transaction was not located",
        });
  } catch (err) {
    serverError(res, err);
  }
});

module.exports = router;