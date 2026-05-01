// Emoji mappings for wedding budget categories (by category name or keyword matching)
const EMOJI_MAP: Record<string, string> = {
  "Venue & Rentals": "🏛️",
  "Catering & Cake": "🍽️",
  "Photography & Video": "📸",
  "Flowers & Decor": "🌸",
  "Music & Entertainment": "🎵",
  "Beauty & Attire": "💄",
  "Honeymoon": "✈️",
  "Planning": "📋",
  "Guests": "👥",
  "Venue": "🏛️",
  "Catering": "🍽️",
  "Photography": "📸",
  "Videography": "🎬",
  "Flowers": "🌸",
  "Decor": "🎨",
  "Music": "🎵",
  "Entertainment": "🎭",
  "Attire": "👗",
  "Dress": "👗",
  "Cake": "🎂",
  "DJ": "🎚️",
};

export function getCategoryEmoji(categoryName: string): string {
  // Exact match first
  if (EMOJI_MAP[categoryName]) {
    return EMOJI_MAP[categoryName];
  }

  // Substring match on category name
  const lower = categoryName.toLowerCase();
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return emoji;
    }
  }

  // Default
  return "💰";
}
