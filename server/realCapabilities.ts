import type { Express, Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import JSZip from 'jszip';
import { Readable } from 'stream';

interface CallRoomPeer {
  peerId: string;
  res: Response;
  joinedAt: number;
}

interface CallRoom {
  roomId: string;
  createdAt: number;
  peers: Map<string, CallRoomPeer>;
}

const callRooms = new Map<string, CallRoom>();

// Cleanup stale call rooms every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of callRooms.entries()) {
    if (room.peers.size === 0 && now - room.createdAt > 30 * 60 * 1000) {
      callRooms.delete(roomId);
    }
  }
}, 10 * 60 * 1000);

function isSafePublicUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function resolveUrlSafe(base: string, relative: string): string | null {
  try {
    if (!relative || relative.startsWith('javascript:') || relative.startsWith('data:') || relative.startsWith('mailto:') || relative.startsWith('tel:')) {
      return null;
    }
    const resolved = new URL(relative, base);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeHtmlForPreview(html: string, baseUrl: string): string {
  // Strip executable scripts, iframes, objects, and inline event handlers
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Rewrite relative href and src to absolute URLs
  clean = clean.replace(/(href|src)=["']([^"']+)["']/gi, (full, attr, val) => {
    const abs = resolveUrlSafe(baseUrl, val);
    if (!abs) return `${attr}="#"`;
    return `${attr}="${abs}"`;
  });

  // Inject clean base styling and link interceptor script for parent postMessage navigation
  const injectedHead = `
    <base href="${baseUrl}">
    <style>
      html, body {
        background: #0d1017 !important;
        color: #e2e8f0 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        line-height: 1.6 !important;
        padding: 16px !important;
        max-width: 100% !important;
        overflow-x: hidden !important;
      }
      a { color: #00f5a0 !important; text-decoration: underline !important; cursor: pointer !important; }
      img, video { max-width: 100% !important; height: auto !important; border-radius: 10px; }
      header, nav, footer, aside { max-width: 100% !important; }
      table { max-width: 100% !important; display: block; overflow-x: auto; }
    </style>
    <script>
      document.addEventListener('click', function(e) {
        var anchor = e.target && e.target.closest ? e.target.closest('a') : null;
        if (anchor && anchor.href) {
          e.preventDefault();
          window.parent.postMessage({ type: 'skew-browser-navigate', url: anchor.href }, '*');
        }
      }, true);
    </script>
  `;

  if (/<head[^>]*>/i.test(clean)) {
    return clean.replace(/<head[^>]*>/i, (m) => `${m}\n${injectedHead}`);
  }
  return `<!doctype html><html><head>${injectedHead}</head><body>${clean}</body></html>`;
}

export function registerRealCapabilities(app: Express, getGenAI: () => GoogleGenAI | null) {
  // ============================================================================
  // 1. REAL CLOUD BROWSER & MEDIA SNIFFER
  // ============================================================================
  app.post('/api/browser/navigate', async (req: Request, res: Response) => {
    const rawUrl = String(req.body?.url || '').trim();
    if (!rawUrl) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const safeUrl = isSafePublicUrl(normalizedUrl);
    if (!safeUrl) {
      return res.status(400).json({ error: 'Only valid public http:// or https:// URLs are allowed.' });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 14000);

      const response = await fetch(safeUrl.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,video/*,*/*;q=0.8',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      }).finally(() => clearTimeout(timeout));

      const finalUrl = response.url || safeUrl.toString();
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const contentLength = Number(response.headers.get('content-length') || 0);

      // Direct downloadable media / binary URL
      if (
        contentType.startsWith('video/') ||
        contentType.startsWith('audio/') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/vnd.android.package-archive') ||
        /\.(mp4|mkv|webm|mov|m4v|avi|mp3|pdf|zip|apk)(\?|$)/i.test(finalUrl)
      ) {
        const fileName = decodeURIComponent(finalUrl.split('/').pop()?.split('?')[0] || 'media_file.mp4');
        return res.json({
          success: true,
          finalUrl,
          title: fileName,
          isDirectMedia: true,
          contentType,
          contentLength,
          mediaItems: [
            {
              url: finalUrl,
              type: contentType || 'video/mp4',
              label: fileName,
              sizeBytes: contentLength || undefined,
            },
          ],
          links: [],
          htmlPreview: '',
          textSummary: `Direct media stream detected (${contentType || 'video'}). Ready to stream or download.`,
        });
      }

      const rawHtml = await response.text();
      const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : new URL(finalUrl).hostname;

      const descMatch = rawHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                        rawHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
      const description = descMatch ? decodeHtmlEntities(descMatch[1]) : '';

      // Sniff video/media URLs
      const mediaSet = new Map<string, { url: string; type: string; label: string }>();

      const addMedia = (candidate: string, type: string, label: string) => {
        const abs = resolveUrlSafe(finalUrl, candidate);
        if (abs && !mediaSet.has(abs)) {
          mediaSet.set(abs, { url: abs, type, label });
        }
      };

      // og:video
      const ogVideoRegex = /<meta[^>]+property=["']og:video(?::url|:secure_url)?["'][^>]+content=["']([^"']+)["']/gi;
      let m: RegExpExecArray | null;
      while ((m = ogVideoRegex.exec(rawHtml)) !== null) {
        addMedia(m[1], 'video/mp4', 'OpenGraph Video Stream');
      }

      // <video src> and <source src>
      const srcMediaRegex = /<(?:video|source)[^>]+src=["']([^"']+)["'][^>]*>/gi;
      while ((m = srcMediaRegex.exec(rawHtml)) !== null) {
        addMedia(m[1], 'video/mp4', m[1].split('/').pop()?.split('?')[0] || 'Embedded Video');
      }

      // Direct links to video/archive files
      const fileLinkRegex = /href=["']([^"']+\.(?:mp4|webm|mkv|m4v|mov|ogv|m3u8|mp3|apk|pdf|zip)(?:\?[^"']*)?)["']/gi;
      while ((m = fileLinkRegex.exec(rawHtml)) !== null) {
        const fname = decodeURIComponent(m[1].split('/').pop()?.split('?')[0] || 'Media File');
        addMedia(m[1], fname.endsWith('.apk') ? 'application/apk' : 'video/mp4', fname);
      }

      // Extract readable links
      const links: Array<{ title: string; url: string }> = [];
      const seenLinks = new Set<string>();
      const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      while ((m = anchorRegex.exec(rawHtml)) !== null && links.length < 50) {
        const abs = resolveUrlSafe(finalUrl, m[1]);
        const linkText = decodeHtmlEntities(m[2].replace(/<[^>]+>/g, ''));
        if (abs && linkText && linkText.length > 1 && !seenLinks.has(abs)) {
          seenLinks.add(abs);
          links.push({ title: linkText.slice(0, 90), url: abs });
        }
      }

      // If archive.org details page, also auto-enrich with archive.org metadata files!
      const archiveDetailsMatch = finalUrl.match(/archive\.org\/details\/([^/?#]+)/i);
      if (archiveDetailsMatch && archiveDetailsMatch[1]) {
        try {
          const metaResp = await fetch(`https://archive.org/metadata/${encodeURIComponent(archiveDetailsMatch[1])}`);
          if (metaResp.ok) {
            const metaData: any = await metaResp.json();
            const files = Array.isArray(metaData?.files) ? metaData.files : [];
            for (const f of files) {
              if (f?.name && /\.(mp4|mkv|webm|ogv|mov)$/i.test(f.name)) {
                const fileUrl = `https://archive.org/download/${encodeURIComponent(archiveDetailsMatch[1])}/${encodeURIComponent(f.name)}`;
                addMedia(fileUrl, 'video/mp4', `${f.name} (${f.format || 'Video'})`);
              }
            }
          }
        } catch {
          // ignore archive enrichment failure
        }
      }

      const plainText = decodeHtmlEntities(
        rawHtml
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
      ).slice(0, 1200);

      const htmlPreview = sanitizeHtmlForPreview(rawHtml, finalUrl);

      return res.json({
        success: true,
        status: response.status,
        finalUrl,
        title,
        description,
        isDirectMedia: false,
        contentType,
        mediaItems: Array.from(mediaSet.values()).slice(0, 30),
        links,
        textSummary: plainText,
        htmlPreview,
      });
    } catch (err: any) {
      return res.status(502).json({
        error: err?.name === 'AbortError'
          ? 'Website request timed out (14s). Try opening directly in external browser or try another URL.'
          : `Could not fetch webpage: ${err?.message || 'Network error'}`,
      });
    }
  });

  // ============================================================================
  // 2. REAL MOVIE & WEB SEARCH (Internet Archive Cinema + DuckDuckGo Web)
  // ============================================================================
  app.get('/api/browser/search', async (req: Request, res: Response) => {
    const query = String(req.query.q || '').trim() || 'classic sci-fi movie';
    const mode = String(req.query.type || 'movies').toLowerCase();

    try {
      if (mode === 'movies') {
        // Real Internet Archive Movies API (full-length public domain & CC movies)
        const cleanQ = query.replace(/[^\w\s-]/g, ' ').trim();
        const archiveQuery = `(${cleanQ}) AND mediatype:(movies)`;
        const apiUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(archiveQuery)}&fl[]=identifier,title,description,year,downloads,runtime,subject,creator&sort[]=downloads+desc&rows=18&output=json`;

        const resp = await fetch(apiUrl, {
          headers: { 'User-Agent': 'SKEW-OS-Browser/1.0' },
        });

        let docs: any[] = [];
        if (resp.ok) {
          const data: any = await resp.json();
          docs = data?.response?.docs || [];
        }

        const movies = docs.map((d: any) => ({
          identifier: d.identifier,
          title: Array.isArray(d.title) ? d.title[0] : (d.title || d.identifier),
          description: Array.isArray(d.description) ? d.description[0] : (d.description || 'Full-length open archive film ready to stream or download.'),
          year: d.year || 'Archive',
          downloads: Number(d.downloads || 0),
          runtime: d.runtime || '',
          creator: Array.isArray(d.creator) ? d.creator[0] : (d.creator || ''),
          posterUrl: `https://archive.org/services/img/${encodeURIComponent(d.identifier)}`,
          pageUrl: `https://archive.org/details/${encodeURIComponent(d.identifier)}`,
        }));

        return res.json({
          success: true,
          mode: 'movies',
          query,
          movies,
        });
      }

      // Live Web Search via DuckDuckGo HTML
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const resp = await fetch(ddgUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-IN,en;q=0.9',
        },
      });

      const webResults: Array<{ title: string; url: string; snippet: string }> = [];
      if (resp.ok) {
        const html = await resp.text();
        const resultBlockRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>)?/gi;
        let match: RegExpExecArray | null;
        while ((match = resultBlockRegex.exec(html)) !== null && webResults.length < 15) {
          let href = match[1];
          // Unwrap DuckDuckGo uddg redirect
          const uddgMatch = href.match(/[?&]uddg=([^&]+)/);
          if (uddgMatch) {
            href = decodeURIComponent(uddgMatch[1]);
          }
          if (/^https?:\/\//i.test(href)) {
            webResults.push({
              title: decodeHtmlEntities(match[2].replace(/<[^>]+>/g, '')),
              url: href,
              snippet: match[3] ? decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')) : '',
            });
          }
        }
      }

      // Fallback to Wikipedia OpenSearch if DDG returned empty
      if (webResults.length === 0) {
        const wikiResp = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=10&format=json`);
        if (wikiResp.ok) {
          const wikiData: any = await wikiResp.json();
          const titles: string[] = wikiData[1] || [];
          const descs: string[] = wikiData[2] || [];
          const urls: string[] = wikiData[3] || [];
          for (let i = 0; i < titles.length; i++) {
            webResults.push({
              title: titles[i],
              url: urls[i],
              snippet: descs[i] || 'Wikipedia reference article',
            });
          }
        }
      }

      return res.json({
        success: true,
        mode: 'web',
        query,
        results: webResults,
      });
    } catch (err: any) {
      return res.status(502).json({ error: `Search failed: ${err?.message || 'Network error'}` });
    }
  });

  // ============================================================================
  // 3. ARCHIVE MOVIE FILES RESOLVER (Real MP4 / MKV / WebM Download Links)
  // ============================================================================
  app.get('/api/browser/archive-files', async (req: Request, res: Response) => {
    const identifier = String(req.query.identifier || '').trim();
    if (!identifier) {
      return res.status(400).json({ error: 'identifier is required' });
    }

    try {
      const resp = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
        headers: { 'User-Agent': 'SKEW-OS-Browser/1.0' },
      });
      if (!resp.ok) {
        return res.status(resp.status).json({ error: 'Failed to fetch movie files from Archive.org' });
      }
      const data: any = await resp.json();
      const rawFiles = Array.isArray(data?.files) ? data.files : [];

      const videoFiles = rawFiles
        .filter((f: any) => f?.name && /\.(mp4|mkv|webm|ogv|mov|m4v|srt)$/i.test(f.name))
        .map((f: any) => {
          const directUrl = `https://archive.org/download/${encodeURIComponent(identifier)}/${encodeURIComponent(f.name).replace(/%2F/g, '/')}`;
          return {
            name: f.name,
            format: f.format || f.name.split('.').pop()?.toUpperCase() || 'VIDEO',
            sizeBytes: Number(f.size || 0),
            length: f.length || '',
            width: f.width || '',
            height: f.height || '',
            directUrl,
            streamUrl: `/api/browser/stream?url=${encodeURIComponent(directUrl)}`,
            downloadUrl: `/api/browser/download?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(f.name.split('/').pop() || `${identifier}.mp4`)}`,
          };
        })
        .sort((a: any, b: any) => {
          const aMp4 = a.name.toLowerCase().endsWith('.mp4') ? 0 : 1;
          const bMp4 = b.name.toLowerCase().endsWith('.mp4') ? 0 : 1;
          if (aMp4 !== bMp4) return aMp4 - bMp4;
          return (b.sizeBytes || 0) - (a.sizeBytes || 0);
        });

      return res.json({
        success: true,
        identifier,
        title: data?.metadata?.title || identifier,
        description: data?.metadata?.description || '',
        files: videoFiles,
      });
    } catch (err: any) {
      return res.status(502).json({ error: `Could not resolve movie files: ${err?.message}` });
    }
  });

  // ============================================================================
  // 4. REAL VIDEO STREAM & ATTACHMENT DOWNLOAD PROXY
  // ============================================================================
  app.get('/api/browser/stream', async (req: Request, res: Response) => {
    const rawUrl = String(req.query.url || '').trim();
    const safeUrl = isSafePublicUrl(rawUrl);
    if (!safeUrl) {
      return res.status(400).json({ error: 'Invalid or unsafe stream URL' });
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
      };
      if (req.headers.range) {
        headers['Range'] = String(req.headers.range);
      }

      const upstream = await fetch(safeUrl.toString(), { headers, redirect: 'follow' });
      if (!upstream.ok && upstream.status !== 206) {
        return res.status(upstream.status).send('Upstream media unavailable');
      }

      res.status(upstream.status);
      const passHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
      for (const h of passHeaders) {
        const val = upstream.headers.get(h);
        if (val) res.setHeader(h, val);
      }
      if (!upstream.headers.get('accept-ranges')) {
        res.setHeader('Accept-Ranges', 'bytes');
      }

      if (!upstream.body) {
        return res.end();
      }
      const nodeStream = Readable.fromWeb(upstream.body as any);
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(502);
        res.end();
      });
      nodeStream.pipe(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).json({ error: `Stream error: ${err?.message}` });
      }
    }
  });

  app.get('/api/browser/download', async (req: Request, res: Response) => {
    const rawUrl = String(req.query.url || '').trim();
    const safeUrl = isSafePublicUrl(rawUrl);
    if (!safeUrl) {
      return res.status(400).json({ error: 'Invalid or unsafe download URL' });
    }

    const rawFilename = String(req.query.filename || safeUrl.pathname.split('/').pop() || 'skew-download.mp4');
    const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'movie_download.mp4';

    try {
      const upstream = await fetch(safeUrl.toString(), {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
        },
      });

      if (!upstream.ok) {
        return res.status(upstream.status).json({ error: `Remote server returned ${upstream.status}` });
      }

      const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
      const contentLength = upstream.headers.get('content-length');

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }

      if (!upstream.body) {
        return res.end();
      }
      const nodeStream = Readable.fromWeb(upstream.body as any);
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(502);
        res.end();
      });
      nodeStream.pipe(res);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(502).json({ error: `Download error: ${err?.message}` });
      }
    }
  });

  // ============================================================================
  // 5. LIVE VOICE CALL AI RESPONDER & WEBRTC P2P SIGNALING
  // ============================================================================
  app.post('/api/call/respond', async (req: Request, res: Response) => {
    const message = String(req.body?.message || '').trim();
    const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
    const persona = String(req.body?.persona || 'SKEW');
    const languageHint = String(req.body?.language || 'en-IN');

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const ai = getGenAI();
    if (ai) {
      try {
        const conversationLines = history
          .map((h: any) => `${h.sender === 'user' ? 'Caller' : persona}: ${h.text}`)
          .join('\n');

        const prompt = `${conversationLines ? `Recent call transcript:\n${conversationLines}\n` : ''}Caller just said: "${message}"\nReply naturally as ${persona} on a live phone call.`;

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction: `You are ${persona}, talking live on a real phone call with the user.
Match the user's language naturally (Hindi, Hinglish, or English; caller locale hint: ${languageHint}).
Keep replies crisp, warm, human, and natural for spoken voice (1 to 3 short sentences max).
NEVER output markdown, bullet points, asterisks, URLs, or JSON. Speak directly as if on a live voice call.`,
          },
        });

        const reply = (response.text || '').replace(/[*_#`]/g, '').trim();
        if (reply) {
          return res.json({ success: true, reply, model: 'gemini-4-hydrogen' });
        }
      } catch (err: any) {
        console.warn('[Call AI] Falling back to instant local call responder:', err?.message);
      }
    }

    // Instant local conversational fallback
    const lower = message.toLowerCase();
    const isHinglish = /hai|kya|kaise|karo|bhai|haan|nahi|baat|sun|bata|movie|call|acha/i.test(lower);
    let reply = '';
    if (lower.includes('kaise ho') || lower.includes('how are you')) {
      reply = isHinglish
        ? 'Main bilkul badhiya hoon! Aap bataiye, aaj kis kaam mein help karun?'
        : 'I am doing great! Tell me, how can I help you today?';
    } else if (lower.includes('movie') || lower.includes('film') || lower.includes('download')) {
      reply = isHinglish
        ? 'Bilkul, aap Browser aur Movie tab mein jaakar koi bhi movie search aur direct MP4 download kar sakte hain. Kaunsi movie dekhni hai?'
        : 'Sure! You can search and download movies directly from the Cloud Browser tab. Which movie are you looking for?';
    } else if (lower.includes('apk') || lower.includes('android') || lower.includes('app')) {
      reply = isHinglish
        ? 'Aap APK Studio se app ko phone par install kar sakte hain ya full Android Capacitor APK project zip download kar sakte hain.'
        : 'You can install this directly on your phone from APK Studio or export the full Android Capacitor project zip.';
    } else {
      reply = isHinglish
        ? `Haan ji, main sun raha hoon. Aapne kaha "${message.slice(0, 60)}". Bataiye aage kya karna hai?`
        : `I hear you clearly. You mentioned "${message.slice(0, 60)}". What would you like me to do next?`;
    }

    return res.json({ success: true, reply, model: 'instant-voice-core' });
  });

  // WebRTC Signaling: Create or Check Call Room
  app.post('/api/call/room/create', (req: Request, res: Response) => {
    const requestedId = String(req.body?.roomId || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const roomId = requestedId || `SKW-${Math.floor(100 + Math.random() * 900)}`;

    if (!callRooms.has(roomId)) {
      callRooms.set(roomId, {
        roomId,
        createdAt: Date.now(),
        peers: new Map(),
      });
    }

    return res.json({
      success: true,
      roomId,
      peerCount: callRooms.get(roomId)!.peers.size,
    });
  });

  // WebRTC Signaling: SSE Event Stream
  app.get('/api/call/room/:roomId/events', (req: Request, res: Response) => {
    const roomId = String(req.params.roomId || '').trim().toUpperCase();
    const peerId = String(req.query.peerId || '').trim();
    if (!roomId || !peerId) {
      return res.status(400).json({ error: 'roomId and peerId are required' });
    }

    if (!callRooms.has(roomId)) {
      callRooms.set(roomId, {
        roomId,
        createdAt: Date.now(),
        peers: new Map(),
      });
    }

    const room = callRooms.get(roomId)!;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    room.peers.set(peerId, { peerId, res, joinedAt: Date.now() });

    const existingPeers = Array.from(room.peers.keys()).filter((id) => id !== peerId);
    res.write(`data: ${JSON.stringify({ type: 'room-joined', roomId, peerId, existingPeers })}\n\n`);

    // Notify other peers
    for (const [otherId, peer] of room.peers.entries()) {
      if (otherId !== peerId) {
        peer.res.write(`data: ${JSON.stringify({ type: 'peer-joined', peerId })}\n\n`);
      }
    }

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        // ignore
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      room.peers.delete(peerId);
      for (const [, peer] of room.peers.entries()) {
        try {
          peer.res.write(`data: ${JSON.stringify({ type: 'peer-left', peerId })}\n\n`);
        } catch {
          // ignore
        }
      }
    });
  });

  // WebRTC Signaling: Forward Offer / Answer / ICE Candidate / Hangup
  app.post('/api/call/room/:roomId/signal', (req: Request, res: Response) => {
    const roomId = String(req.params.roomId || '').trim().toUpperCase();
    const { from, target, type, payload } = req.body || {};
    const room = callRooms.get(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Call room not found' });
    }

    let delivered = 0;
    for (const [peerId, peer] of room.peers.entries()) {
      if (peerId === from) continue;
      if (target && peerId !== target) continue;
      try {
        peer.res.write(`data: ${JSON.stringify({ type, from, payload })}\n\n`);
        delivered++;
      } catch {
        // ignore stale socket
      }
    }

    return res.json({ success: true, delivered });
  });

  // ============================================================================
  // 6. ANDROID APK CAPACITOR + GITHUB ACTIONS PROJECT ZIP EXPORTER
  // ============================================================================
  app.get('/api/apk/export-zip', async (req: Request, res: Response) => {
    try {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:3000';
      const liveAppUrl = String(req.query.appUrl || `${proto}://${host}`).replace(/\/+$/, '');
      const appName = String(req.query.appName || 'SKEW OS').slice(0, 32);
      const appId = String(req.query.appId || 'com.skew.ultron').replace(/[^a-zA-Z0-9._]/g, '');

      const zip = new JSZip();

      zip.file('package.json', JSON.stringify({
        name: 'skew-os-android-apk',
        version: '1.0.0',
        description: `${appName} Android APK Wrapper using Capacitor`,
        scripts: {
          'sync:android': 'npx cap sync android',
          'build:apk': 'cd android && ./gradlew assembleDebug',
        },
        dependencies: {
          '@capacitor/core': '^6.1.0',
          '@capacitor/android': '^6.1.0',
        },
        devDependencies: {
          '@capacitor/cli': '^6.1.0',
        },
      }, null, 2));

      zip.file('capacitor.config.json', JSON.stringify({
        appId,
        appName,
        webDir: 'www',
        server: {
          url: liveAppUrl,
          cleartext: true,
          allowNavigation: ['*'],
        },
        android: {
          allowMixedContent: true,
          captureInput: true,
          webContentsDebuggingEnabled: true,
        },
      }, null, 2));

      zip.file('www/index.html', `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${appName}</title>
</head>
<body style="background:#0a0b10;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;">
  <div>
    <h2 style="color:#00f5a0;">${appName}</h2>
    <p>Connecting to live server: ${liveAppUrl}</p>
  </div>
</body>
</html>`);

      zip.file('android/app/src/main/AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.CALL_PHONE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

    <application
        android:allowBackup="true"
        android:label="${appName}"
        android:supportsRtl="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);

      const pkgPath = appId.replace(/\./g, '/');
      zip.file(`android/app/src/main/java/${pkgPath}/MainActivity.java`, `package ${appId};

import android.Manifest;
import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.DownloadListener;
import android.webkit.PermissionRequest;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQUEST_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestRuntimePermissions();
        setupWebViewFeatures();
    }

    private void requestRuntimePermissions() {
        String[] perms = new String[] {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.CAMERA,
            Manifest.permission.CALL_PHONE
        };
        ActivityCompat.requestPermissions(this, perms, PERMISSION_REQUEST_CODE);
    }

    private void setupWebViewFeatures() {
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        // Grant WebRTC / Voice Call mic & camera permissions inside WebView
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        // Handle tel: calls and native Android DownloadManager for movies/files
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && url.startsWith("tel:")) {
                    Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse(url));
                    startActivity(intent);
                    return true;
                }
                return super.shouldOverrideUrlLoading(view, url);
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            String fileName = URLUtil.guessFileName(url, contentDisposition, mimeType);
            request.setMimeType(mimeType);
            request.addRequestHeader("User-Agent", userAgent);
            request.setDescription("Downloading via SKEW OS...");
            request.setTitle(fileName);
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
            DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                Toast.makeText(getApplicationContext(), "Downloading " + fileName, Toast.LENGTH_LONG).show();
            }
        });
    }
}
`);

      zip.file('.github/workflows/build-apk.yml', `name: Build SKEW OS Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-android-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Java 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install Capacitor & Init Android if needed
        run: |
          npm install
          if [ ! -f "android/gradlew" ]; then
            npx cap add android
          fi
          npx cap sync android

      - name: Build Debug APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: SKEW-OS-debug-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
`);

      zip.file('README_APK_BUILD.md', `# ${appName} — Android APK Build Guide

This package turns your live **${appName}** web app (${liveAppUrl}) into a native Android \`.apk\` with full **Voice Call (Microphone + WebRTC)**, **Phone Dialer (tel:)**, and **Movie Download Manager** support.

## Method 1: Build APK in the Cloud (Zero Android Studio needed — Recommended)
1. Upload these extracted files to a new GitHub repository.
2. Go to the **Actions** tab on GitHub and run **"Build SKEW OS Android APK"**.
3. In ~2 minutes, download **SKEW-OS-debug-apk** (\`app-debug.apk\`) directly from the workflow artifacts and install it on your Android phone!

## Method 2: Build APK Locally with Android Studio / CLI
\`\`\`bash
npm install
npx cap add android
# Replace generated AndroidManifest.xml and MainActivity.java with the ones provided if needed
npx cap sync android
cd android && ./gradlew assembleDebug
\`\`\`
Your compiled APK will be at:
\`android/app/build/outputs/apk/debug/app-debug.apk\`

## Method 3: Instant Zero-Build Bubblewrap TWA APK
\`\`\`bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest ${liveAppUrl}/manifest.webmanifest
bubblewrap build
\`\`\`
`);

      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="SKEW-OS-Android-APK-Project.zip"');
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (err: any) {
      return res.status(500).json({ error: `Failed to generate APK project zip: ${err?.message}` });
    }
  });
}
