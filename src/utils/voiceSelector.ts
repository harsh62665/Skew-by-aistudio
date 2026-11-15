/**
 * SKEW Voice Engine: Voice 1 (JARVIS Male Butler) & Voice 2 (FRIDAY Female Cybernetic)
 */

export type AssistantVoiceId = 'VOICE_1' | 'VOICE_2';

export interface AssistantVoiceMeta {
  id: AssistantVoiceId;
  name: string;
  tagline: string;
  gender: 'male' | 'female';
  defaultRate: number;
  defaultPitch: number;
  testPhrase: string;
  keywords: string[];
}

export const ASSISTANT_VOICES: Record<AssistantVoiceId, AssistantVoiceMeta> = {
  VOICE_1: {
    id: 'VOICE_1',
    name: 'Voice 1 (JARVIS)',
    tagline: 'British Tactical Butler (Male)',
    gender: 'male',
    defaultRate: 1.0,
    defaultPitch: 0.95,
    testPhrase: 'All systems online, Sir. JARVIS Voice 1 calibrated and standing by.',
    keywords: [
      'daniel', 'george', 'oliver', 'arthur', 'brian', 'en-gb', 'en_gb', 
      'uk english male', 'great britain', 'google uk english male', 'male'
    ]
  },
  VOICE_2: {
    id: 'VOICE_2',
    name: 'Voice 2 (FRIDAY)',
    tagline: 'Cybernetic Assistant (Female)',
    gender: 'female',
    defaultRate: 1.05,
    defaultPitch: 1.15,
    testPhrase: 'Neural telemetry synchronized. FRIDAY Voice 2 ready for commands.',
    keywords: [
      'samantha', 'victoria', 'karen', 'zira', 'serena', 'ava', 'allison', 
      'female', 'en-us', 'google us english', 'us english female', 'natural'
    ]
  }
};

const STORAGE_KEY = 'skew_selected_voice';

/**
 * Get active voice ID from localStorage (default: VOICE_1)
 */
export function getSelectedVoiceId(): AssistantVoiceId {
  if (typeof window === 'undefined') return 'VOICE_1';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'VOICE_1' || saved === 'VOICE_2') {
      return saved;
    }
  } catch (e) {
    // ignore
  }
  return 'VOICE_1';
}

/**
 * Persist active voice ID to localStorage and broadcast change event
 */
export function setSelectedVoiceId(id: AssistantVoiceId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
    window.dispatchEvent(new CustomEvent('skew:voice-changed', { detail: { voiceId: id } }));
  } catch (e) {
    console.error('Failed to save selected voice ID', e);
  }
}

/**
 * Locate best matching browser SpeechSynthesisVoice for a given voice configuration
 */
export function findSystemVoice(voiceId: AssistantVoiceId): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const config = ASSISTANT_VOICES[voiceId];
  const lowerKeywords = config.keywords.map(k => k.toLowerCase());

  // 1. First priority: matches specific keyword AND language starts with 'en'
  for (const kw of lowerKeywords) {
    const match = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.toLowerCase().includes(kw) || v.voiceURI.toLowerCase().includes(kw))
    );
    if (match) return match;
  }

  // 2. Second priority: matches specific keyword in any lang
  for (const kw of lowerKeywords) {
    const match = voices.find(v => 
      v.name.toLowerCase().includes(kw) || v.voiceURI.toLowerCase().includes(kw)
    );
    if (match) return match;
  }

  // 3. Fallback based on voice gender characteristics
  if (config.gender === 'female') {
    const femaleVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira'))
    );
    if (femaleVoice) return femaleVoice;
  } else {
    const maleVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george'))
    );
    if (maleVoice) return maleVoice;
  }

  // 4. Fallback to any English voice
  const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  return anyEnglish || voices[0] || null;
}

/**
 * Play a test voice sample for the given voice ID
 */
export function testVoice(voiceId: AssistantVoiceId): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();
    const config = ASSISTANT_VOICES[voiceId];
    const utterance = new SpeechSynthesisUtterance(config.testPhrase);
    utterance.rate = config.defaultRate;
    utterance.pitch = config.defaultPitch;

    const matchedVoice = findSystemVoice(voiceId);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Voice preview error:', err);
  }
}
