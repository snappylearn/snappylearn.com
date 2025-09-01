import * as client from "openid-client";
import { Strategy as OpenIDStrategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  userInfo: any,
  provider: string = 'replit'
) {
  let userId: string;
  let email: string;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let profileImageUrl: string | null = null;

  // Handle different provider data formats
  switch (provider) {
    case 'replit':
      userId = userInfo["sub"];
      email = userInfo["email"];
      firstName = userInfo["first_name"];
      lastName = userInfo["last_name"];
      profileImageUrl = userInfo["profile_image_url"];
      break;
    case 'google':
      userId = `google_${userInfo.id}`;
      email = userInfo.emails?.[0]?.value || userInfo.email;
      firstName = userInfo.name?.givenName;
      lastName = userInfo.name?.familyName;
      profileImageUrl = userInfo.photos?.[0]?.value;
      break;
    case 'github':
      userId = `github_${userInfo.id}`;
      email = userInfo.emails?.[0]?.value || userInfo.email;
      firstName = userInfo.displayName?.split(' ')[0] || userInfo.username;
      lastName = userInfo.displayName?.split(' ').slice(1).join(' ') || null;
      profileImageUrl = userInfo.photos?.[0]?.value || userInfo.avatar_url;
      break;
    case 'facebook':
      userId = `facebook_${userInfo.id}`;
      email = userInfo.emails?.[0]?.value || userInfo.email;
      firstName = userInfo.name?.givenName || userInfo.first_name;
      lastName = userInfo.name?.familyName || userInfo.last_name;
      profileImageUrl = userInfo.photos?.[0]?.value;
      break;
    case 'twitter':
      userId = `twitter_${userInfo.id}`;
      email = userInfo.emails?.[0]?.value || userInfo.email;
      firstName = userInfo.displayName?.split(' ')[0] || userInfo.username;
      lastName = userInfo.displayName?.split(' ').slice(1).join(' ') || null;
      profileImageUrl = userInfo.photos?.[0]?.value;
      break;
    case 'local':
      userId = `local_${userInfo.email}`;
      email = userInfo.email;
      firstName = userInfo.firstName;
      lastName = userInfo.lastName;
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  await storage.upsertUser({
    id: userId,
    email,
    firstName,
    lastName,
    profileImageUrl,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Replit OpenID Connect Strategy
  if (process.env.REPLIT_DOMAINS) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = { provider: 'replit' };
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims(), 'replit');
      verified(null, user);
    };

    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      const strategy = new OpenIDStrategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/auth/replit/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }
  }

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await upsertUser(profile, 'google');
        done(null, { provider: 'google', profile });
      } catch (error) {
        done(error);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback"
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        await upsertUser(profile, 'github');
        done(null, { provider: 'github', profile });
      } catch (error) {
        done(error);
      }
    }));
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ['id', 'emails', 'name', 'picture']
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
      try {
        await upsertUser(profile, 'facebook');
        done(null, { provider: 'facebook', profile });
      } catch (error) {
        done(error);
      }
    }));
  }

  // Twitter OAuth Strategy
  if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: "/api/auth/twitter/callback",
      includeEmail: true
    }, async (token: any, tokenSecret: any, profile: any, done: any) => {
      try {
        await upsertUser(profile, 'twitter');
        done(null, { provider: 'twitter', profile });
      } catch (error) {
        done(error);
      }
    }));
  }

  // Local Strategy (Email/Password)
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      
      done(null, { provider: 'local', profile: user });
    } catch (error) {
      done(error);
    }
  }));

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  // Authentication routes
  setupAuthRoutes(app);
}

function setupAuthRoutes(app: Express) {
  // Replit Auth Routes
  if (process.env.REPLIT_DOMAINS) {
    app.get("/api/auth/replit", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/auth/replit/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/auth?error=replit_failed",
      })(req, res, next);
    });
  }

  // Google Auth Routes
  app.get("/api/auth/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback", 
    passport.authenticate("google", { 
      successReturnToOrRedirect: "/",
      failureRedirect: "/auth?error=google_failed" 
    })
  );

  // GitHub Auth Routes
  app.get("/api/auth/github", 
    passport.authenticate("github", { scope: ["user:email"] })
  );

  app.get("/api/auth/github/callback", 
    passport.authenticate("github", { 
      successReturnToOrRedirect: "/",
      failureRedirect: "/auth?error=github_failed" 
    })
  );

  // Facebook Auth Routes
  app.get("/api/auth/facebook", 
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get("/api/auth/facebook/callback", 
    passport.authenticate("facebook", { 
      successReturnToOrRedirect: "/",
      failureRedirect: "/auth?error=facebook_failed" 
    })
  );

  // Twitter Auth Routes
  app.get("/api/auth/twitter", 
    passport.authenticate("twitter")
  );

  app.get("/api/auth/twitter/callback", 
    passport.authenticate("twitter", { 
      successReturnToOrRedirect: "/",
      failureRedirect: "/auth?error=twitter_failed" 
    })
  );

  // Local Auth Routes (Email/Password)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await storage.createUser({
        id: `local_${email}`,
        email,
        firstName,
        lastName,
        passwordHash,
        emailVerified: false,
      });

      // Log user in
      req.login({ provider: 'local', profile: user }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.json({ message: "Registration successful", user });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", 
    passport.authenticate("local", { 
      successReturnToOrRedirect: "/",
      failureRedirect: "/auth?error=login_failed" 
    })
  );

  // Logout route
  app.get("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.redirect("/");
    });
  });

  // Legacy routes for backward compatibility
  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/replit");
  });

  app.get("/api/logout", (req, res) => {
    res.redirect("/api/auth/logout");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Handle Replit authentication with token refresh
  if (user.provider === 'replit' && user.expires_at) {
    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const config = await getOidcConfig();
      const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
      updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  // Handle other OAuth providers (Google, GitHub, Facebook, Twitter) and local auth
  if (user.provider && (user.profile || user.provider === 'local')) {
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
};