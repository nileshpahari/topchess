'use client';

import Link from 'next/link';
import { Eye, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface OngoingGame {
  id: string;
  timeControl: string;
  moveCount: number;
  whitePlayer: { username: string; isGuest: boolean };
  blackPlayer: { username: string; isGuest: boolean };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';
const playerName = (player: OngoingGame['whitePlayer']) => player.isGuest ? 'Guest' : player.username;

export function OngoingGames() {
  const [games, setGames] = useState<OngoingGame[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  const loadGames = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch(`${BACKEND_URL}/v1/games/ongoing`, { credentials: 'include' });
      if (!response.ok) throw new Error('Request failed');
      setGames(await response.json());
      setStatus('success');
    } catch (error) {
      console.error('Failed to load ongoing games', error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${BACKEND_URL}/v1/games/ongoing`, { credentials: 'include' })
      .then((response) => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then((ongoingGames: OngoingGame[]) => {
        if (!cancelled) {
          setGames(ongoingGames);
          setStatus('success');
        }
      })
      .catch((error) => {
        console.error('Failed to load ongoing games', error);
        if (!cancelled) setStatus('error');
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mt-16" aria-labelledby="ongoing-games-title">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 id="ongoing-games-title" className="text-2xl font-bold text-white">Ongoing games</h2>
          <p className="mt-1 text-sm text-[#C3C3C0]">Watch games currently in progress.</p>
        </div>
        <button type="button" onClick={() => void loadGames()} aria-label="Refresh ongoing games" className="flex h-10 w-10 items-center justify-center rounded-md text-[#C3C3C0] hover:bg-bgAuxiliary1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>
      {status === 'loading' ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[0, 1].map((item) => <div key={item} className="h-24 animate-pulse rounded-md bg-bgAuxiliary1" />)}
        </div>
      ) : status === 'error' ? (
        <div className="rounded-md bg-bgAuxiliary2 p-5 text-[#C3C3C0]">
          <p>Could not load ongoing games.</p>
          <button type="button" onClick={() => void loadGames()} className="mt-3 min-h-10 rounded-md bg-green-700 px-4 text-white hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">Try again</button>
        </div>
      ) : games.length === 0 ? (
        <div className="rounded-md bg-bgAuxiliary1 p-6 text-center text-[#C3C3C0]">No games are being played right now.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {games.map((game) => (
            <Link key={game.id} href={`/game/${game.id}`} className="flex min-h-24 items-center justify-between rounded-md bg-bgAuxiliary1 p-4 text-white transition-colors hover:bg-bgAuxiliary2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600">
              <div className="min-w-0">
                <p className="truncate font-semibold">{playerName(game.whitePlayer)} vs {playerName(game.blackPlayer)}</p>
                <p className="mt-1 text-sm text-[#C3C3C0]">{game.timeControl.toLowerCase()} · {game.moveCount} moves</p>
              </div>
              <span className="ml-4 flex items-center gap-2 text-sm text-green-500"><Eye size={18} aria-hidden="true" /> Watch</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
