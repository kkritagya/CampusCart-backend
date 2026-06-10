export interface RegisterUserDto {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterDto = (body: Partial<RegisterUserDto>): string | null => {
  if (!body.fullName || body.fullName.trim().length < 2) {
    return "Full name must be at least 2 characters";
  }

  if (!body.email || !emailRegex.test(body.email.trim())) {
    return "A valid email is required";
  }

  if (!body.password || body.password.length < 6) {
    return "Password must be at least 6 characters";
  }

  return null;
};

export const validateLoginDto = (body: Partial<LoginUserDto>): string | null => {
  if (!body.email || !emailRegex.test(body.email.trim())) {
    return "A valid email is required";
  }

  if (!body.password) {
    return "Password is required";
  }

  return null;
};
