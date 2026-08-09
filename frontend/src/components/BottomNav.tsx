import React from 'react';
import {
  LayoutDashboard,
  TruckIcon,
  PackageCheck,
  Boxes,
  Clock,
  Menu,
  Receipt,
  Fuel,
  Video,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
}) => {
  const { role } = useApp();

  // Define role-optimized quick bottom bar actions
  const getQuickNavItems = () => {
    switch (role) {
      case 'DRIVER':
        return [
          { id: 'deliveries', label: 'Deliveries', icon: TruckIcon },
          { id: 'expenses', label: 'Fuel/Expenses', icon: Fuel },
          { id: 'camera', label: 'Camera', icon: Video },
          { id: 'attendance', label: 'Shift Clock', icon: Clock },
        ];
      case 'LOADMAN':
        return [
          { id: 'loading', label: 'Loading', icon: PackageCheck },
          { id: 'inventory', label: 'Inventory', icon: Boxes },
          { id: 'attendance', label: 'Shift Clock', icon: Clock },
        ];
      case 'GODOWN_KEEPER':
        return [
          { id: 'inventory', label: 'Inventory', icon: Boxes },
          { id: 'deliveries', label: 'Deliveries', icon: TruckIcon },
          { id: 'loading', label: 'Loading', icon: PackageCheck },
          { id: 'billing', label: 'Billing', icon: Receipt },
        ];
      default: // OWNER, MANAGER, STOREROOM_STAFF
        return [
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'deliveries', label: 'Deliveries', icon: TruckIcon },
          { id: 'inventory', label: 'Stock', icon: Boxes },
          { id: 'attendance', label: 'Attendance', icon: Clock },
        ];
    }
  };

  const items = getQuickNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md z-40 md:hidden px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400 scale-110' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5 font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Full Menu Launcher Button */}
        <button
          onClick={onOpenMobileMenu}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer min-w-[56px]"
        >
          <Menu className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] mt-0.5 font-semibold tracking-tight">Menu</span>
        </button>
      </div>
    </div>
  );
};
