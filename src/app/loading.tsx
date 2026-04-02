import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-transparent">
      <Loader2 className="animate-spin text-zinc-400 dark:text-zinc-500" size={32} />
    </div>
  );
}
