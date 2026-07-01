import { PlayCard } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { OngoingGames } from '@/components/OngoingGames';

export const Landing = () => {
  return (
    <>
      <div className="max-w-full mt-0">
        <div className="flex flex-col md:flex-row w-full gap-x-16">
          <img
            className="rounded-md w-full h-[650px] hidden md:block"
            src="https://www.chess.com/bundles/web/images/offline-play/standardboard.1d6f9426.png"
            alt="chess-board"
          />
          <PlayCard />
        </div>
      </div>
      <OngoingGames />
      <div className="mt-32 bg-bgAuxiliary2 text-textMain w-full px-14 py-14 rounded-[36px]">
        <div className="lg:grid grid-cols-[45%,1fr] gap-28">
            <div className="rounded-xl">
                <img src="https://res.cloudinary.com/dcugqfvvg/image/upload/v1713657312/undraw_questions_re_1fy7_kqjpu3.svg" alt="chess-board" />
            </div>
            <div className="mt-16 lg:mt-0">
                <h1 className="text-6xl font-bold text-left mt-[-10px]">Found an Issue!</h1>
                <p className="text-xl mt-6">Please create an issue in our github website below. You are also invited to contribute on the project.</p>
                <a
                    href="https://github.com/nileshpahari/topchess/issues"
                    target="_blank"
                    className="mt-10 rounded-2xl px-4 py-4 border border-slate-400 bg-transparent w-full text-2xl flex gap-10 items-center justify-center"
                    >
                    <img className="w-16 h-16" src="https://res.cloudinary.com/dcugqfvvg/image/upload/v1713657100/github-svgrepo-com_uosbko.svg" alt="icon"/>
                    <p className="text-4xl">Github</p>
                </a>
            </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
