const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, 0, 1, I to avoid confusion

export function generateSessionCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
  }
  return code;
}
