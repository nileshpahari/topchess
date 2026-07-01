import {
  type SerializableMove,
  setUserSelectedMoveIndex,
  toggleBoardFlipped,
} from '@repo/store/chessBoard';
import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@repo/store/hooks';
import {
  HandshakeIcon,
  FlagIcon,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const MovesTable = () => {
  const dispatch = useAppDispatch();
  const userSelectedMoveIndex = useAppSelector(
    (state) => state.chessBoard.userSelectedMoveIndex,
  );
  const moves = useAppSelector((state) => state.chessBoard.moves);
  const movesTableRef = useRef<HTMLInputElement>(null);
  const movesArray = moves.reduce((result, _, index: number, array: SerializableMove[]) => {
    if (index % 2 === 0) {
      result.push(array.slice(index, index + 2));
    }
    return result;
  }, [] as SerializableMove[][]);

  useEffect(() => {
    if (movesTableRef && movesTableRef.current) {
      movesTableRef.current.scrollTo({
        top: movesTableRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [moves]);
  return (
    <div className="text-[#C3C3C0] relative w-full ">
      <div
        className="text-sm h-[45vh] max-h-[45vh] overflow-y-auto"
        ref={movesTableRef}
      >
        {movesArray.map((movePairs: SerializableMove[], index: number) => {
          return (
            <div
              key={index}
              className={`w-full py-px px-4 font-bold items-stretch ${index % 2 !== 0 ? 'bg-[#2B2927]' : ''}`}
            >
              <div className="grid grid-cols-6 gap-16 w-4/5">
                <span className="text-[#C3C3C0] px-2 py-1.5">{`${index + 1}.`}</span>

                {movePairs.map((move: SerializableMove, movePairIndex: number) => {
                  const isLastIndex =
                    movePairIndex === movePairs.length - 1 &&
                    movesArray.length - 1 === index;
                  const isHighlighted =
                    userSelectedMoveIndex !== null
                      ? userSelectedMoveIndex === index * 2 + movePairIndex
                      : isLastIndex;
                  const { san } = move;

                  return (
                    <div
                      key={movePairIndex}
                      className={`col-span-2 cursor-pointer flex items-center w-full pl-1 ${isHighlighted ? 'bg-[#484644] rounded border-b-[#5A5858] border-b-[3px]' : ''}`}
                      onClick={() => {
                        dispatch(setUserSelectedMoveIndex(index * 2 + movePairIndex));
                      }}
                    >
                      <span className="text-[#C3C3C0]">{san}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {moves.length ? (
        <div className="w-full p-2 bg-[#20211D] flex items-center justify-between">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 hover:bg-[#32302E] rounded px-2.5 py-1">
              {<HandshakeIcon size={16} />}
              Draw
            </button>
            <button className="flex items-center gap-2 hover:bg-[#32302E] rounded px-2.5 py-1">
              {<FlagIcon size={16} />}
              Resign
            </button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => {
                dispatch(setUserSelectedMoveIndex(0));
              }}
              disabled={userSelectedMoveIndex === 0}
              className="hover:text-white"
              title="Go to first move"
            >
              <ChevronFirst />
            </button>

            <button
              onClick={() => {
                dispatch(
                  setUserSelectedMoveIndex(
                    userSelectedMoveIndex !== null
                      ? userSelectedMoveIndex - 1
                      : moves.length - 2,
                  ),
                );
              }}
              disabled={userSelectedMoveIndex === 0}
              className="hover:text-white"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => {
                dispatch(
                  setUserSelectedMoveIndex(
                    userSelectedMoveIndex !== null
                      ? userSelectedMoveIndex + 1 >= moves.length - 1
                      ? moves.length - 1
                      : userSelectedMoveIndex + 1
                    : null,
                  ),
                );
              }}
              disabled={userSelectedMoveIndex === null}
              className="hover:text-white"
            >
              <ChevronRight />
            </button>
            <button
              onClick={() => {
                dispatch(setUserSelectedMoveIndex(moves.length - 1));
              }}
              disabled={userSelectedMoveIndex === null}
              className="hover:text-white"
              title="Go to last move"
            >
              <ChevronLast />
            </button>
            <button
              onClick={() => {
                dispatch(toggleBoardFlipped());
              }}
              title="Flip the board"
            >
              <RefreshCw className="hover:text-white mx-2" size={18} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MovesTable;
