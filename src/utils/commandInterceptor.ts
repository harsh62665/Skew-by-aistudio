import { 
  getSelectedVoiceId, 
  findSystemVoice, 
  ASSISTANT_VOICES, 
  AssistantVoiceId 
} from './voiceSelector';
import { 
  isYouTubeOrVideoSearchIntent, 
  synthesizeYouTubeSemanticSearch, 
  YouTubeSemanticResult 
} from './youtubeSemanticSearch';

export interface QuickActionPayload {
  type: 'URL_OPEN' | 'SEARCH' | 'NAVIGATE' | 'VIEW_SWITCH' | 'NONE';
  label: string;
  targetUrl?: string;
  viewTarget?: string;
  actionPayloadQuery?: string;
  cleanResponseText: string;
  isQuickAction: boolean;
  calculationResult?: {
    expression: string;
    result: string | number;
    category?: 'MATH' | 'UNIT_CONVERT' | 'CURRENCY' | 'TIME';
    steps?: string[];
  };
  scratchpadNoteSaved?: {
    title: string;
    content: string;
    category: string;
    timestamp: string;
  };
  youtubeSemanticSearch?: {
    originalDescription: string;
    synthesizedQuery: string;
    likelyVideoTitle?: string;
    searchUrl: string;
    alternativeQueries: string[];
    identifiedElements?: {
      actors?: string[];
      action?: string[];
      setting?: string[];
      category?: string;
    };
    explanation: string;
  };
}

/**
 * Safe client-side math & unit converter engine (100% native, zero external dependencies)
 */
export function evaluateMathOrUnit(userText: string): { expression: string; result: string | number; category: 'MATH' | 'UNIT_CONVERT'; steps: string[] } | null {
  const trimmed = userText.trim();
  const lower = trimmed.toLowerCase();

  // 1. Unit Conversions (km <-> miles, c <-> f, kg <-> lbs, m <-> feet)
  const kmToMilesMatch = lower.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(?:km|kilometers?)\s+(?:to|in)\s*(?:miles?|mi)/i);
  if (kmToMilesMatch) {
    const val = parseFloat(kmToMilesMatch[1]);
    const res = (val * 0.621371).toFixed(2);
    return {
      expression: `${val} km to miles`,
      result: `${res} miles`,
      category: 'UNIT_CONVERT',
      steps: [`Input: ${val} km`, `Formula: km * 0.621371`, `Result: ${res} miles`]
    };
  }

  const milesToKmMatch = lower.match(/(?:convert\s+)?(\d+(?:\.\d+)?)\s*(?:miles?|mi)\s+(?:to|in)\s*(?:km|kilometers?)/i);
  if (milesToKmMatch) {
    const val = parseFloat(milesToKmMatch[1]);
    const res = (val * 1.60934).toFixed(2);
    return {
      expression: `${val} miles to km`,
      result: `${res} km`,
      category: 'UNIT_CONVERT',
      steps: [`Input: ${val} miles`, `Formula: miles * 1.60934`, `Result: ${res} km`]
    };
  }

  const cToFMatch = lower.match(/(?:convert\s+)?(-?\d+(?:\.\d+)?)\s*(?:c|celsius)\s+(?:to|in)\s*(?:f|fahrenheit)/i);
  if (cToFMatch) {
    const val = parseFloat(cToFMatch[1]);
    const res = ((val * 9/5) + 32).toFixed(1);
    return {
      expression: `${val}°C to Fahrenheit`,
      result: `${res}°F`,
      category: 'UNIT_CONVERT',
      steps: [`Input: ${val}°C`, `Formula: (C * 9/5) + 32`, `Result: ${res}°F`]
    };
  }

  // 2. Percentage evaluation: "what is 15% of 850" or "20% of 500"
  const percentMatch = lower.match(/(?:what\s+is\s+)?(\d+(?:\.\d+)?)\s*%\s+of\s+(\d+(?:\.\d+)?)/i);
  if (percentMatch) {
    const pct = parseFloat(percentMatch[1]);
    const base = parseFloat(percentMatch[2]);
    const res = ((pct / 100) * base).toFixed(2).replace(/\.00$/, '');
    return {
      expression: `${pct}% of ${base}`,
      result: res,
      category: 'MATH',
      steps: [`Formula: (${pct} / 100) * ${base}`, `Result: ${res}`]
    };
  }

  // 3. Direct Math: "calculate 450 * 12", "what is 24 * 365", "eval 1200 / 15", "sqrt(144) + 10"
  let mathCandidate = '';
  if (lower.startsWith('calculate ') || lower.startsWith('calc ') || lower.startsWith('what is ') || lower.startsWith('solve ')) {
    mathCandidate = trimmed
      .replace(/^(?:calculate|calc|what\s+is|solve)\s+/i, '')
      .replace(/[?!=]+$/g, '')
      .trim();
  } else if (/^[\d\s+\-*/%^().sqrtabs]+$/.test(trimmed) && /[\d]/.test(trimmed) && /[+\-*/%^]/.test(trimmed)) {
    mathCandidate = trimmed;
  }

  if (mathCandidate && mathCandidate.length >= 3 && mathCandidate.length <= 60) {
    // Whitelist only safe math tokens
    if (/^[0-9+\-*/%^().\sMathsqrtcospintanabs]+$/.test(mathCandidate)) {
      try {
        let sanitized = mathCandidate
          .replace(/sqrt/g, 'Math.sqrt')
          .replace(/abs/g, 'Math.abs')
          .replace(/sin/g, 'Math.sin')
          .replace(/cos/g, 'Math.cos')
          .replace(/\^/g, '**');

        // Evaluate using safe Function constructor restricted to Math
        const evalFn = new Function('Math', `return (${sanitized});`);
        const val = evalFn(Math);
        if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
          const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
          return {
            expression: mathCandidate,
            result: formatted,
            category: 'MATH',
            steps: [`Evaluated: ${mathCandidate}`, `Result: ${formatted}`]
          };
        }
      } catch {
        // Not a pure math expression
      }
    }
  }

  return null;
}

