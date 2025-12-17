// Fix common capitalization issues from API data
export const fixName = (name: string): string => {
  if (!name) return name;
  return name
    .replace(/\bKsw\b/g, 'KSW')
    .replace(/\bRizin\b/g, 'RIZIN')
    .replace(/\bOne\b/g, 'ONE')
    .replace(/\bUfc\b/g, 'UFC')
    .replace(/\bMma\b/g, 'MMA')
    .replace(/\bVs\b/g, 'vs')
    .replace(/\bAj\b/g, 'AJ')
    .replace(/\bTko\b/g, 'TKO')
    .replace(/\bKo\b/g, 'KO')
    .replace(/\bPfl\b/g, 'PFL')
    .replace(/\bTdfc\b/g, 'TDFC')
    .replace(/\bHfc\b/g, 'HFC')
    .replace(/\bFc\b/g, 'FC');
};

// Country code to flag emoji mapping
export const getCountryFlag = (country?: string): string => {
  if (!country) return '';
  const flags: Record<string, string> = {
    'Russia': '🇷🇺',
    'Poland': '🇵🇱',
    'Japan': '🇯🇵',
    'Singapore': '🇸🇬',
    'USA': '🇺🇸',
    'China': '🇨🇳',
    'Brazil': '🇧🇷',
    'UK': '🇬🇧',
    'South Africa': '🇿🇦',
  };
  return flags[country] || '';
};

// Region definitions
export type Region = 'all' | 'russian' | 'eastern_europe' | 'asia';

export const regionLabels: Record<Region, string> = {
  all: 'All',
  russian: 'Russian Underground',
  eastern_europe: 'Eastern Europe',
  asia: 'Asia',
};

export const getPromotionRegion = (promotionId: string): Region => {
  const russianPromos = ['hardcore_fc', 'top_dog_fc', 'punch_club'];
  const easternEuropePromos = ['ksw'];
  const asiaPromos = ['rizin', 'one'];
  
  if (russianPromos.includes(promotionId)) return 'russian';
  if (easternEuropePromos.includes(promotionId)) return 'eastern_europe';
  if (asiaPromos.includes(promotionId)) return 'asia';
  return 'all';
};
