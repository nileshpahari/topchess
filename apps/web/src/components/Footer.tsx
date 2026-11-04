import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="mt-40 py-16 text-gray-400">
      <div className="w-[96%] max-w-screen-lg mx-auto flex flex-col items-center justify-center">
        <div>
          <Link href={"/"}>Home</Link> |
          <Link href={"/settings"}> Settings</Link> |
          <Link href={"/login"}> Login</Link> |
          <Link href={"/game/random"}> Play</Link>
        </div>
      </div>
    </footer>
  );
};