/**
 * Extract clean search target query from explicit Google search requests
 */
export function extractSearchQuery(userText: string): string | null {
  const trimmed = userText.trim();
  const lower = trimmed.toLowerCase();

  // ONLY intercept if user explicitly asks for Google external search
  if (
    lower === 'google search' || 
    lower === 'open google search' || 
    lower === 'search on google' ||
    lower === 'google pe search karo'
  ) {
    return '';
  }

  const explicitGoogleRegexes = [
    /^(?:google\s+(?:pe|par|me|mein)\s+(?:search|dhundo|khojo)\s*(?:karo|krdo|kardo)?)\s+(.+)$/i,
    /^(?:search\s+on\s+google(?:\s+for)?)\s+(.+)$/i,
    /^(?:google\s+search(?:\s+for)?)\s+(.+)$/i,
    /^(.+?)\s+(?:google\s+pe\s+search\s*karo|on\s+google\s+search)$/i
  ];

  for (const rx of explicitGoogleRegexes) {
    const match = trimmed.match(rx);
    if (match && match[1]) {
      let query = match[1].trim();
      query = query.replace(/^["'“”]|["'“”]$/g, '').trim();
      if (query.length > 0) return query;
    }
  }

  return null;
}

/**
 * Smart Client-Side Command Interceptor
 * Identifies intent for commands like "Open youtube", "Open google", "Search [topic]", "Open github", etc.
 */
export function interceptCommand(userText: string): QuickActionPayload | null {
  const trimmed = userText.trim();
  const lower = trimmed.toLowerCase();

  // 0A. Math & Unit calculation intercept (100% native, instant)
  const mathResult = evaluateMathOrUnit(userText);
  if (mathResult) {
    return {
      type: 'NONE',
      label: mathResult.category === 'MATH' ? `Calculate: ${mathResult.expression}` : `Convert: ${mathResult.expression}`,
      cleanResponseText: `Calculated result: **${mathResult.result}** (${mathResult.expression})`,
      isQuickAction: true,
      calculationResult: mathResult
    };
  }

  // 0B. Open Scratchpad / Notes command
  if (
    lower === 'open scratchpad' ||
    lower === 'open notes' ||
    lower === 'show notes' ||
    lower === 'my notes' ||
    lower === 'view scratchpad' ||
    lower === 'scratchpad'
  ) {
    return {
      type: 'VIEW_SWITCH',
      viewTarget: 'SCRATCHPAD',
      label: 'Open Working Scratchpad & Notes',
      cleanResponseText: 'Opening your native Working Scratchpad & Notes Hub, Sir. All your entries are stored locally with zero external dependencies.',
      isQuickAction: true
    };
  }

  // 0C. Save Note command: "save note: ...", "note: ...", "remember: ...", "add note: ..."
  if (
    lower.startsWith('save note:') ||
    lower.startsWith('save note ') ||
    lower.startsWith('add note:') ||
    lower.startsWith('add note ') ||
    lower.startsWith('note:') ||
    lower.startsWith('remember:') ||
    lower.startsWith('remember that:')
  ) {
    const rawContent = trimmed
      .replace(/^(?:save\s+note:?|add\s+note:?|note:|remember\s+that:|remember:)\s*/i, '')
      .trim();

    if (rawContent.length > 0) {
      const firstLineBreak = rawContent.indexOf('\n');
      let noteTitle = rawContent.slice(0, 40);
      let noteBody = rawContent;
      if (firstLineBreak > 0) {
        noteTitle = rawContent.slice(0, firstLineBreak).trim();
        noteBody = rawContent.slice(firstLineBreak + 1).trim();
      }

      // Persist directly to localStorage
      try {
        if (typeof window !== 'undefined') {
          const STORAGE_KEY = 'skew_agi_scratchpad_notes';
          const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
          const newNote = {
            id: `NOTE-${Date.now()}`,
            title: noteTitle,
            content: noteBody,
            category: 'General',
            isPinned: false,
            createdAt: new Date().toLocaleDateString(),
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify([newNote, ...existing]));
        }
      } catch (e) {
        console.warn('Scratchpad save error:', e);
      }

      return {
        type: 'VIEW_SWITCH',
        viewTarget: 'SCRATCHPAD',
        label: `View Saved Note: "${noteTitle.slice(0, 20)}..."`,
        cleanResponseText: `Note saved directly to your native scratchpad: "${noteTitle}". You can access and edit it anytime without any external apps, Sir.`,
        isQuickAction: true,
        scratchpadNoteSaved: {
          title: noteTitle,
          content: noteBody,
          category: 'General',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      };
    }
  }

  // 1. YouTube & Vague Video Memory Semantic Search
  if (isYouTubeOrVideoSearchIntent(userText)) {
    const ytSemantic = synthesizeYouTubeSemanticSearch(userText);
    const isHindi = /karo|krdo|kardo|kar|hai|bhai|dhundo|khojo|jisme|gaana|ladka|ladki|barish|chalao|kholo|yaad/i.test(userText);

    let cleanResponse = '';
    if (ytSemantic.synthesizedQuery && ytSemantic.synthesizedQuery !== 'trending videos') {
      cleanResponse = isHindi
        ? `Aapki video memory ke aadhar par YouTube search query decode ki gayi hai: "${ytSemantic.synthesizedQuery}". YouTube search open kar diya gaya hai, Sir.`
        : `Decoded your video memory and synthesized search query: "${ytSemantic.synthesizedQuery}". Opening YouTube search for you, sir.`;
    } else {
      cleanResponse = isHindi
        ? `YouTube open kar diya hai, Sir.`
        : `Opening YouTube for you, sir.`;
    }

    return {
      type: 'SEARCH',
      label: ytSemantic.synthesizedQuery && ytSemantic.synthesizedQuery !== 'trending videos'
        ? `YouTube: "${ytSemantic.synthesizedQuery.slice(0, 24)}${ytSemantic.synthesizedQuery.length > 24 ? '...' : ''}"`
        : 'Open YouTube',
      targetUrl: ytSemantic.targetUrl,
      cleanResponseText: cleanResponse,
      isQuickAction: true,
      youtubeSemanticSearch: {
        originalDescription: ytSemantic.originalDescription,
        synthesizedQuery: ytSemantic.synthesizedQuery,
        likelyVideoTitle: ytSemantic.synthesizedQuery,
        searchUrl: ytSemantic.targetUrl,
        alternativeQueries: ytSemantic.alternativeQueries,
        identifiedElements: ytSemantic.identifiedElements,
        explanation: ytSemantic.explanation
      }
    };
  }

  // 2. Comprehensive Google Search (English + Hindi/Hinglish: "search karo xyz", "xyz search karo", "google pe search karo xyz", "find xyz")
  const extractedQuery = extractSearchQuery(userText);
  if (extractedQuery !== null) {
    const query = extractedQuery.trim();
    const target = query ? `https://www.google.com/search?q=${encodeURIComponent(query)}` : 'https://www.google.com';
    const isHindi = /karo|krdo|kardo|kar|hai|bhai|dhundo|khojo/i.test(userText);

    let cleanResponse = '';
    if (query) {
      cleanResponse = isHindi 
        ? `"${query}" ke liye Google Search initiate kar diya hai, Sir. Search link ready hai.`
        : `Searching Google for "${query}", sir. Direct search link is ready.`;
    } else {
      cleanResponse = isHindi
        ? `Google Search open kar diya hai, Sir.`
        : `Opening Google Search for you, sir.`;
    }

    return {
      type: 'SEARCH',
      label: query ? `Search Google: "${query.slice(0, 24)}${query.length > 24 ? '...' : ''}"` : 'Open Google Search',
      targetUrl: target,
      cleanResponseText: cleanResponse,
      isQuickAction: true
    };
  }

  // 3. Open Google
  if (lower === 'open google' || lower === 'google' || lower.includes('open google') || lower.includes('google.com')) {
    return {
      type: 'URL_OPEN',
      label: 'Open Google Now',
      targetUrl: 'https://www.google.com',
      cleanResponseText: 'Opening Google for you, sir.',
      isQuickAction: true
    };
  }

  // 4. Open GitHub
  if (lower === 'open github' || lower === 'github' || lower.includes('open github') || lower.includes('github.com')) {
    return {
      type: 'URL_OPEN',
      label: 'Open GitHub Now',
      targetUrl: 'https://github.com',
      cleanResponseText: 'Opening GitHub for you, sir.',
      isQuickAction: true
    };
  }

  // 5. Open Gmail
  if (lower === 'open gmail' || lower === 'gmail' || lower.includes('open gmail') || lower.includes('mail.google.com')) {
    return {
      type: 'URL_OPEN',
      label: 'Open Gmail Now',
      targetUrl: 'https://mail.google.com',
      cleanResponseText: 'Opening Gmail inbox for you, sir.',
      isQuickAction: true
    };
  }

  // 5B. Real Browser & Movie Download Intent
  if (
    lower.includes('download movie') ||
    lower.includes('movie download') ||
    lower.includes('movies download') ||
    lower.includes('search movie') ||
    lower.includes('open browser') ||
    lower.includes('real browser') ||
    lower.includes('cloud browser') ||
    lower.startsWith('browse ')
  ) {
    const cleanedQuery = trimmed
      .replace(/^(?:open\s+real\s+browser|open\s+cloud\s+browser|open\s+browser|browse|search\s+movies?|download\s+movies?|movies?\s+download\s*(?:karo|krdo|kardo)?)\s*/i, '')
      .trim();
    const isHindi = /karo|krdo|kardo|bhai|movie|dekho|kholo/i.test(userText);

    return {
      type: 'VIEW_SWITCH',
      viewTarget: 'BROWSER',
      actionPayloadQuery: cleanedQuery || undefined,
      label: cleanedQuery ? `Browser / Movies: "${cleanedQuery.slice(0, 22)}"` : 'Open Cloud Browser & Movies',
      cleanResponseText: isHindi
        ? `Cloud Browser aur Movie Downloader open kar diya hai, Sir${cleanedQuery ? ` ("${cleanedQuery}")` : ''}. Aap yahan se direct MP4 movies stream aur download kar sakte hain.`
        : `Opening SKEW Cloud Browser & Movie Downloader${cleanedQuery ? ` for "${cleanedQuery}"` : ''}.`,
      isQuickAction: true
    };
  }

  // 5C. Voice Call, WebRTC Call & Mobile Dialer Intent
  if (
    lower.includes('voice call') ||
    lower.includes('make a call') ||
    lower.includes('call pr baat') ||
    lower.includes('call par baat') ||
    lower.includes('phone lagao') ||
    lower.includes('call lagao') ||
    lower.startsWith('call ') ||
    lower.startsWith('dial ') ||
    lower === 'open dialer' ||
    lower === 'open call'
  ) {
    const target = trimmed.replace(/^(?:call|dial|make\s+a\s+call\s+to|open)\s*/i, '').trim();
    const isHindi = /karo|krdo|baat|lagao|bhai/i.test(userText);
    return {
      type: 'VIEW_SWITCH',
      viewTarget: 'VOICE_CALL',
      actionPayloadQuery: target || undefined,
      label: 'Open Voice Call & Dialer',
      cleanResponseText: isHindi
        ? 'Voice Call aur Live Dialer Studio open kar diya hai, Sir. Aap AI call, 2-person WebRTC call, ya mobile dialer use kar sakte hain.'
        : 'Opening Voice Call & Live Comms Studio. You can start an AI call, join a 2-person WebRTC call, or dial a phone number.',
      isQuickAction: true
    };
  }

  // 5D. Android APK & App Install Intent
  if (
    lower.includes('make apk') ||
    lower.includes('build apk') ||
    lower.includes('apk banao') ||
    lower.includes('apk bnado') ||
    lower.includes('download apk') ||
    lower.includes('export apk') ||
    lower === 'apk'
  ) {
    const isHindi = /banao|bnado|karo|krdo/i.test(userText);
    return {
      type: 'VIEW_SWITCH',
      viewTarget: 'APK_STUDIO',
      label: 'Open Android APK Studio',
      cleanResponseText: isHindi
        ? 'Android APK & Install Studio open kar diya hai, Sir. Aap phone par 1-tap install kar sakte hain ya full Android Capacitor APK project zip download kar sakte hain.'
        : 'Opening Android APK & Install Studio. You can install the standalone app directly or download the ready-to-build Capacitor APK project zip.',
      isQuickAction: true
    };
  }

  // 6. Generic website detection (e.g., "open twitter.com", "open reddit")
  if (lower.startsWith('open ') && lower.split(' ').length <= 4) {
    const domainPart = trimmed.replace(/^open\s+/i, '').trim();
    let url = domainPart;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.')) {
        url = `https://${url}`;
      } else {
        url = `https://www.google.com/search?q=${encodeURIComponent(domainPart)}`;
      }
    }

    return {
      type: 'URL_OPEN',
      label: `Open ${domainPart.slice(0, 20)}`,
      targetUrl: url,
      cleanResponseText: `Opening ${domainPart} for you, sir.`,
      isQuickAction: true
    };
  }

  // 7. Mobile Touch Actuator, Screen PIN Unlock & Gaming Bot Intercept
  if (
    lower.includes('unlock phone') ||
    lower.includes('phone unlock') ||
    lower.includes('mobile unlock') ||
    lower.includes('unlock mobile') ||
    lower.includes('touch actuator') ||
    lower.includes('android touch') ||
    lower.includes('gaming bot') ||
    lower.includes('game macro') ||
    lower.includes('game tap') ||
    lower.includes('auto tap') ||
    lower.includes('play game') ||
    lower.includes('khelo game') ||
    lower.includes('game khelo') ||
    lower.includes('password unlock') ||
    lower.includes('lock kholo') ||
    lower.includes('lock open')
  ) {
    const isGaming = lower.includes('game') || lower.includes('tap');
    const isHindi = /karo|kholo|krdo|kardo|khelo|chalao/i.test(userText);

    let cleanResponse = '';
    if (isGaming) {
      cleanResponse = isHindi
        ? 'Mobile Gaming Touch & Auto-Tap macro engine open kar diya hai, Sir. Gaussian jitter active hai.'
        : 'Launching Mobile Gaming Touch & Rapid Auto-Tap engine with anti-cheat Gaussian variance, sir.';
    } else {
      cleanResponse = isHindi
        ? 'Android Spatial Touch & PIN Unlock stage activate kar diya hai, Sir. Human touch protocol ready hai.'
        : 'Launching Android Touch & PIN Unlock Actuator. Human-touch Bezier swipe and keypad PIN ready, sir.';
    }

    return {
      type: 'VIEW_SWITCH',
      viewTarget: 'ANDROID_TOUCH',
      label: isGaming ? 'Launch Mobile Gaming Bot' : 'Open Android Touch & Unlock',
      cleanResponseText: cleanResponse,
      isQuickAction: true
    };
  }

  // 8. Screen Vision & Telemetry HUD Intercept ("screen pe kya hai", "what's on screen", "screen inspect")
  if (
    lower.includes('screen pe kya') ||
    lower.includes('screen par kya') ||
    lower.includes('what is on screen') ||
    lower.includes("what's on screen") ||
    lower.includes('inspect screen') ||
    lower.includes('screen inspect') ||
    lower.includes('dekho screen')
  ) {
    const isHindi = /kya|hai|dekho|karo/i.test(userText);
    const cleanResponse = isHindi
      ? 'Live Screen Vision inspection HUD activate kar diya hai, Sir. Foreground elements detect ho rahe hain.'
      : 'Activating live screen telemetry HUD and spatial perception context, sir.';

    return {
      type: 'VIEW_SWITCH',
      viewTarget: 'SKEW_ENGINE',
      label: 'Open Screen Vision & HUD Inspector',
      cleanResponseText: cleanResponse,
      isQuickAction: true
    };
  }

  return null;
}

/**
 * Execute client-side open action with popup blocker fallback handling
 */
export function executeOpenUrl(url: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (opened) {
      return true;
    }
    // Fallback if popup blocker intercepted window.open
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
    }, 100);
    return true;
  } catch (err) {
    console.warn('Direct popup window.open blocked by browser/iframe security:', err);
    return false;
  }
}

