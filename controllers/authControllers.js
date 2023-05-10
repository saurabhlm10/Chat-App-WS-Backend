const User = require("../model/User");
const bcrypt = require('bcryptjs')
const jwt = require("jsonwebtoken");



const jwtSecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync(10);


exports.register = async (req, res) => {
  const { username, password } = req.body;

  if (!(username && password)) {
    res.sendStatus(401)
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });
    jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, { secure: true }).status(201).json({
        id: createdUser._id,
      });
    });
  } catch (err) {
    if (err) throw err;
    res.status(500).json('error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });

  if (foundUser) {
    const passOk = bcrypt.compareSync(password, foundUser.password);
    if (passOk) {
      jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token, { sameSite: 'none', secure: true }).json({
          id: foundUser._id,
        });
      });
    } else {
      res.status(403).send('password Incorrect')
    }
  } else {
    res.status(402).send('User Not Registered')
  }
};

exports.logout = (req, res) => {
  res.cookie('token', '', { sameSite: 'none', secure: true }).json('ok');
}