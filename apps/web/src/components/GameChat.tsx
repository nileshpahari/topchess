import { FormEvent, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

export interface ChatMessage {
  id: string;
  gameId: string;
  senderId: string;
  senderUsername: string;
  message: string;
  createdAt: string;
}

interface GameChatProps {
  messages: ChatMessage[];
  canSend: boolean;
  currentUserId: string;
  onSend: (message: string) => void;
}

export function GameChat({ messages, canSend, currentUserId, onSend }: GameChatProps) {
  const [message, setMessage] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || !canSend) return;
    onSend(content);
    setMessage('');
  };

  return (
    <div className="flex h-[45vh] min-h-72 flex-col text-[#C3C3C0]">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3 no-scrollbar" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-sm text-[#C3C3C0]">
            {canSend ? 'No messages yet. Start the conversation.' : 'No player messages yet.'}
          </div>
        ) : (
          messages.map((item) => {
            const isMine = item.senderId === currentUserId;
            return (
              <div key={item.id} className={isMine ? 'text-right' : 'text-left'}>
                <p className="mb-1 text-xs text-[#A5A5A2]">{isMine ? 'You' : item.senderUsername}</p>
                <p className={`inline-block max-w-[85%] break-words rounded-md px-3 py-2 text-sm text-white ${isMine ? 'bg-green-700' : 'bg-[#484644]'}`}>
                  {item.message}
                </p>
              </div>
            );
          })
        )}
      </div>
      {canSend ? (
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-[#484644] p-3">
          <label htmlFor="game-chat-message" className="sr-only">Message your opponent</label>
          <input
            id="game-chat-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={300}
            autoComplete="off"
            placeholder="Message your opponent"
            className="min-h-10 min-w-0 flex-1 rounded-md border border-[#5A5858] bg-[#262522] px-3 text-sm text-white placeholder:text-[#A5A5A2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 items-center justify-center rounded-md bg-green-700 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <p className="border-t border-[#484644] px-4 py-3 text-center text-xs text-[#A5A5A2]">
          Spectators can read player chat.
        </p>
      )}
    </div>
  );
}
