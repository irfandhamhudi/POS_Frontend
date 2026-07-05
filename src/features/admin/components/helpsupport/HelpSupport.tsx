import React, { useState } from 'react'
import { useTranslation } from 'src/hooks/useTranslation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Users,
  Ticket,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  QrCode,
  ChefHat,
} from 'lucide-react'

const faqSections = [
  {
    iconKey: 'dashboard',
    items: [
      { qKey: 'dashboard.q1', aKey: 'dashboard.a1' },
      { qKey: 'dashboard.q2', aKey: 'dashboard.a2' },
    ],
  },
  {
    iconKey: 'orders',
    items: [
      { qKey: 'orders.q1', aKey: 'orders.a1' },
      { qKey: 'orders.q2', aKey: 'orders.a2' },
      { qKey: 'orders.q3', aKey: 'orders.a3' },
    ],
  },
  {
    iconKey: 'menu',
    items: [
      { qKey: 'menu.q1', aKey: 'menu.a1' },
      { qKey: 'menu.q2', aKey: 'menu.a2' },
    ],
  },
  {
    iconKey: 'reports',
    items: [
      { qKey: 'reports.q1', aKey: 'reports.a1' },
      { qKey: 'reports.q2', aKey: 'reports.a2' },
    ],
  },
  {
    iconKey: 'users',
    items: [
      { qKey: 'users.q1', aKey: 'users.a1' },
      { qKey: 'users.q2', aKey: 'users.a2' },
    ],
  },
  {
    iconKey: 'coupons',
    items: [
      { qKey: 'coupons.q1', aKey: 'coupons.a1' },
    ],
  },
  {
    iconKey: 'shifts',
    items: [
      { qKey: 'shifts.q1', aKey: 'shifts.a1' },
      { qKey: 'shifts.q2', aKey: 'shifts.a2' },
      { qKey: 'shifts.q3', aKey: 'shifts.a3' },
    ],
  },
  {
    iconKey: 'tables',
    items: [
      { qKey: 'tables.q1', aKey: 'tables.a1' },
      { qKey: 'tables.q2', aKey: 'tables.a2' },
    ],
  },
  {
    iconKey: 'kitchen',
    items: [
      { qKey: 'kitchen.q1', aKey: 'kitchen.a1' },
      { qKey: 'kitchen.q2', aKey: 'kitchen.a2' },
    ],
  },
]

const sectionIcons: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard className="size-4" />,
  orders: <ShoppingBag className="size-4" />,
  menu: <UtensilsCrossed className="size-4" />,
  reports: <BarChart3 className="size-4" />,
  users: <Users className="size-4" />,
  coupons: <Ticket className="size-4" />,
  shifts: <Clock className="size-4" />,
  tables: <QrCode className="size-4" />,
  kitchen: <ChefHat className="size-4" />,
}

const sectionColors: Record<string, string> = {
  dashboard: 'bg-[#0A422D]/10 text-[#0A422D]',
  orders: 'bg-amber-500/10 text-amber-600',
  menu: 'bg-purple-500/10 text-purple-600',
  reports: 'bg-blue-500/10 text-blue-600',
  users: 'bg-pink-500/10 text-pink-600',
  coupons: 'bg-orange-500/10 text-orange-600',
  shifts: 'bg-teal-500/10 text-teal-600',
  tables: 'bg-indigo-500/10 text-indigo-600',
  kitchen: 'bg-rose-500/10 text-rose-600',
}

export const HelpSupport: React.FC = () => {
  const { t } = useTranslation()
  const [openIndex, setOpenIndex] = useState<string | null>(null)

  const toggle = (key: string) => {
    setOpenIndex((prev) => (prev === key ? null : key))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('helpSupport.title', 'Help & Support')}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('helpSupport.subtitle', 'Find answers to common questions and get in touch with our support team.')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FAQ Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="size-5 text-[#0A422D]" />
            <h2 className="text-base font-bold text-foreground">
              {t('helpSupport.faqTitle', 'Frequently Asked Questions')}
            </h2>
          </div>

          {faqSections.map((section) => (
            <Card key={section.iconKey} className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sectionColors[section.iconKey]}`}>
                    {sectionIcons[section.iconKey]}
                  </div>
                  <CardTitle className="text-sm font-bold capitalize">
                    {t(`helpSupport.section.${section.iconKey}`, section.iconKey)}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-0">
                {section.items.map((item, idx) => {
                  const itemKey = `${section.iconKey}.${idx}`
                  const isOpen = openIndex === itemKey
                  return (
                    <div
                      key={idx}
                      className={`border-t border-border/40 ${idx === 0 ? 'border-t-0' : ''}`}
                    >
                      <button
                        onClick={() => toggle(itemKey)}
                        className="w-full flex items-center justify-between py-3 text-left cursor-pointer hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-md"
                      >
                        <span className="text-sm font-medium text-foreground pr-2">
                          {t(`helpSupport.${section.iconKey}.${item.qKey.split('.')[1]}`)}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="pb-3 px-2 -mx-2">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {t(`helpSupport.${section.iconKey}.${item.aKey.split('.')[1]}`)}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="size-5 text-[#0A422D]" />
            <h2 className="text-base font-bold text-foreground">
              {t('helpSupport.contactTitle', 'Contact Support')}
            </h2>
          </div>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('helpSupport.contactDesc', 'Need more help? Reach out to our support team through the following channels.')}
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground mt-0.5">support@greengrounds.com</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{t('helpSupport.emailDesc', 'Response within 24 hours')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="w-9 h-9 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">WhatsApp</p>
                    <p className="text-xs text-muted-foreground mt-0.5">+62 812-3456-7890</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{t('helpSupport.phoneDesc', 'Available Mon-Sat, 08:00 - 21:00')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('helpSupport.helpdeskTitle', 'Helpdesk')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('helpSupport.helpdeskDesc', 'Visit our helpdesk at the main office for on-site technical assistance.')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#0A422D]/20 bg-[#0A422D]/5 dark:border-green-500/20 dark:bg-green-950/20 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0A422D]/10 text-[#0A422D] flex items-center justify-center shrink-0">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0A422D] dark:text-green-400">
                    {t('helpSupport.tipsTitle', 'Quick Tips')}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[#0A422D]/80 dark:text-green-400/80">
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#0A422D]/50 dark:bg-green-400/50 shrink-0" />
                      {t('helpSupport.tip1', 'Use the sidebar to navigate between admin features.')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#0A422D]/50 dark:bg-green-400/50 shrink-0" />
                      {t('helpSupport.tip2', 'Check the Reports page for daily sales analytics.')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#0A422D]/50 dark:bg-green-400/50 shrink-0" />
                      {t('helpSupport.tip3', 'Manage shifts to track cashier performance.')}
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="mt-1 w-1 h-1 rounded-full bg-[#0A422D]/50 dark:bg-green-400/50 shrink-0" />
                      {t('helpSupport.tip4', 'Create coupons to offer discounts to customers.')}
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
