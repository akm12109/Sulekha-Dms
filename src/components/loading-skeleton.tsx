import { Loader2 } from 'lucide-react';

export function LoadingSkeleton({ message }: { message?: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      {message && <p className="text-lg text-muted-foreground">{message}</p>}
    </div>
  );
}
