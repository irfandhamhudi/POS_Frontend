import * as React from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "src/features/auth/context/AuthContext"
import { NavUser } from "src/components/nav-user"
import { useTranslation } from "src/hooks/useTranslation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "src/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Settings2Icon,
  CircleHelpIcon,
  Users,
  Ticket,
  Clock,
  Armchair,
  BanknoteArrowUp ,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function AppSidebar({
  onSettingsClick,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onSettingsClick?: () => void
}) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSidebar()
  const { t } = useTranslation()

  const activeUser = {
    name: user?.name || "Administrator",
    email: user?.username === "admin" ? "admin@greengrounds.com" : "cashier@greengrounds.com",
    avatar: user?.avatar || "https://api.dicebear.com/9.x/avataaars/svg?seed=admin&backgroundColor=b6e3f4",
  }

  const navMain = [
    {
      title: t('sidebar.dashboard'),
      url: "/admin",
      icon: <LayoutDashboardIcon />,
      isActive: location.pathname === "/admin",
    },
    {
      title: t('sidebar.orders'),
      url: "/admin/orders",
      icon: <ShoppingBag />,
      isActive: location.pathname === "/admin/orders",
    },
    {
      title: t('sidebar.menuManagement'),
      url: "/admin/menu",
      icon: <UtensilsCrossed />,
      isActive: location.pathname === "/admin/menu",
    },
    {
      title: t('sidebar.reports'),
      url: "/admin/reports",
      icon: <BarChart3 />,
      isActive: location.pathname === "/admin/reports",
    },
    {
      title: t('sidebar.userManagement'),
      url: "/admin/users",
      icon: <Users />,
      isActive: location.pathname === "/admin/users",
    },
    {
      title: t('sidebar.salaryManagement', 'Gaji Karyawan'),
      url: "/admin/salary",
      icon: <BanknoteArrowUp />,
      isActive: location.pathname === "/admin/salary",
    },
    {
      title: t('sidebar.couponManagement', 'Coupons'),
      url: "/admin/coupons",
      icon: <Ticket />,
      isActive: location.pathname === "/admin/coupons",
    },
    {
      title: t('sidebar.shiftManagement', 'Shifts'),
      url: "/admin/shifts",
      icon: <Clock />,
      isActive: location.pathname === "/admin/shifts",
    },
    {
      title: t('sidebar.tableManagement', 'Tables'),
      url: "/admin/tables",
      icon: <Armchair />,
      isActive: location.pathname === "/admin/tables",
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:bg-transparent active:bg-transparent"
              asChild
            >
              <div className="flex items-center gap-2 px-1">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-[#0A422D] text-white shrink-0 transition-transform duration-200",
                  state === "collapsed" && "-translate-x-1.5 flex "
                )}>
                  <p className="text-md font-bold tracking-wider">G</p>
                </div>
                {state !== "collapsed" && (
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-bold text-[#0A422D] text-xs tracking-tight">GREEN GROUNDS</span>
                    <span className="text-[9px] text-[#0A422D]/60 tracking-wider font-bold">POS ADMIN V1</span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Custom main navigation with React Router Link integration */}
        <div className="px-2 py-2">
          <ul className="flex flex-col gap-1">
            {navMain.map((item) => (
              <li key={item.title}>
                <SidebarMenuButton
                  isActive={item.isActive}
                  tooltip={item.title}
                  onClick={() => navigate(item.url)}
                  className="cursor-pointer"
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto px-2 py-2">
          <ul className="flex flex-col gap-1">
            <li>
              <SidebarMenuButton
                tooltip={t('sidebar.settings')}
                onClick={onSettingsClick}
                className="cursor-pointer animate-fade-in"
              >
                <Settings2Icon />
                <span>{t('sidebar.settings')}</span>
              </SidebarMenuButton>
            </li>
            <li>
              <SidebarMenuButton
                tooltip={t('sidebar.getHelp')}
                onClick={() => navigate('/admin/help')}
                className={`cursor-pointer ${location.pathname === '/admin/help' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
              >
                <CircleHelpIcon />
                <span>{t('sidebar.getHelp')}</span>
              </SidebarMenuButton>
            </li>
          </ul>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={activeUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
