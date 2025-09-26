import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function TimetablePage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Timetable"
        description="View schedules and activities."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Timetable Feature Coming Soon</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Stay tuned for schedule and activity updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
