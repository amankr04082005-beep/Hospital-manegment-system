const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('./logger.service');

/**
 * Refresh Token Service
 *
 * Enterprise security pattern:
 * - Access tokens: short-lived (15 minutes), sent in Authorization header
 * - Refresh tokens: long-lived (7 days), stored securely, rotated on use
 * - Token rotation: each refresh invalidates the previous refresh token
 * - Revocation: refresh tokens can be revoked server-side
 *
 * The tokens are stored in-memory for now. In production, use Redis
 * with TTL for auto-expiry.
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// In-memory store — replace with Redis in production
const refreshTokenStore = new Map();

// Revoked token blacklist (check on every auth request)
const tokenBlacklist = new Set();
const BLACKLIST_CLEANUP_INTERVAL = 15 * 60 * 1000; // 15 min

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of refreshTokenStore.entries()) {
    if (data.expiresAt < now) {
      refreshTokenStore.delete(token);
    }
  }
}, BLACKLIST_CLEANUP_INTERVAL);

/**
 * Generate access token + refresh token pair.
 */
function generateTokenPair(user) {
  // Access token — short-lived
  const accessToken = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Refresh token — long-lived, random string
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  refreshTokenStore.set(refreshToken, {
    userId: user._id.toString(),
    expiresAt,
    createdAt: Date.now(),
  });

  logger.debug('Token pair generated', { userId: user._id, role: user.role });

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // seconds
    refreshExpiresIn: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60,
  };
}

/**
 * Verify and refresh an access token using a refresh token.
 * Implements token rotation: old refresh token is invalidated.
 */
function refreshAccessToken(refreshToken) {
  const stored = refreshTokenStore.get(refreshToken);

  if (!stored) {
    return { success: false, message: 'Invalid refresh token' };
  }

  if (stored.expiresAt < Date.now()) {
    refreshTokenStore.delete(refreshToken);
    return { success: false, message: 'Refresh token expired' };
  }

  // Invalidate old refresh token (rotation)
  refreshTokenStore.delete(refreshToken);

  // Generate new pair
  const user = { _id: stored.userId };
  const tokens = generateTokenPair({ _id: stored.userId });

  logger.info('Access token refreshed', { userId: stored.userId });

  return { success: true, ...tokens };
}

/**
 * Revoke a refresh token (logout).
 */
function revokeRefreshToken(refreshToken) {
  const existed = refreshTokenStore.has(refreshToken);
  refreshTokenStore.delete(refreshToken);
  return { revoked: existed };
}

/**
 * Revoke all refresh tokens for a user (force logout all sessions).
 */
function revokeAllUserTokens(userId) {
  const userIdStr = userId.toString();
  let count = 0;
  for (const [token, data] of refreshTokenStore.entries()) {
    if (data.userId === userIdStr) {
      refreshTokenStore.delete(token);
      count++;
    }
  }
  logger.info('All user tokens revoked', { userId: userIdStr, count });
  return { revoked: count };
}

/**
 * Add an access token to the blacklist (for immediate logout).
 */
function blacklistAccessToken(token) {
  tokenBlacklist.add(token);
}

/**
 * Check if a token is blacklisted.
 */
function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

module.exports = {
  generateTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  blacklistAccessToken,
  isTokenBlacklisted,
};

