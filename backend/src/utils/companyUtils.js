/**
 * Utility for intelligent company name normalization and matching.
 * Matches variations like:
 * - "Private" <-> "Pvt" <-> "Pvt." <-> "P."
 * - "Limited" <-> "Ltd" <-> "Ltd."
 * - "Corporation" <-> "Corp"
 * - "Incorporated" <-> "Inc"
 * - "Technologies" <-> "Tech"
 * - "Solutions" <-> "Soln"
 * - "Services" <-> "Svc"
 * - "LLP" / "L.L.P."
 */

export const normalizeCompanyName = (name) => {
  if (!name || typeof name !== "string") return "";

  let norm = name.toLowerCase().trim();

  // Replace & with 'and'
  norm = norm.replace(/&/g, " and ");

  // Strip punctuation
  norm = norm.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"\\]/g, " ");

  // Tokenize words
  const tokens = norm.split(/\s+/).filter(Boolean);

  const normalizedTokens = tokens.map((token) => {
    switch (token) {
      case "private":
      case "pvt":
      case "p":
      case "pv":
        return "pvt";
      case "limited":
      case "ltd":
      case "l":
      case "lt":
        return "ltd";
      case "corporation":
      case "corp":
        return "corp";
      case "incorporated":
      case "inc":
        return "inc";
      case "company":
      case "co":
        return "co";
      case "solutions":
      case "soln":
      case "solns":
      case "solution":
        return "solutions";
      case "technologies":
      case "technology":
      case "tech":
        return "tech";
      case "services":
      case "service":
      case "svc":
      case "srvc":
        return "services";
      case "enterprises":
      case "enterprise":
      case "ent":
        return "enterprises";
      case "international":
      case "intl":
        return "intl";
      case "llp":
        return "llp";
      default:
        return token;
    }
  });

  return normalizedTokens.join(" ");
};

export const areCompanyNamesMatching = (name1, name2) => {
  if (!name1 || !name2) return false;
  const norm1 = normalizeCompanyName(name1);
  const norm2 = normalizeCompanyName(name2);
  if (!norm1 || !norm2) return false;

  // 1. Exact normalized match
  if (norm1 === norm2) return true;

  // 2. Core brand match (strip standard legal/corporate suffixes)
  const stripSuffixes = (str) =>
    str.replace(/\b(pvt|ltd|corp|inc|co|solutions|tech|services|enterprises|intl|llp)\b/g, "").replace(/\s+/g, " ").trim();

  const core1 = stripSuffixes(norm1);
  const core2 = stripSuffixes(norm2);

  if (core1 && core2 && core1.length >= 4 && core2.length >= 4) {
    if (core1 === core2) return true;
  }

  return false;
};
