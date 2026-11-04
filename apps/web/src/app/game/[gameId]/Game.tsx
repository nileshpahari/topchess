/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from 'react';
import { Chess, Move } from 'chess.js';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStatus, useUser } from '@repo/store/useUser';
import { setUser } from '@repo/store/user';
import { useAppDispatch, useAppSelector } from '@repo/store/hooks';
import { appendMove, setMoves } from '@repo/store/chessBoard';
import { Button } from '@/components/Button';
import { ChessBoard, getMoveInput, isPromoting } from '@/components/ChessBoard';
import MovesTable from '@/components/MovesTable';
import { UserAvatar } from '@/components/UserAvatar';
import { GameChat, type ChatMessage } from '@/components/GameChat';
import GameEndModal from '@/components/GameEndModal';
import ExitGameModel from '@/components/ExitGameModel';
import { ShareGame } from '@/components/ShareGame';
import { Waitopponent } from '@/components/ui/waitopponent';
import { useSocket } from '@/hooks/useSocket';
import {
  INIT_GAME,
  MOVE,
  GAME_OVER,
  JOIN_ROOM,
  GAME_JOINED,
  GAME_NOT_FOUND,
  GAME_ADDED,
  USER_TIMEOUT,
  GAME_TIME,
  GAME_ENDED,
  EXIT_GAME,
  CHAT_MESSAGE,
  GameResult,
  Metadata,
} from '@/lib/game';

const TIME_CONTROLS = [
  { label: 'Bullet', value: 'BULLET' },
  { label: 'Blitz', value: 'BLITZ' },
  { label: 'Rapid', value: 'RAPID' },
  { label: 'Classical', value: 'CLASSICAL' },
] as const;

type TimeControl = (typeof TIME_CONTROLS)[number]['value'];

const GAME_MODES = [
  { label: 'Casual', value: 'CASUAL' },
  { label: 'Rated', value: 'RATED' },
] as const;

type GameMode = (typeof GAME_MODES)[number]['value'];

// Mirrors GameEndReason in the Prisma schema; the server always sends one.
const END_REASON_LABELS: Record<string, string> = {
  CHECKMATE: 'Checkmate',
  STALEMATE: 'Stalemate',
  DRAW: 'Draw',
  TIMEOUT: 'Timeout',
  RESIGNATION: 'Resignation',
  ABANDONED: 'Abandonment',
};

const TIME_CONTROL_MS: Record<TimeControl, number> = {
  BULLET: 60 * 1000,
  BLITZ: 5 * 60 * 1000,
  RAPID: 10 * 60 * 1000,
  CLASSICAL: 30 * 60 * 1000,
};

