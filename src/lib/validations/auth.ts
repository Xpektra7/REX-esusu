// Password and PIN strength rules (plan 006 — D12 password blacklist, D20 PIN rules).

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password12",
  "password123",
  "passw0rd",
  "12345678",
  "123456789",
  "qwerty",
  "qwerty123",
  "letmein",
  "iloveyou",
  "admin",
  "welcome",
  "abcdefgh",
  "chusus",
  "esusu123",
  "esusu2024",
  "esusu",
]);

/** Returns an error string if the password is weak, otherwise null. */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return "Use both uppercase and lowercase letters";
  }
  if (!/\d/.test(password)) {
    return "Include at least one number";
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Choose a password that isn't commonly used";
  }
  return null;
}

function isSequential(pin: string): boolean {
  for (let i = 1; i < pin.length; i++) {
    const diff = Number(pin[i]) - Number(pin[i - 1]);
    if (Number.isNaN(diff)) return false;
    if (diff !== 1 && diff !== -1) return false;
  }
  return true;
}

function isRepeated(pin: string): boolean {
  return /^(\d)\1+$/.test(pin);
}

/** Returns an error string if the 4-digit PIN is weak, otherwise null. */
export function validatePin(pin: string): string | null {
  if (!/^\d{4}$/.test(pin)) {
    return "PIN must be exactly 4 digits";
  }
  if (pin === "0000" || pin === "1234") {
    return "Choose a PIN that isn't easy to guess";
  }
  if (isRepeated(pin) || isSequential(pin)) {
    return "Avoid repeated or sequential digits";
  }
  return null;
}
