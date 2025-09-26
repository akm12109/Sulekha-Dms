

'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Truck,
  ClipboardList,
  Wrench,
  Calendar,
  Settings,
  UserCircle,
  PlusCircle,
  Route,
  GraduationCap,
  BookOpen,
  UserPlus,
  Briefcase,
} from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  disabled?: boolean;
  subItems?: NavItem[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'driver', 'parent', 'teacher', 'student'] },
  { href: '/approvals', label: 'Approvals', icon: UserPlus, roles: ['admin'] },
  { href: '/assignments', label: 'Assignments', icon: ClipboardList, roles: ['admin'] },
  { href: '/drivers', label: 'Drivers', icon: Users, roles: ['admin'] },
  { 
    href: '/vehicles', 
    label: 'Vehicles', 
    icon: Truck, 
    roles: ['admin'],
    subItems: [
      { href: '/vehicles/add', label: 'Add Vehicle', icon: PlusCircle, roles: ['admin'] },
    ]
  },
  { href: '/students', label: 'Students', icon: GraduationCap, roles: ['admin', 'teacher'] },
  { href: '/teachers', label: 'Teachers', icon: Briefcase, roles: ['admin'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['driver'] },
  { href: '/timetable', label: 'Timetable', icon: Calendar, roles: ['admin', 'driver', 'parent', 'student'], disabled: true },
  { href: '/profile', label: 'Profile', icon: UserCircle, roles: ['driver', 'parent', 'student'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin'], disabled: true },
];

export function MainNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <SidebarMenu>
      {filteredNavItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && !item.disabled;
        const linkHref = item.disabled ? "#" : `${item.href}?${searchParams.toString()}`;

        if (item.subItems) {
          return (
             <Collapsible key={item.label} defaultOpen={pathname.startsWith(item.href)}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton asChild href={linkHref} isActive={isActive} tooltip={item.label}>
                      <Link href={linkHref}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                </CollapsibleTrigger>
              </SidebarMenuItem>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.subItems.filter(sub => sub.roles.includes(role)).map(subItem => {
                    const isSubActive = pathname === subItem.href;
                    const subLinkHref = `${subItem.href}?${searchParams.toString()}`;
                    return (
                      <SidebarMenuSubItem key={subItem.label}>
                        <SidebarMenuSubButton asChild href={subLinkHref} isActive={isSubActive}>
                           <Link href={subLinkHref}>
                              <subItem.icon/>
                              <span>{subItem.label}</span>
                           </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        }

        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton asChild href={linkHref} isActive={isActive} tooltip={item.label} disabled={item.disabled}>
              <Link href={linkHref}>
                <item.icon />
                <span>{item.label} {item.disabled && <span className="text-xs text-muted-foreground">(soon)</span>}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
