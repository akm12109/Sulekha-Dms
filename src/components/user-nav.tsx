'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRole } from "@/hooks/use-role"
import { LogOut, User, ChevronUp } from "lucide-react"
import Link from "next/link"

export function UserNav() {
  const role = useRole();
  
  const getUserDetails = () => {
    switch (role) {
      case 'admin':
        return { name: 'Admin User', email: 'admin@sdm.in', avatar: 'https://picsum.photos/seed/admin/100/100' };
      case 'driver':
        return { name: 'Driver User', email: 'driver@sdm.in', avatar: 'https://picsum.photos/seed/driver1/100/100' };
      case 'parent':
        return { name: 'Parent User', email: 'parent@sdm.in', avatar: 'https://picsum.photos/seed/parent1/100/100' };
      case 'teacher':
        return { name: 'Teacher User', email: 'teacher@sdm.in', avatar: 'https://picsum.photos/seed/teacher1/100/100' };
      case 'student':
        return { name: 'Student User', email: 'student@sdm.in', avatar: 'https://picsum.photos/seed/student1/100/100' };
      default:
        return { name: 'Guest', email: '', avatar: '' };
    }
  };

  const userDetails = getUserDetails();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-14 w-full justify-start gap-2 px-2 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userDetails.avatar} alt={userDetails.name} data-ai-hint="person portrait" />
            <AvatarFallback>{role.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start truncate group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium leading-none">{userDetails.name}</p>
            <p className="text-xs leading-none text-muted-foreground capitalize">{role}</p>
          </div>
          <ChevronUp className="ml-auto h-4 w-4 shrink-0 group-data-[collapsible=icon]:hidden" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userDetails.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userDetails.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
             <Link href={`/profile?role=${role}`}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
