/**
 * SKEW YouTube Semantic Memory Search Engine
 * Synthesizes vague, partial, or hazy memory descriptions into high-precision YouTube search queries.
 * Supports English, Hindi, and Hinglish descriptions.
 */

export interface YouTubeSemanticResult {
  originalDescription: string;
  synthesizedQuery: string;
  alternativeQueries: string[];
  targetUrl: string;
  identifiedElements: {
    actors?: string[];
    action?: string[];
    setting?: string[];
    category?: string;
  };
  explanation: string;
  autoOpen: boolean;
}

// Common Hindi/Hinglish to English semantic descriptor dictionaries for YouTube search ranking
const HINDI_SEMANTIC_MAP: Record<string, string> = {
  // Actors
  'ladka': 'guy boy',
  'ladke': 'guys boys',
  'ladki': 'girl woman',
  'ladkiyan': 'girls',
  'baccha': 'kid child',
  'bacche': 'kids children',
  'aadmi': 'man',
  'aurat': 'woman',
  'billi': 'cat',
  'kutta': 'dog',
  'bandar': 'monkey',
  'police': 'police officer',
  'chor': 'thief robber',
  'doctor': 'doctor surgeon',

  // Actions
  'nachta': 'dancing',
  'nachti': 'dancing',
  'dance': 'dance',
  'gaana': 'song singing',
  'gata': 'singing',
  'gati': 'singing',
  'gaati': 'singing',
  'baja': 'playing',
  'bajata': 'playing',
  'bajati': 'playing',
  'guitar': 'guitar',
  'piano': 'piano',
  'dhol': 'drums',
  'ladai': 'fight brawl',
  'maar': 'fight action',
  'gir': 'falling fail',
  'kood': 'jumping jump',
  'bhaag': 'running chase',
  'daud': 'running race',
  'crash': 'crash test collision',
  'thok': 'car accident crash',
  'review': 'review breakdown',
  'unboxing': 'unboxing first look',

  // Settings & Context
  'barish': 'rain rain dance',
  'baarish': 'rain storm',
  'sadak': 'street road',
  'road': 'street outdoor',
  'train': 'train railway',
  'metro': 'metro train subway',
  'station': 'railway station',
  'pahad': 'mountains hill',
  'samundar': 'beach ocean sea',
  'beach': 'beach seaside',
  'dokan': 'shop store',
  'mall': 'mall shopping',
  'school': 'school college classroom',
  'stage': 'live stage concert',
  'show': 'show live performance',

  // Colors & Attributes
  'peela': 'yellow',
  'peeli': 'yellow',
  'yellow': 'yellow',
  'lal': 'red',
  'laal': 'red',
  'neela': 'blue',
  'neeli': 'blue',
  'safed': 'white',
  'kala': 'black',
  'kali': 'black',
  'chota': 'little small',
  'choti': 'small cute',
  'bada': 'giant huge',
  'purana': 'classic vintage retro',
  'naye': 'new latest'
};

/**
 * Check if the input specifically targets YouTube or searching a remembered video
 */
export function isYouTubeOrVideoSearchIntent(text: string): boolean {
  const lower = text.trim().toLowerCase();

  // Explicit YouTube triggers
  if (
    lower.includes('youtube') ||
    lower.includes('youtu.be') ||
    lower.startsWith('yt ') ||
    lower === 'yt'
  ) {
    return true;
  }

  // Vague memory / video search patterns in Hindi/Hinglish or English
  const videoSearchPatterns = [
    /wo\s+video\s+(?:jisme|jismein|kisme|kismein)/i,
    /video\s+(?:jisme|jismein|me|mein|dhundo|search)/i,
    /wo\s+gaana\s+(?:jisme|jismein)/i,
    /gaana\s+(?:jisme|dhundo|batao)/i,
    /(?:that|the)\s+video\s+where/i,
    /video\s+where/i,
    /video\s+about/i,
    /clip\s+(?:where|jisme)/i,
    /find\s+(?:that|the)\s+video/i,
    /search\s+(?:that|the)\s+video/i,
    /search\s+for\s+video/i,
    /play\s+(?:song|video|music)/i,
    /video\s+kya\s+hai\s+yaad/i
  ];

  return videoSearchPatterns.some(pattern => pattern.test(lower));
}

/**
 * Synthesize a vague video memory into an accurate, high-ranking YouTube search query
 */
