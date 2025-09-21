const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { generateToken } = require('../middleware/auth');
const { User } = require('../models/database-mongo');

const router = express.Router();

// Configure passport strategies
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy (only if credentials provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value.toLowerCase();
        const providerId = profile.id;
        
        let existingUser = await User.findOne({
          $or: [
            { email: email },
            { provider: 'google', provider_id: providerId }
          ]
        });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const userData = {
          email: email,
          username: profile.displayName || email.split('@')[0],
          provider: 'google',
          provider_id: providerId,
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          avatar_url: profile.photos[0]?.value
        };
        
        const newUser = await User.create(userData);
        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// GitHub OAuth Strategy (only if credentials provided)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = (profile.emails?.[0]?.value || `${profile.username}@github.local`).toLowerCase();
        const providerId = profile.id;
        
        let existingUser = await User.findOne({
          $or: [
            { email: email },
            { provider: 'github', provider_id: providerId }
          ]
        });
        
        if (existingUser) {
          return done(null, existingUser);
        }
        
        // Create new user
        const userData = {
          email: email,
          username: profile.username,
          provider: 'github',
          provider_id: providerId,
          first_name: profile.displayName || profile.username,
          last_name: '',
          avatar_url: profile.photos[0]?.value
        };
        
        const newUser = await User.create(userData);
        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Local registration
router.post('/register', async (req, res) => {
  const { email, password, username, first_name, last_name } = req.body;
  
  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username }
      ]
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const newUser = await User.create({
      email: email.toLowerCase(),
      username: username,
      password_hash: passwordHash,
      provider: 'local',
      first_name: first_name || '',
      last_name: last_name || ''
    });
    
    const token = generateToken(newUser);
    const { password_hash, ...userWithoutPassword } = newUser.toObject();
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token: token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Local login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Authentication failed' });
    }
    
    const token = generateToken(user);
    const { password_hash, ...userWithoutPassword } = user.toObject();
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token: token
    });
  })(req, res, next);
});

// Google OAuth routes (only if credentials provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    (req, res) => {
      const token = generateToken(req.user);
      const { password_hash, ...userWithoutPassword } = req.user.toObject();
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`);
    }
  );
}

// GitHub OAuth routes (only if credentials provided)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get('/github', passport.authenticate('github', {
    scope: ['user:email']
  }));

  router.get('/github/callback', 
    passport.authenticate('github', { session: false }),
    (req, res) => {
      const token = generateToken(req.user);
      const { password_hash, ...userWithoutPassword } = req.user.toObject();
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`);
    }
  );
}

// Get current user profile
router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password_hash, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;