/**
 * Speak short voice text aloud cleanly using window.speechSynthesis
 */
export function speakTextAloud(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // cancel any stale speech

    const cleanText = text
      .replace(/[*_#`~\[\]]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    if (!cleanText) return;

    const voiceId = getSelectedVoiceId();
    const voiceConfig = ASSISTANT_VOICES[voiceId] || ASSISTANT_VOICES.VOICE_1;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = voiceConfig.defaultRate;
    utterance.pitch = voiceConfig.defaultPitch;

    // Pick target system voice matching selected Voice 1 or Voice 2
    const targetVoice = findSystemVoice(voiceId);
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
  }
}

/**
 * Clean raw JSON blocks or internal system dumps from assistant display text
 */
export function cleanAssistantText(rawText: string): string {
  if (!rawText) return 'Processing complete. Ready for next command, Sir.';

  let cleaned = rawText.trim();

  // If text is wrapped in ```json ... ``` or starts with {
  if (cleaned.startsWith('```json') || cleaned.startsWith('{') || cleaned.endsWith('}')) {
    try {
      const jsonStr = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (parsed.conversational_response && typeof parsed.conversational_response === 'string') {
        return parsed.conversational_response;
      }
      if (parsed.response_text && typeof parsed.response_text === 'string') {
        return parsed.response_text;
      }
      if (parsed.tts_chunks && Array.isArray(parsed.tts_chunks) && parsed.tts_chunks.length > 0) {
        return parsed.tts_chunks.join(' ');
      }
      if (parsed.response_chunks && Array.isArray(parsed.response_chunks) && parsed.response_chunks.length > 0) {
        return parsed.response_chunks.join('\n\n');
      }
      if (parsed.text && typeof parsed.text === 'string') {
        return parsed.text;
      }
      if (parsed.raw_reasoning_summary && typeof parsed.raw_reasoning_summary === 'string') {
        return parsed.raw_reasoning_summary;
      }
      if (parsed.message && typeof parsed.message === 'string') {
        return parsed.message;
      }
      if (parsed.tri_agent_consensus?.critic_audit_feedback) {
        return `Audit Status: ${parsed.tri_agent_consensus.critic_status || 'APPROVED'}. ${parsed.tri_agent_consensus.critic_audit_feedback}`;
      }
    } catch {
      // Not strictly valid JSON, strip markdown code fences if wrapping pure json
      cleaned = cleaned.replace(/```json[\s\S]*?```/g, '').trim();
    }
  }

  // Remove any stray raw JSON blocks in the middle of text
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, (match) => {
    try {
      const inner = match.replace(/```json|```/g, '').trim();
      const obj = JSON.parse(inner);
      if (obj.conversational_response) return obj.conversational_response;
      if (obj.response_text) return obj.response_text;
      if (obj.tts_chunks) return obj.tts_chunks.join(' ');
      if (obj.text) return obj.text;
      return '';
    } catch {
      return '';
    }
  }).trim();

  return cleaned || rawText || 'Response received and executed successfully, Sir.';
}
