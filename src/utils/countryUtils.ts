export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const detectUserCountry = (): string => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split(/[-_]/);
    if (parts.length > 1) {
      return parts[1].toUpperCase();
    }
  } catch {
  }
  return 'FR';
};

export const getRandomCountry = (): string => {
  const countries = ['FR', 'US', 'GB', 'DE', 'JP', 'BR', 'CA', 'ES', 'IT', 'KR'];
  return countries[Math.floor(Math.random() * countries.length)];
};
