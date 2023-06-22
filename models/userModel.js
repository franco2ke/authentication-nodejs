const mongoose = require('mongoose');
const validator = require('validator'); // data validation library
const bcrypt = require('bcryptjs'); // enterprise-grade password hashing library
const otpGenerator = require('otp-generator'); //one time passcode generator
const crypto = require('crypto');

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
      `Password is weak, use atleast 8 characters with 1 number, 1 lowercase, 1 uppercase & 1 symbol`,
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
  otpHashed: String,
  otpExpires: Date,
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
    default: false,
    select: false,
  },
});

// 1) Mongoose pre - save middleware to encrypt user password on database save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // skip if password not modified (created/saved)
  this.password = await bcrypt.hash(this.password, 12); // hash password using bcrypt
  // remove passwordConfirm field from document as necessary only for password validation
  // setting document field to undefined, will not save it == deletion
  this.passwordConfirm = undefined;
  next();
});

// 2) Instance Method to generate 6 digit OTP & save to DB
userSchema.methods.createOTP = async function () {
  // generate OTP
  let otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
  });
  // encrypt OTP (security measure) and store in DB
  this.otpHashed = crypto.createHash('sha256').update(otp).digest('hex');

  console.log(`The reset token sent to user via email:\n`, { otp });
  console.log(`The encrypted reset token (DB): ${this.otpHashed}`);
  // Set Token expiry time in milliseconds and store in DB
  // For 5 min: OTP_EXPIRES_IN = 5
  this.otpExpires = Date.now() + process.env.OTP_EXPIRES_IN * 60 * 1000;

  await this.save();

  return otp;
};

// 3) Instance method to compare submitted & stored user password
// Implemented here due ot FAT MODEL, THIN CONTROLLER principle
// compare passwords and return true if same
userSchema.methods.correctPassword = async function (
  candidatePassword, // password from request
  userPassword // the hashed user password stored in DB
) {
  // 'this' points to document but 'this.userPassword' not available
  // because it is hidden through the modelSchema; ('select': false)
  // therefore it needs to be passed in
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);

// Export the User model
module.exports = User;
