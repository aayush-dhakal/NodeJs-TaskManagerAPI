const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error(); // no need to provide error message as this throw will trigger catch statement in its own and the catch error will be send
    }

    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Authentication failed. Token not matched" });
  }
};

module.exports = auth;
