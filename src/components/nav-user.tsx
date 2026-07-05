import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "src/features/auth/context/AuthContext"
import { AccountDialog } from "src/components/account-dialog"
import { useTranslation } from "src/hooks/useTranslation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "src/components/ui/sidebar"
import { EllipsisVerticalIcon, CircleUserRoundIcon, LogOutIcon, UserLock, User } from "lucide-react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const { logout, user: authUser } = useAuth()
  const navigate = useNavigate()
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const { t } = useTranslation()

  const handleLogout = () => {
    logout()
    navigate("/login", { replace: true })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="h-8 w-8 rounded-lg border border-[#0A422D]/20 bg-[#0A422D]/10 text-[#0A422D] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                {authUser?.role === 'admin' ? (
                  <UserLock className="size-4.5" />
                ) : (
                  <User className="size-4.5" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <EllipsisVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-1 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="h-8 w-8 rounded-lg border border-[#0A422D]/20 bg-[#0A422D]/10 text-[#0A422D] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                  {authUser?.role === 'admin' ? (
                     <UserLock className="size-4.5" />
                  ) : (
                    <User className="size-4.5" />
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="p-1">
              <DropdownMenuItem
                onClick={() => setIsAccountOpen(true)}
                className="cursor-pointer"
              >
                <CircleUserRoundIcon />
                {t('sidebar.account')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive px-3 py-2">
              <LogOutIcon
              />
              {t('sidebar.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <AccountDialog open={isAccountOpen} onOpenChange={setIsAccountOpen} />
    </SidebarMenu>
  )
}
