const express = require('express');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { generateToken } = require('../middleware/auth');
const db = require('../models/database');

const router = express.Router();

// Configure passport strategies
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
          return done(err);
        }
        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        return done(null, user);
      });
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
        const email = profile.emails[0].value;
        const providerId = profile.id;
        
        db.get('SELECT * FROM users WHERE email = ? OR (provider = ? AND provider_id = ?)', 
          [email, 'google', providerId], (err, existingUser) => {
          if (err) {
            return done(err);
          }
          
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
          
          db.run(
            'INSERT INTO users (email, username, provider, provider_id, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userData.email, userData.username, userData.provider, userData.provider_id, userData.first_name, userData.last_name, userData.avatar_url],
            function(err) {
              if (err) {
                return done(err);
              }
              
              db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
                if (err) {
                  return done(err);
                }
                return done(null, user);
              });
            }
          );
        });
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
        const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
        const providerId = profile.id;
        
        db.get('SELECT * FROM users WHERE email = ? OR (provider = ? AND provider_id = ?)', 
          [email, 'github', providerId], (err, existingUser) => {
          if (err) {
            return done(err);
          }
          
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
          
          db.run(
            'INSERT INTO users (email, username, provider, provider_id, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userData.email, userData.username, userData.provider, userData.provider_id, userData.first_name, userData.last_name, userData.avatar_url],
            function(err) {
              if (err) {
                return done(err);
              }
              
              db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
                if (err) {
                  return done(err);
                }
                return done(null, user);
              });
            }
          );
        });
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
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email or username already exists' });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create user
      db.run(
        'INSERT INTO users (email, username, password_hash, provider, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
        [email, username, passwordHash, 'local', first_name || '', last_name || ''],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Get created user
          db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            const token = generateToken(user);
            const { password_hash, ...userWithoutPassword } = user;
            
            res.status(201).json({
              message: 'User created successfully',
              user: userWithoutPassword,
              token: token
            });
          });
        }
      );
    });
  } catch (error) {
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
    const { password_hash, ...userWithoutPassword } = user;
    
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
      const { password_hash, ...userWithoutPassword } = req.user;
      
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
      const { password_hash, ...userWithoutPassword } = req.user;
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userWithoutPassword))}`);
    }
  );
}

// Get current user profile
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
    
    db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const { password_hash, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    });
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;