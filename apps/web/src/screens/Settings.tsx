import type { ReactNode } from "react";

export const Settings = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="max-w-full mt-0">
      <h2 className="text-xl font-bold">Settings</h2>

      <div className="flex mt-8 gap-16">
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