export const Game = () => {
  const socket = useSocket();
  const params = useParams<{ gameId: string }>();
  const gameId = params.gameId;
  const user = useUser();
  const authStatus = useAuthStatus();
  const dispatch = useAppDispatch();

  const router = useRouter();
  // Todo move to store/context
  const [chess, _setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [added, setAdded] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameMetadata, setGameMetadata] = useState<Metadata | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [player1TimeConsumed, setPlayer1TimeConsumed] = useState(0);
  const [player2TimeConsumed, setPlayer2TimeConsumed] = useState(0);
  const [gameID,setGameID] = useState("");
  const [selectedTimeControl, setSelectedTimeControl] =
    useState<TimeControl>('RAPID');
  const [currentTimeControl, setCurrentTimeControl] =
    useState<TimeControl>('RAPID');
  const [selectedMode, setSelectedMode] = useState<GameMode>('CASUAL');
  const [currentMode, setCurrentMode] = useState<GameMode>('CASUAL');

  // socket.onmessage is installed once per socket, so it closes over the
  // selection as it was then; read the latest values through refs instead.
  const selectedTimeControlRef = useRef(selectedTimeControl);
  const selectedModeRef = useRef(selectedMode);
  useEffect(() => {
    selectedTimeControlRef.current = selectedTimeControl;
    selectedModeRef.current = selectedMode;
  }, [selectedTimeControl, selectedMode]);
  const [role, setRole] = useState<'player' | 'spectator'>('player');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activePanel, setActivePanel] = useState<'moves' | 'chat'>('moves');
  const userSelectedMoveIndex = useAppSelector(
    (state) => state.chessBoard.userSelectedMoveIndex,
  );
  const userSelectedMoveIndexRef = useRef(userSelectedMoveIndex);
  const guestAuthStartedRef = useRef(false);

  useEffect(() => {
    userSelectedMoveIndexRef.current = userSelectedMoveIndex;
  }, [userSelectedMoveIndex]);

  useEffect(() => {
    if (authStatus === "succeeded" && !user) {
      if (guestAuthStartedRef.current) return;
      guestAuthStartedRef.current = true;
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'}/auth/guest`, {
        method: 'POST',
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) throw new Error('Guest authentication failed');
          return response.json();
        })
        .then((guest) => dispatch(setUser(guest)))
        .catch((error) => {
          console.error('Failed to create spectator session', error);
          window.location.href = '/login';
        });
    }
  }, [authStatus, dispatch, user]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case GAME_ADDED:
          setAdded(true);
          setGameID((p)=>message.gameId);
          setCurrentTimeControl(message.timeControl ?? selectedTimeControlRef.current);
          setCurrentMode(message.mode ?? selectedModeRef.current);
          break;
        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          setCurrentTimeControl(message.payload.timeControl ?? selectedTimeControlRef.current);
          setCurrentMode(message.payload.mode ?? selectedModeRef.current);
          setRole('player');
          setChatMessages([]);
          router.push(`/game/${message.payload.gameId}`);
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          break;
        case MOVE:
          const { move, player1TimeConsumed, player2TimeConsumed } =
            message.payload;
          setPlayer1TimeConsumed(player1TimeConsumed);
          setPlayer2TimeConsumed(player2TimeConsumed);
          if (userSelectedMoveIndexRef.current !== null) {
            dispatch(appendMove(move));
            return;
          }
          try {
            if (isPromoting(chess, move.from, move.to)) {
              chess.move({
                from: move.from,
                to: move.to,
                promotion: 'q',
              });
            } else {
              chess.move({ from: move.from, to: move.to });
            }
            dispatch(appendMove(move));
            new Audio('/move.wav').play();
          } catch (error) {
            console.log('Error', error);
          }
          break;
        case GAME_OVER:
          setResult(message.payload.result);
          break;

        case GAME_ENDED:
          setResult({
            result: message.payload.result,
            by:
              END_REASON_LABELS[message.payload.reason] ??
              (message.payload.result === 'DRAW' ? 'Draw' : 'Unknown'),
            whiteRatingChange: message.payload.whiteRatingChange ?? null,
            blackRatingChange: message.payload.blackRatingChange ?? null,
          });
          chess.reset();
          setStarted(false);
          setAdded(false);

          break;

        case USER_TIMEOUT:
          setResult(message.payload.win);
          break;

        case GAME_JOINED:
          setGameMetadata({
            blackPlayer: message.payload.blackPlayer,
            whitePlayer: message.payload.whitePlayer,
          });
          setCurrentTimeControl(message.payload.timeControl ?? 'RAPID');
          setCurrentMode(message.payload.mode ?? 'CASUAL');
          setPlayer1TimeConsumed(message.payload.player1TimeConsumed);
          setPlayer2TimeConsumed(message.payload.player2TimeConsumed);
          setStarted(true);
          setRole(message.payload.role ?? 'player');
          setChatMessages(message.payload.chatMessages ?? []);

          message.payload.moves.map((x: Move) => {
            chess.move(getMoveInput(x));
          });
          dispatch(setMoves(message.payload.moves));
          break;

        case CHAT_MESSAGE:
          setChatMessages((current) => current.some((item) => item.id === message.payload.id)
            ? current
            : [...current, message.payload]);
          break;

        case GAME_TIME:
          setPlayer1TimeConsumed(message.payload.player1Time);
          setPlayer2TimeConsumed(message.payload.player2Time);
          break;

        case GAME_NOT_FOUND:
          alert('Game not found');
          router.push('/game/random');
          break;

        default:
          alert(message.payload.message);
          break;
      }
    };

    if (gameId !== 'random') {
      socket.send(
        JSON.stringify({
          type: JOIN_ROOM,
          payload: {
            gameId,
          },
        }),
      );
    }
  }, [chess, dispatch, gameId, router, socket]);

  useEffect(() => {
    if (started) {
      const interval = setInterval(() => {
        if (chess.turn() === 'w') {
          setPlayer1TimeConsumed((p) => p + 100);
        } else {
          setPlayer2TimeConsumed((p) => p + 100);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [started, chess]);

  const getTimer = (timeConsumed: number) => {
    const timeLeftMs = TIME_CONTROL_MS[currentTimeControl] - timeConsumed;
    const minutes = Math.floor(timeLeftMs / (1000 * 60));
    const remainingSeconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    return (
      <div className="text-white">
        Time Left: {minutes < 10 ? '0' : ''}
        {minutes}:{remainingSeconds < 10 ? '0' : ''}
        {remainingSeconds}
      </div>
    );
  };

  const handleExit = () => {
    socket?.send(
      JSON.stringify({
        type: EXIT_GAME,
        payload: {
          gameId,
        },
      }),
    );
    dispatch(setMoves([]));
    router.push('/');
  };

  if (authStatus === "idle" || authStatus === "loading") return null;
  if (!user) return null;
  if (!socket) return <div>Connecting...</div>;

  return (
    <div className="">
      {result && (
        <GameEndModal
          blackPlayer={gameMetadata?.blackPlayer}
          whitePlayer={gameMetadata?.whitePlayer}
          gameResult={result}
        ></GameEndModal>
      )}
      {started && (
        <div className="flex flex-col items-center gap-1 pt-4 text-white">
          <div>
            {role === 'spectator'
              ? 'Watching live'
              : (user.id === gameMetadata?.blackPlayer?.id ? 'b' : 'w') === chess.turn()
                ? 'Your turn'
                : "Opponent's turn"}
          </div>
          <div className="text-xs uppercase tracking-wide text-[#A5A5A2]">
            {currentMode === 'RATED' ? 'Rated' : 'Casual'} ·{' '}
            {currentTimeControl.toLowerCase()}
          </div>
        </div>
      )}
      <div className="justify-center flex">
        <div className="pt-2 w-full">
          <div className="flex gap-8 w-full">
            <div className="text-white">
              <div className="flex justify-center">
                <div>
                  {started && (
                    <div className="mb-4">
                      <div className="flex justify-between">
                        <UserAvatar gameMetadata={gameMetadata} />
                        {getTimer(
                          user.id === gameMetadata?.whitePlayer?.id
                            ? player2TimeConsumed
                            : player1TimeConsumed,
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className={`w-full flex justify-center text-white`}>
                      <ChessBoard
                        started={started}
                        gameId={gameId ?? ''}
                        myColor={
                          user.id === gameMetadata?.blackPlayer?.id ? 'b' : 'w'
                        }
                        chess={chess}
                        setBoard={setBoard}
                        socket={socket}
                        board={board}
                        readOnly={role === 'spectator'}
                      />
                    </div>
                  </div>
                  {started && (
                    <div className="mt-4 flex justify-between">
                      <UserAvatar gameMetadata={gameMetadata} self />
                      {getTimer(
                        user.id === gameMetadata?.blackPlayer?.id
                          ? player2TimeConsumed
                          : player1TimeConsumed,
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-md pt-2 bg-bgAuxiliary3 flex-1 overflow-auto h-[95vh] overflow-y-scroll no-scrollbar">
              {!started ? (
                <div className="pt-8 flex justify-center w-full">
                  {added ? (
                    <div className='flex flex-col items-center space-y-4 justify-center'>
                      <div className="text-white"><Waitopponent/></div>
                      <ShareGame gameId={gameID}/>
                    </div>
                  ) : (
                    gameId === 'random' && (
                      <div className="flex flex-col items-center gap-4">
                        <div className="grid grid-cols-2 gap-2">
                          {TIME_CONTROLS.map((timeControl) => (
                            <button
                              key={timeControl.value}
                              type="button"
                              aria-pressed={selectedTimeControl === timeControl.value}
                              onClick={() => setSelectedTimeControl(timeControl.value)}
                              className={`min-h-10 rounded px-3 py-2 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
                                selectedTimeControl === timeControl.value
                                  ? 'bg-green-600'
                                  : 'bg-bgAuxiliary2 hover:bg-bgAuxiliary1'
                              }`}
                            >
                              {timeControl.label}
                            </button>
                          ))}
                        </div>
                        <div
                          role="group"
                          aria-label="Game mode"
                          className="flex gap-2"
                        >
                          {GAME_MODES.map((mode) => {
                            const isRatedForGuest =
                              mode.value === 'RATED' && user.isGuest;
                            return (
                              <button
                                key={mode.value}
                                type="button"
                                disabled={isRatedForGuest}
                                aria-pressed={selectedMode === mode.value}
                                title={
                                  isRatedForGuest
                                    ? 'Sign in to play rated games'
                                    : undefined
                                }
                                onClick={() => setSelectedMode(mode.value)}
                                className={`min-h-10 rounded px-4 py-2 text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                                  selectedMode === mode.value
                                    ? 'bg-green-600'
                                    : 'bg-bgAuxiliary2 hover:bg-bgAuxiliary1'
                                }`}
                              >
                                {mode.label}
                              </button>
                            );
                          })}
                        </div>
                        {user.isGuest && (
                          <p className="text-xs text-[#A5A5A2]">
                            Guests play casual games only.
                          </p>
                        )}
                        <Button
                          onClick={() => {
                            socket.send(
                              JSON.stringify({
                                type: INIT_GAME,
                                payload: {
                                  timeControl: selectedTimeControl,
                                  mode: selectedMode,
                                },
                              }),
                            );
                          }}
                        >
                          Play
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="p-8 flex justify-center w-full">
                  {role === 'player' && <ExitGameModel onClick={() => handleExit()} />}
                </div>
              )}
              <div>
                {started && (
                  <div className="grid grid-cols-2 border-b border-[#484644] px-2">
                    {(['moves', 'chat'] as const).map((panel) => (
                      <button
                        key={panel}
                        type="button"
                        onClick={() => setActivePanel(panel)}
                        className={`min-h-10 border-b-2 px-3 text-sm font-semibold capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${activePanel === panel ? 'border-green-600 text-white' : 'border-transparent text-[#C3C3C0] hover:text-white'}`}
                      >
                        {panel}
                      </button>
                    ))}
                  </div>
                )}
                {activePanel === 'moves' || !started ? (
                  <MovesTable />
                ) : (
                  <GameChat
                    messages={chatMessages}
                    canSend={role === 'player'}
                    currentUserId={user.id}
                    onSend={(message) => socket.send(JSON.stringify({
                      type: CHAT_MESSAGE,
                      payload: { gameId, message },
                    }))}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
