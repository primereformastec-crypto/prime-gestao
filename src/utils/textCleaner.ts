/**
 * Utility to fix mojibake (double-encoded UTF-8 / Latin-1 artifacts)
 * Common in Meta Ads exports and legacy CSV files (e.g., 'MuÃ±oz' -> 'Muñoz', 'CampaÃ±a' -> 'Campaña')
 */
export function fixMojibake(text: string | null | undefined): string {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);

  let cleaned = text;

  // Direct map of common misencoded sequences
  const replacements: [string, string][] = [
    ['MuÃ±oz', 'Muñoz'],
    ['Ã±', 'ñ'],
    ['Ã‘', 'Ñ'],
    ['Ã¡', 'á'],
    ['Ã©', 'é'],
    ['Ã­', 'í'],
    ['Ã³', 'ó'],
    ['Ãº', 'ú'],
    ['Ã', 'Á'],
    ['Ã‰', 'É'],
    ['Ã', 'Í'],
    ['Ã“', 'Ó'],
    ['Ãš', 'Ú'],
    ['Ã£', 'ã'],
    ['Ãµ', 'õ'],
    ['ÃƒÂ£', 'ã'],
    ['Ã¢', 'â'],
    ['Ãª', 'ê'],
    ['Ã´', 'ô'],
    ['Ã§', 'ç'],
    ['Ã‡', 'Ç'],
    ['Ã¼', 'ü'],
    ['Ãœ', 'Ü'],
    ['â€“', '–'],
    ['â€”', '—'],
    ['â€™', "'"],
    ['â€œ', '"'],
    ['â€', '"'],
    ['Âº', 'º'],
    ['Âª', 'ª'],
    ['Â', '']
  ];

  for (const [from, to] of replacements) {
    if (cleaned.includes(from)) {
      cleaned = cleaned.split(from).join(to);
    }
  }

  return cleaned;
}
