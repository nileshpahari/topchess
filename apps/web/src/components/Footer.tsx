import {
  GitHubLogoIcon,
  VideoIcon,
  TwitterLogoIcon,
} from '@radix-ui/react-icons';
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
        <div>
          <div className="flex gap-3 mt-4">
            <a href="https://github.com/hkirat" target="_blank">
              <GitHubLogoIcon />
            </a>
            <a href="https://www.youtube.com/@harkirat1" target="_blank">
              <VideoIcon />
            </a>
            <a href="https://twitter.com/kirat_tw" target="_blank">
              <TwitterLogoIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
