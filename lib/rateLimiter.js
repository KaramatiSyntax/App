// Rate limiter for payment verification
const rateLimitMap = new Map();

export const rateLimiter = {
  // Check if user is rate limited
  isRateLimited: (userEmail, action = 'payment', maxAttempts = 3, windowMs = 60000) => {
    const key = `${userEmail}:${action}`;
    const now = Date.now();
    
    if (!rateLimitMap.has(key)) {
      rateLimitMap.set(key, { attempts: 0, resetTime: now + windowMs });
    }
    
    const userLimit = rateLimitMap.get(key);
    
    // Reset if window has passed
    if (now > userLimit.resetTime) {
      userLimit.attempts = 0;
      userLimit.resetTime = now + windowMs;
    }
    
    // Check if rate limited
    if (userLimit.attempts >= maxAttempts) {
      return {
        limited: true,
        remainingTime: userLimit.resetTime - now,
        attempts: userLimit.attempts
      };
    }
    
    // Increment attempts
    userLimit.attempts++;
    
    return {
      limited: false,
      remainingAttempts: maxAttempts - userLimit.attempts,
      attempts: userLimit.attempts
    };
  },
  
  // Reset rate limit for user
  resetRateLimit: (userEmail, action = 'payment') => {
    const key = `${userEmail}:${action}`;
    rateLimitMap.delete(key);
  },
  
  // Get rate limit info
  getRateLimitInfo: (userEmail, action = 'payment') => {
    const key = `${userEmail}:${action}`;
    const userLimit = rateLimitMap.get(key);
    
    if (!userLimit) {
      return { attempts: 0, remainingAttempts: 5, resetTime: null };
    }
    
    const now = Date.now();
    if (now > userLimit.resetTime) {
      return { attempts: 0, remainingAttempts: 5, resetTime: null };
    }
    
    return {
      attempts: userLimit.attempts,
      remainingAttempts: Math.max(0, 5 - userLimit.attempts),
      resetTime: userLimit.resetTime
    };
  }
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute 