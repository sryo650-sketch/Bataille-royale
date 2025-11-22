import { UI_CONSTANTS } from '../constants';

const placeholderAvatar = require('../assets/placeholder.png');

export const isValidAvatarUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const allowedDomains: readonly string[] = UI_CONSTANTS.ALLOWED_AVATAR_DOMAINS;
    return parsed.protocol === 'https:' && allowedDomains.includes(parsed.hostname);
  } catch {
    return false;
  }
};

// ✅ Fonction pure en dehors du composant - stable par nature
export const getAvatarSource = (avatar?: string) =>
  isValidAvatarUrl(avatar) ? { uri: avatar } : placeholderAvatar;
