const router = require("express").Router();
const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");
const Budget = require("../models/budget.model");

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
      uploadID,
      date,
      desc,
      withdrawal,
      amount,
      category,
      ownerID,
    } = req.body;
    const userID = req.user._id;
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
        uploadID: uploadID,
        date: date,
        desc: desc,
        withdrawal: withdrawal,
        amount: amount,
        category: category,
        ownerID: userID,
      });

      const newTransaction = await transaction.save();

      return res.status(200).json({
        message: `You have created a new transaction!`,
        newTransaction,
      });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET ALL PERSONAL ROUTE "/mine"
router.get("/mine", async (req, res) => {
  try {
    const id = req.user._id;

    const getAllTransactions = await Transaction.find({ ownerID: id });

    getAllTransactions.length >0
      ? res.status(200).json({
          message: "Transaction(s) found!",
          getAllTransactions,
        })
      : res.status(404).json({
          message: `No transactions found. Upload some now!`,
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET BY CATEGORY ROUTE "/category/:category"
router.get("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;

    const getCategories = await Transaction.find({ category: category });

    getCategories.length > 0
      ? res.status(200).json({
          message: "Transaction(s) found!",
          getCategories,
        })
      : res.status(404).json({
          message: "No transactions found under this category.",
        });
  } catch (err) {
    serverError(res, err);
  }
});

//? GET ONE TRANSACTION BY ID "/find/:id"
router.get("/find/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const getTransaction = await Transaction.findOne({ _id: id });

    getTransaction
      ? res.status(200).json({
          message: `This transaction was found!`,
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
router.patch("/edit/:id", async (req, res) => {
  try {
    // pull value from parameter (id)
    const { id } = req.params;

    const { desc, category } = req.body;

    // pull info from body
    const info = {
      desc: desc,
      category: category,
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