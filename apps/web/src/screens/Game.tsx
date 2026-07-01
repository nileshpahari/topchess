/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/Button';
import { ChessBoard, getMoveInput, isPromoting } from '../components/ChessBoard';
import { useSocket } from '../hooks/useSocket';
import { Chess, Move } from 'chess.js';
import { useParams, useRouter } from 'next/navigation';
import MovesTable from '../components/MovesTable';
import { useAuthStatus, useUser } from '@repo/store/useUser';
import { UserAvatar } from '../components/UserAvatar';
import { GameChat, type ChatMessage } from '../components/GameChat';
import { setUser } from '@repo/store/user';

// TODO: Move together, there's code repetition here
export const INIT_GAME = 'init_game';
export const MOVE = 'move';
export const OPPONENT_DISCONNECTED = 'opponent_disconnected';
export const GAME_OVER = 'game_over';
export const JOIN_ROOM = 'join_room';
export const GAME_JOINED = 'game_joined';
export const GAME_NOT_FOUND = 'game_not_found';
export const GAME_ALERT = 'game_alert';
export const GAME_ADDED = 'game_added';
export const USER_TIMEOUT = 'user_timeout';
export const GAME_TIME = 'game_time';
export const GAME_ENDED = 'game_ended';
export const EXIT_GAME = 'exit_game';
export const CHAT_MESSAGE = 'chat_message';
export enum Result {
  WHITE_WINS = 'WHITE_WINS',
  BLACK_WINS = 'BLACK_WINS',
  DRAW = 'DRAW',
}
export interface GameResult {
  result: Result;
  by: string;
}

const TIME_CONTROLS = [
  { label: 'Bullet', value: 'BULLET' },
  { label: 'Blitz', value: 'BLITZ' },
  { label: 'Rapid', value: 'RAPID' },
  { label: 'Classical', value: 'CLASSICAL' },
] as const;

type TimeControl = (typeof TIME_CONTROLS)[number]['value'];

const TIME_CONTROL_MS: Record<TimeControl, number> = {
  BULLET: 60 * 1000,
  BLITZ: 5 * 60 * 1000,
  RAPID: 10 * 60 * 1000,
  CLASSICAL: 30 * 60 * 1000,
};

export interface Player {
  id: string;
  username: string;
  isGuest: boolean;
}
import { useAppDispatch, useAppSelector } from '@repo/store/hooks';
import { appendMove, setMoves } from '@repo/store/chessBoard';
import GameEndModal from '@/components/GameEndModal';
import { Waitopponent } from '@/components/ui/waitopponent';
import { ShareGame } from '../components/ShareGame';
import ExitGameModel from '@/components/ExitGameModel';

export interface Metadata {
  blackPlayer: Player;
  whitePlayer: Player;
}

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
          setCurrentTimeControl(message.timeControl ?? selectedTimeControl);
          break;
        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          setCurrentTimeControl(message.payload.timeControl ?? selectedTimeControl);
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
          let wonBy;
          switch (message.payload.status) {
            case 'COMPLETED':
              wonBy = message.payload.result !== 'DRAW' ? 'CheckMate' : 'Draw';
              break;
            case 'PLAYER_EXIT':
              wonBy = 'Player Exit';
              break;
            default:
              wonBy = 'Timeout';
          }
          setResult({
            result: message.payload.result,
            by: wonBy,
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
  }, [started, gameMetadata, user]);

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
        <div className="justify-center flex pt-4 text-white">
          {role === 'spectator'
            ? 'Watching live'
            : (user.id === gameMetadata?.blackPlayer?.id ? 'b' : 'w') === chess.turn()
              ? 'Your turn'
              : "Opponent's turn"}
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
                              onClick={() => setSelectedTimeControl(timeControl.value)}
                              className={`rounded px-3 py-2 text-sm text-white transition-colors ${
                                selectedTimeControl === timeControl.value
                                  ? 'bg-green-600'
                                  : 'bg-bgAuxiliary2 hover:bg-bgAuxiliary1'
                              }`}
                            >
                              {timeControl.label}
                            </button>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            socket.send(
                              JSON.stringify({
                                type: INIT_GAME,
                                payload: {
                                  timeControl: selectedTimeControl,
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
