export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required' };
  }
  
  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }
  
  if (username.length > 20) {
    return { isValid: false, error: 'Username must be less than 20 characters long' };
  }
  
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { isValid: true };
};

export const validatePassword = (password: string): { isValid: boolean; error?: string } => {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, error: 'Password must be less than 128 characters long' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    };
  }
  
  return { isValid: true };
};

export const validateRoomCode = (code: string): boolean => {
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
};

export const validateChatMessage = (message: string): { isValid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > 500) {
    return { isValid: false, error: 'Message must be less than 500 characters' };
  }
  
  return { isValid: true };
};