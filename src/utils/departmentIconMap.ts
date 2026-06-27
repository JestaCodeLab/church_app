/**
 * Mapping of emoji to Lucide icon names
 * Used for converting stored emoji values to Lucide icons
 */
export const EMOJI_TO_ICON_MAP: Record<string, string> = {
  '👥': 'Users',
  '🎵': 'Music',
  '🙏': 'Hands',
  '📖': 'BookOpen',
  '🎤': 'Mic2',
  '👨‍👩‍👧‍👦': 'Users',
  '⛪': 'Church',
  '🌟': 'Star',
  '💒': 'Heart',
  '✝️': 'Cross',
  '🕊️': 'Bird',
  '📚': 'BookMarked',
  '🎁': 'Gift',
  '❤️': 'Heart',
  '🎨': 'Palette',
  '⚽': 'Zap',
  '🏆': 'Award',
  '🎭': 'Sparkles',
  '📱': 'Smartphone',
  '🌍': 'Globe',
  '🧠': 'Lightbulb',
  '💡': 'Lightbulb',
  '🤝': 'Handshake',
  '🎓': 'GraduationCap',
  '🎸': 'Music',
  '🎬': 'Film',
  '🏃': 'Activity',
  '🍽️': 'UtensilsCrossed',
  '🕯️': 'Flame',
  '💪': 'Zap',
  '🌱': 'Leaf',
  '🎪': 'Sparkles',
  '📞': 'Phone',
  '🎯': 'Target',
  '⛺': 'MapPin',
  '🚀': 'Rocket',
  '📻': 'Radio',
  '🎊': 'Sparkles',
  '🛐': 'Cross',
  '👶': 'User',
  '🧒': 'User',
  '👨': 'User',
  '👩': 'User',
  '🌈': 'Sparkles',
  '💖': 'Heart',
  '🎉': 'Sparkles',
};

/**
 * List of icon names available for departments (Lucide icons)
 */
export const DEPARTMENT_ICONS = [
  'Users',
  'Music',
  'Hands',
  'BookOpen',
  'Mic2',
  'Church',
  'Star',
  'Heart',
  'Cross',
  'Bird',
  'BookMarked',
  'Gift',
  'Palette',
  'Zap',
  'Award',
  'Sparkles',
  'Smartphone',
  'Globe',
  'Lightbulb',
  'Handshake',
  'GraduationCap',
  'Film',
  'Activity',
  'UtensilsCrossed',
  'Flame',
  'Leaf',
  'Phone',
  'Target',
  'MapPin',
  'Rocket',
  'Radio',
];

/**
 * Convert emoji to Lucide icon name
 */
export function emojiToIconName(emoji: string): string {
  return EMOJI_TO_ICON_MAP[emoji] || 'Users';
}

/**
 * Get all available icon names
 */
export function getAvailableIconNames(): string[] {
  return DEPARTMENT_ICONS;
}
