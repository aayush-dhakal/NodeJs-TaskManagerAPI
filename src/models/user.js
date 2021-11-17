const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,

      // mongoose built-in validation
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,

      // third party validation using validator package
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("email is invalid");
        }
      },
    },
    age: {
      type: Number,
      default: 0,

      // custom validation
      validate(value) {
        if (value < 0) {
          throw new Error("age must be a positive number");
        }
      },
    },

    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error('password cannot contain the word "password"');
        }
      },
    },

    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);
// this is basically to fetch the tasks created by a particular user
// this is not actually stored in db but is here to rather just tell mongo about the link of user and task. note we use tasks(which is what stored as in mongodb because you can give any name here). model file name is task(lowecase singular), model name is Task(uppercase singular) and the collection name in db is tasks(lowercase pulular)
// watch video 13 of part 12 super important
userSchema.virtual("tasks", {
  ref: "Task", // reference to Task model
  localField: "_id", // users id
  foreignField: "owner", // user associated in Task model
});

// use userSchema.methods for an instance of a User model like user(small letter user)
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, "thisismynewcourse");

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// defining the stuffs that are accessible to the user's profile(basically to exclude sensitive datas like password and tokens). Here toJSON method will auto insert this functionality whenever we send back our user from the routes body. toJSON basically modifies the data that is send, here we are not defining what data to show but just what data to delete so rest of the data will be send as it is
userSchema.methods.toJSON = function () {
  const user = this;

  // mongodb has lots of extra properties attached by default for saving the user. here we only want the raw format of that data(stuff like name, email, ..). For that use toObject() method
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  // note we are saving the user here so the database's data will not be altered

  return userObject;
};

// use userSchema.statics for an actual model like User(capital letter)
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login. Email not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login. Password is wrong");
  }

  return user;
};

// Hash the plain text password before saving
userSchema.pre("save", async function (next) {
  // since we are using this binding here do not use arrow function above
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// deleting all the tasks of user if the user itself is deleted
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
