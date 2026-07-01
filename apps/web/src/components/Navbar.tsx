import { MobileSidebar } from '@/components/mobile-sidebar';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();
  return (
    <div className="supports-backdrop-blur:bg-background/60 fixed left-0 right-0 top-0 z-20 backdrop-blur md:hidden text-white">
      <nav className="flex h-16 items-center justify-between px-4">
        <div>
          <MobileSidebar />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={'ghost'}
            onClick={() => {
              router.push('/login');
            }}
          >
            Login
          </Button>
        </div>
      </nav>
    </div>
  );
}
