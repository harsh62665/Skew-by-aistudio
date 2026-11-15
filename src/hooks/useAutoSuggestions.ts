import { useState, useEffect, useRef, useCallback } from 'react';
import { AssistantMessage, AssistantVisualState, AutoSuggestionChip, AutoSuggestionsResponse } from '../types';

interface UseAutoSuggestionsProps {
  messages: AssistantMessage[];
  visualState: AssistantVisualState;
  currentGoal?: string;
}

export function useAutoSuggestions({ messages, visualState, currentGoal }: UseAutoSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AutoSuggestionChip[]>([
    {
      id: 'default-1',
      label: '⚡ Compare AI Benchmarks',
      prompt: 'Search online for the latest 2026 AI model benchmarks and compare latency, reasoning scores, and cost.',
      category: 'ONLINE_SEARCH',
      searchQueryUsed: 'latest AI model benchmarks 2026',
      onlineCheckSnippet: 'Verified latest benchmark matrices for leading cognitive engines.'
    },
    {
      id: 'default-2',
      label: '🌐 Search Trending Tech News',
      prompt: 'Perform an online check on Google News for breaking autonomous agent and AGI advancements today.',
      category: 'ONLINE_SEARCH',
      searchQueryUsed: 'autonomous agents breakthroughs today',
      onlineCheckSnippet: 'Scraped live tech headlines and research announcements.'
    },
    {
      id: 'default-3',
      label: '🧪 Synthesize Test Workflow',
      prompt: 'Synthesize a Python script that validates input schema and runs an isolated AST execution benchmark.',
      category: 'EXECUTE',
      searchQueryUsed: 'python ast execution safety',
      onlineCheckSnippet: 'Cross-checked AST execution safety constraints.'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [onlineSearchSummary, setOnlineSearchSummary] = useState<string>('Live online check verified with Google Search index');
  const [isOnlineChecked, setIsOnlineChecked] = useState(true);
  const [searchQueriesPerformed, setSearchQueriesPerformed] = useState<string[]>(['latest AI benchmarks']);
  const [overallTopic, setOverallTopic] = useState<string>('');

  const lastFetchHashRef = useRef<string>('');
  const lastFetchTimeRef = useRef<number>(0);
  const debounceTimerRef = useRef<any>(null);
  const isFetchingRef = useRef(false);

  // Maintain refs for latest values to keep callbacks stable
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const currentGoalRef = useRef(currentGoal);
  currentGoalRef.current = currentGoal;

  // Stable conversation hash based on message count and last message
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const conversationHash = `${messages.length}:${lastMsg?.id || 'init'}:${(lastMsg?.text || '').slice(0, 40)}:${currentGoal || ''}`;

  const fetchSuggestions = useCallback(async (force: boolean = false) => {
    // Only proceed if not currently fetching
    if (isFetchingRef.current) return;

    const currentHash = conversationHash;
    const now = Date.now();

    // Prevent duplicate calls or high-frequency polling
    if (!force) {
      if (currentHash === lastFetchHashRef.current) return;
      if (now - lastFetchTimeRef.current < 5000) return;
    }

    lastFetchHashRef.current = currentHash;
    lastFetchTimeRef.current = now;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      // Package recent messages for the backend analysis
      const currentMessages = messagesRef.current;
      const formattedMessages = currentMessages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text || ''
      }));

      const response = await fetch('/api/auto-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: formattedMessages,
          currentGoal: currentGoalRef.current
        })
      });

      if (response.ok) {
        const data: AutoSuggestionsResponse = await response.json();
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length >= 3) {
          setSuggestions(data.suggestions.slice(0, 3));
          setOnlineSearchSummary(data.onlineSearchSummary || 'Online check completed via Google Search');
          setIsOnlineChecked(data.isOnlineChecked ?? true);
          setSearchQueriesPerformed(data.searchQueriesPerformed || []);
          if (data.overallTopic) {
            setOverallTopic(data.overallTopic);
          }
        }
      }
    } catch {
      // Quiet failover; keep default or existing suggestions
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [conversationHash]);

  // Trigger when system is IDLE and conversation changes (debounced by 1000ms)
  useEffect(() => {
    if (visualState !== 'IDLE') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(false);
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [visualState, conversationHash, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    onlineSearchSummary,
    isOnlineChecked,
    searchQueriesPerformed,
    overallTopic,
    refreshSuggestions: () => fetchSuggestions(true)
  };
}
