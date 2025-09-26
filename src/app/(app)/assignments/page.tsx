import { PageHeader } from '@/components/page-header';
import { AssignmentManager } from '@/components/assignment-manager';
import { getDrivers, getVehicles } from '@/lib/firebase/utils';

export default async function AssignmentsPage() {
  const initialDrivers = await getDrivers();
  const initialVehicles = await getVehicles();

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Driver-Vehicle Assignments"
        description="Assign vehicles to drivers and get AI-powered suggestions."
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <AssignmentManager initialDrivers={initialDrivers} initialVehicles={initialVehicles} />
      </main>
    </div>
  );
}
