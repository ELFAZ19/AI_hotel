import { UtensilsCrossed } from 'lucide-react';
import EmptyState from '../../components/shared/EmptyState';

export default function RestaurantManagePage() {
  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Restaurant Management</h1>
        <p className="text-gray-500 mt-1">Manage menus, tables, and dining reservations.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
        <EmptyState 
          icon={UtensilsCrossed}
          title="Module Under Construction"
          description="The restaurant management module is planned for Phase 2 of the application development."
        />
      </div>
    </div>
  );
}
