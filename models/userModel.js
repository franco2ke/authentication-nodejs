const mongoose = require('mongoose');
const validator = require('validator');

// firstname, surname, email, mobile no, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
  // User properties and their validation rule
  firstname: {
    type: String,
    required: [true, 'Please enter your first name!'],
    trim: true,
  },
  surname: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    trim: true,
    // run custom validation to check that string meets email format
    validate: [validator.isEmail, 'Please provide a valid email.'],
  },
  phone: [
    // Allow storing of multiple numbers
    {
      tags: ['string'],
      number: 'string',
      remark: 'string',
    },
  ],
  photo: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter your password again to confirm.'],
    minlength: 8,
    validate: [
      validator.isStrongPassword,
      'Password does not meet strength requirements',
    ],
    select: false, // hide password field from query results by default
  },
  passwordConfirm: {
    type: String,
    require: [true, 'Please enter your password again to confirm.'],
    validate: {
      // compare password with passwordConfirm to reduce password typos during sign up.
      // NOTE: This validation only works on CREATE & SAVE! not UPDATE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  accountCreatedAt: Date,
  // For account confirmation
  emailConfirmed: {
    type: Boolean,
    default: false,
    select: false,
  },
  // Mark active and non-active (as deleted)
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

const User = moongoose.model('User', userSchema);

// Export the User model
module.exports = User;
