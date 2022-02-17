const asyncHandler = require('express-async-handler');
const { generateToken } = require('../config/generateToken');
const User = require('../models/userModel');

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;

  if (!name || !email || !password) {
    throw new Error('Please enter all the fields');
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('User not found');
  }
});

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid Email or Password');
  }
});

//@description     Get all users
//@route           GET /api/user/
//@access          Private
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          {
            name: {
              $regex: req.query.search,
              $option: 'i',
            },
          },
          {
            email: {
              $regex: req.query.search,
              $option: 'i',
            },
          },
        ],
      }
    : {};
  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
});

module.exports = { registerUser, authUser, allUsers };
