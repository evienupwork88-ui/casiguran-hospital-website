const prohibitedTerms = [
  "gago",
  "gagi",
  "tangina",
  "putangina",
  "bobo",
  "inutil",
  "pakyu",
  "fuck",
  "shit",
  "bwisit",
] as const;

export function containsProfanity(value: string): boolean {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("en");
  return prohibitedTerms.some((term) => {
    const letters = [...term.replace(/\s+/g, "")].map((letter) => letter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const separatedLetters = letters.join("[^\\p{L}\\p{N}]*");
    return new RegExp(`(^|[^\\p{L}\\p{N}])${separatedLetters}($|[^\\p{L}\\p{N}])`, "u").test(normalized);
  });
}
