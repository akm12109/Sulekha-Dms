import { Bus } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-primary/20 rounded-lg">
        <Bus className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-xl font-headline font-bold text-primary">
        Sulekha Devi Mission School
      </h1>
    </div>
  );
}