export function synthesizeYouTubeSemanticSearch(rawText: string): YouTubeSemanticResult {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Detect if user wants to directly open YouTube
  const autoOpen = /open|kholo|chalao|play|search\s*kro|search\s*karo/i.test(lower);

  // 2. Strip conversational instruction wrapper
  let stripped = trimmed
    .replace(/^(?:hey|hello|namaste|hi)?\s*(?:skew|jarvis|assistant)?,?\s*/i, '')
    // Remove "open youtube and search" / "youtube open krky search kro"
    .replace(/(?:youtube\s+open\s*(?:krky|karke|karo|krdo|kardo)?\s*(?:aur|or|and)?\s*(?:search\s*(?:bhi)?\s*(?:krpyga|krpygi|karo|krdo|kardo|bhi)?|dhundo)?)/gi, '')
    .replace(/(?:open\s+youtube\s*(?:and|to)?\s*(?:search|play|find)?)/gi, '')
    .replace(/(?:youtube\s+(?:pe|par|me|mein)\s+(?:search|dhundo|kholo|play)\s*(?:karo|krdo|kardo)?)/gi, '')
    .replace(/(?:search\s+(?:on\s+youtube|for\s+youtube|youtube)?(?:\s+for)?)/gi, '')
    .replace(/(?:youtube\s+search(?:\s+for)?)/gi, '')
    // Remove memory intros: "wo video jisme", "that video where", etc.
    .replace(/(?:wo\s+video\s+(?:jisme|jismein|kisme|kismein)\s*(?:ek|koi)?)/gi, '')
    .replace(/(?:wo\s+gaana\s+(?:jisme|jismein)\s*(?:ek|koi)?)/gi, '')
    .replace(/(?:ek\s+video\s+(?:hai\s+)?jisme)/gi, '')
    .replace(/(?:that\s+video\s+where(?:\s+a|\s+an|\s+the|\s+someone)?)/gi, '')
    .replace(/(?:video\s+where(?:\s+a|\s+an|\s+the)?)/gi, '')
    .replace(/(?:find\s+(?:the|that)\s+video\s+(?:of|where|about)?)/gi, '')
    .replace(/(?:play\s+that\s+video\s+where)/gi, '')
    .replace(/(?:agar\s+user\s+ko\s+sirf\s+video\s+mai\s+kya\s+hai\s+thoda\s+bohot\s+yaad\s+ho\s+fir\s+bhi\s+accurately\s+search\s+krpy)/gi, '')
    .trim();

  // Fallback if stripped became empty (e.g. user just said "open youtube" or "youtube search")
  if (!stripped || stripped.length < 2) {
    return {
      originalDescription: rawText,
      synthesizedQuery: 'trending videos',
      alternativeQueries: ['popular viral videos', 'music trending today'],
      targetUrl: 'https://www.youtube.com',
      identifiedElements: { category: 'General / Trending' },
      explanation: 'Opening YouTube homepage directly, Sir.',
      autoOpen: true
    };
  }

  // 3. Extract Identified Elements & Key Tokens
  const tokens = stripped.split(/\s+/);
  const identifiedActors: string[] = [];
  const identifiedActions: string[] = [];
  const identifiedSettings: string[] = [];
  const englishKeywords: string[] = [];

  // Semantic Concept Translation
  tokens.forEach(tok => {
    const cleanTok = tok.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanTok) return;

    if (HINDI_SEMANTIC_MAP[cleanTok]) {
      const mapped = HINDI_SEMANTIC_MAP[cleanTok];
      // Classify into memory buckets
      if (['ladka', 'ladki', 'baccha', 'aadmi', 'aurat', 'billi', 'kutta'].includes(cleanTok)) {
        identifiedActors.push(mapped);
      } else if (['nachta', 'nachti', 'dance', 'gaana', 'gata', 'baja', 'bajata', 'crash', 'review'].includes(cleanTok)) {
        identifiedActions.push(mapped);
      } else if (['barish', 'sadak', 'road', 'train', 'station', 'beach', 'stage'].includes(cleanTok)) {
        identifiedSettings.push(mapped);
      }
      englishKeywords.push(mapped);
    } else if (!['hai', 'tha', 'thi', 'the', 'ek', 'koi', 'aur', 'or', 'me', 'mein', 'pe', 'par', 'ko', 'se', 'ke', 'liye', 'bhi', 'kya', 'kuch', 'in', 'on', 'at', 'the', 'a', 'an', 'is', 'was', 'with'].includes(cleanTok)) {
      // Keep relevant English or unrecognized specific proper nouns (e.g. 'London', 'Cybertruck', 'iPhone', 'Guitar', 'Arijit')
      englishKeywords.push(tok);
    }
  });

  // 4. Construct Primary High-Accuracy YouTube Search Query
  // Deduplicate and assemble
  const uniqueWords = Array.from(new Set(englishKeywords.join(' ').split(/\s+/)));
  const synthesizedQuery = uniqueWords.slice(0, 7).join(' ').trim() || stripped;

  // 5. Build Alternative Angles (e.g. adding 'viral video', 'performance', 'official clip')
  const alternativeQueries: string[] = [];
  if (identifiedActions.some(a => a.includes('singing') || a.includes('song') || a.includes('dance'))) {
    alternativeQueries.push(`${synthesizedQuery} song music video`);
    alternativeQueries.push(`${synthesizedQuery} full scene performance`);
  } else if (identifiedActions.some(a => a.includes('crash') || a.includes('review'))) {
    alternativeQueries.push(`${synthesizedQuery} crash test comparison`);
    alternativeQueries.push(`${synthesizedQuery} official review footage`);
  } else {
    alternativeQueries.push(`${synthesizedQuery} viral video clip`);
    alternativeQueries.push(`${synthesizedQuery} original footage`);
  }

  // Determine category
  let category = 'Video Retrieval';
  if (identifiedActions.some(a => a.includes('song') || a.includes('singing') || a.includes('guitar') || a.includes('piano'))) {
    category = 'Music / Performance';
  } else if (identifiedActions.some(a => a.includes('crash') || a.includes('accident'))) {
    category = 'Automotive / Crash Test';
  } else if (identifiedActors.some(a => a.includes('cat') || a.includes('dog'))) {
    category = 'Animals / Viral Clips';
  }

  const targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(synthesizedQuery)}`;

  const explanation = `Synthesized high-accuracy YouTube search query from your memory cues: **"${synthesizedQuery}"**. Formatted specifically to match YouTube's indexing algorithm.`;

  return {
    originalDescription: stripped,
    synthesizedQuery,
    alternativeQueries,
    targetUrl,
    identifiedElements: {
      actors: identifiedActors.length > 0 ? Array.from(new Set(identifiedActors)) : undefined,
      action: identifiedActions.length > 0 ? Array.from(new Set(identifiedActions)) : undefined,
      setting: identifiedSettings.length > 0 ? Array.from(new Set(identifiedSettings)) : undefined,
      category
    },
    explanation,
    autoOpen
  };
}
