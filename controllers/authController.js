// A) Sign Up Handler
exports.signup = async (req, res, next) => {
  let newUser;
  try {
    newUser = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    };
  } catch (err) {
    // error caught by global handler so just forwarding is ok
    next(err);
  }

  res.status(201).json({
    status: 'success',
    data: {
      newUser,
    },
  });
};

// B) Default placeholder handler before implementation of custom functions
exports.sendDefaultResponse = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      answer: 'hello',
    },
  });
};
