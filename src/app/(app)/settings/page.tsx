import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Settings"
        description="Manage application settings."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Settings Page Coming Soon</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You will be able to manage system-wide settings here.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
