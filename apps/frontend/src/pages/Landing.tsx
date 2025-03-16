import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
export default function Landing() {
  const navigate = useNavigate();
  // const socket = useSocket();
  function clickHandler() {
    navigate("/game");
    // console.log(socket);
    // socket?.send(JSON.stringify({ type: "init_game" }));
    // socket?.send(
    //   JSON.stringify({ type: "move", payload: { from: "e2", to: "e4" } })
    // );
  }
  return (
    <div className="flex max-w-3/4 m-auto justify-around items-center p-8">
      <img src="/chessBoard.png" alt="Chess Board" className="w-190" />
      <div className="flex flex-col p-6">
        <h1 className="text-3xl font-bold text-center">
          Play Chess...
          <div className="m-4">Increase IQ!</div>
        </h1>
        <button
          onClick={clickHandler}
          className="text-2xl bg-green-600 px-25 py-8 rounded-lg "
        >
          Play <div className="text-sm">(As a guest)</div>
        </button>

        {/* Test start*/}
        <button
          className="text-2xl bg-green-600 px-25 py-8 rounded-lg mt-6"
          onClick={clickHandler}
        >
          Test
        </button>
        {/* Test end */}
      </div>
    </div>
  );
}
