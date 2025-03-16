import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "../constants";
import Loader from "../components/Loader";
import ChessBoard from "../components/ChessBoard";

export default function Game() {
  const socket = useSocket();
  const [started, setStarted] = useState(false);
  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());

  useEffect(() => {
    if(!socket) return;

    // socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: INIT_GAME,
        })
      );
    // };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case INIT_GAME:
          setBoard(chess.board());
          setStarted(true);
          console.log("game started");
          break;
        case MOVE:
          chess.move(message.payload);
          setBoard(chess.board());
          console.log("move made");
          break;
        case GAME_OVER:
          alert("GAME OVER");
          console.log("game over");
          break;
      }
    };
  }, [socket]);

  if (!socket) return <Loader />;
  return (
    <div className="justify-center flex">
      <div className="pt-8 max-w-screen-lg w-full">
        <div className="grid grid-cols-6 gap-4 w-full">
          <div className="col-span-4 w-full flex justify-center">
            <ChessBoard
              chess={chess}
              setBoard={setBoard}
              socket={socket}
              board={board}
            />
          </div>
          <div className="col-span-2 bg-slate-900 w-full flex justify-center"></div>
        </div>
      </div>
    </div>
  );
}
