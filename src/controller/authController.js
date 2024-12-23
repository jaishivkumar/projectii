const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function googleSignIn(req, res) {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name } = ticket.getPayload();

    let user = await User.findByEmail(email);
    if (!user) {
      const userId = await User.create(email, name);
      user = { id: userId, email, name };
    }

    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: jwtToken });
  } catch (error) {
    console.error('Error during Google Sign-In:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { googleSignIn };

