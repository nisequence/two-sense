const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const requireValidation = async (req, res, next) => {
  try {
    // pull token from whoever the request comes from
    const token = req.headers.authorization;

    // check the status of token (expired?)
    const decodedToken = await jwt.verify(token, process.env.JWT);

    // check for user that matches token user id
    const user = await User.findById(decodedToken.id);

    // if not found, throw error
    if (!user) throw Error("User not found.");
    
    // if valid, generate a variable that holds user info
    req.user = user;

    return next(); // moves us on to our routes/endpoint
  } catch (err) {
    res.json({ message: err.message });
  }
};

// Export the function
module.exports = requireValidation;