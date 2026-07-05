import React, { useMemo } from 'react'
import { useTranslation } from '../../../../hooks/useTranslation'
import { formatCurrency } from 'src/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { Transaction } from '../../../order/types'
import { TrendingUp, CalendarDays, CalendarClock } from 'lucide-react'

const CustomTooltip: React.FC<any> = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1C1C19] border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-md text-xs flex flex-col gap-1 text-left">
        <p className="font-extrabold text-foreground">{label}</p>
        <div className="border-t border-zinc-100 dark:border-[#2D2D2A] mt-1 pt-1 flex justify-between gap-4">
          <span className="text-zinc-400 font-medium">{t('salesCharts.salesLabel', 'Sales')}</span>
          <span className="font-black text-[#0A422D] dark:text-[#4ADE80]">
            {formatCurrency(Number(payload[0].value))}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

interface SalesChartsProps {
  transactions: Transaction[]
  reportMode: 'today' | 'day' | 'month'
  selectedDate: string
  selectedMonth: string
}

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const SalesCharts: React.FC<SalesChartsProps> = ({ 
  transactions,
  reportMode,
  selectedDate,
  selectedMonth,
}) => {
  const { t, i18n } = useTranslation()

  const endDate = useMemo(() => {
    if (reportMode === 'today') return new Date()
    if (reportMode === 'day') return new Date(selectedDate)
    
    // For 'month'
    const [yearStr, monthStr] = selectedMonth.split('-')
    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)
    const lastDay = new Date(year, month, 0) // last day of selectedMonth
    const today = new Date()
    // If it's the current month, don't show future days beyond today
    if (today.getFullYear() === year && today.getMonth() === month - 1) {
      return today
    }
    return lastDay
  }, [reportMode, selectedDate, selectedMonth])

  const formattedDate = useMemo(() => {
    if (reportMode === 'today') return ''
    if (reportMode === 'day') {
      const d = new Date(selectedDate)
      return d.toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
      })
    }
    // month
    const [yearStr, monthStr] = selectedMonth.split('-')
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1)
    return d.toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
      month: 'long',
      year: 'numeric',
    })
  }, [reportMode, selectedDate, selectedMonth, i18n.language])

  const hourlyData = useMemo(() => {
    const isId = i18n.language === 'id'
    const slots = [
      { hour: '08:00', labelEn: '8 AM', labelId: '08:00', sales: 0 },
      { hour: '09:00', labelEn: '9 AM', labelId: '09:00', sales: 0 },
      { hour: '10:00', labelEn: '10 AM', labelId: '10:00', sales: 0 },
      { hour: '11:00', labelEn: '11 AM', labelId: '11:00', sales: 0 },
      { hour: '12:00', labelEn: '12 PM', labelId: '12:00', sales: 0 },
      { hour: '13:00', labelEn: '1 PM', labelId: '13:00', sales: 0 },
      { hour: '14:00', labelEn: '2 PM', labelId: '14:00', sales: 0 },
      { hour: '15:00', labelEn: '3 PM', labelId: '15:00', sales: 0 },
      { hour: '16:00', labelEn: '4 PM', labelId: '16:00', sales: 0 },
      { hour: '17:00', labelEn: '5 PM', labelId: '17:00', sales: 0 },
      { hour: '18:00', labelEn: '6 PM', labelId: '18:00', sales: 0 },
      { hour: '19:00', labelEn: '7 PM', labelId: '19:00', sales: 0 },
      { hour: '20:00', labelEn: '8 PM', labelId: '20:00', sales: 0 },
      { hour: '21:00', labelEn: '9 PM', labelId: '21:00', sales: 0 },
    ]

    const filterDateStr = reportMode === 'today' 
      ? getLocalDateString(new Date())
      : reportMode === 'day'
        ? selectedDate
        : selectedMonth

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return

      const txDateStr = tx.createdAt || tx.date
      if (!txDateStr) return

      const txDate = new Date(txDateStr)
      if (isNaN(txDate.getTime())) return

      const txDateOnly = getLocalDateString(txDate)
      
      // Filter based on reportMode
      if (reportMode === 'month') {
        if (!txDateOnly.startsWith(filterDateStr)) return
      } else {
        if (txDateOnly !== filterDateStr) return
      }

      const txHour = txDate.getHours()
      const slot = slots.find((s) => {
        const slotHour = parseInt(s.hour.split(':')[0], 10)
        return slotHour === txHour
      })
      if (slot) {
        slot.sales += tx.total
      }
    })

    return slots.map((slot) => ({
      time: isId ? slot.labelId : slot.labelEn,
      sales: slot.sales,
    }))
  }, [transactions, reportMode, selectedDate, selectedMonth, i18n.language])

  const weeklyData = useMemo(() => {
    const days: { label: string; dateKey: string; sales: number }[] = []
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
    const dayNames = dayKeys.map((k) => t(`salesCharts.days.${k}`))

    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate)
      d.setDate(d.getDate() - i)
      const dateKey = getLocalDateString(d)
      days.push({
        label: dayNames[d.getDay()],
        dateKey,
        sales: 0,
      })
    }

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return
      const txDateStr = tx.createdAt || tx.date
      if (!txDateStr) return

      const txDate = new Date(txDateStr)
      if (isNaN(txDate.getTime())) return

      const txDateKey = getLocalDateString(txDate)
      const match = days.find((d) => d.dateKey === txDateKey)
      if (match) {
        match.sales += tx.total
      }
    })

    return days.map((d) => ({
      day: d.label,
      sales: d.sales,
    }))
  }, [transactions, endDate, i18n.language])

  const monthlyData = useMemo(() => {
    const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const
    const monthLabels = monthKeys.map((k) => t(`salesCharts.months.${k}`))
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth()

    const months: { label: string; monthIdx: number; year: number; sales: number }[] = []
    for (let i = 11; i >= 0; i--) {
      let m = endMonth - i
      let y = endYear
      if (m < 0) { m += 12; y -= 1 }
      months.push({
        label: `${monthLabels[m]}`,
        monthIdx: m,
        year: y,
        sales: 0,
      })
    }

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return
      const txDateStr = tx.createdAt || tx.date
      if (!txDateStr) return

      const txDate = new Date(txDateStr)
      if (isNaN(txDate.getTime())) return

      const txMonth = txDate.getMonth()
      const txYear = txDate.getFullYear()
      const match = months.find((m) => m.monthIdx === txMonth && m.year === txYear)
      if (match) {
        match.sales += tx.total
      }
    })

    return months.map((m) => ({
      month: m.label,
      sales: m.sales,
    }))
  }, [transactions, endDate, i18n.language])

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toString()
  }



  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Hourly Sales - Today */}
      <Card className="lg:col-span-1 shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-foreground">
            {reportMode === 'today'
              ? t('salesCharts.hourlyTitleToday', 'Hourly Sales (Today)')
              : reportMode === 'day'
              ? t('salesCharts.hourlyTitleDaily', { date: formattedDate, defaultValue: `Hourly Sales (${formattedDate})` })
              : t('salesCharts.hourlyTitleMonthly', { month: formattedDate, defaultValue: `Hourly Sales (${formattedDate})` })}
          </CardTitle>
          <div className="p-2 bg-[#0A422D]/10 rounded-lg text-[#0A422D]">
            <TrendingUp className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-neutral-800" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} interval={1} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#0A422D"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#0A422D', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0A422D', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Sales - Last 7 Days */}
      <Card className="lg:col-span-1 shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-foreground">
            {t('salesCharts.weeklyTitle', 'Weekly Sales (7 Days)')}
          </CardTitle>
          <div className="p-2 bg-[#0A422D]/10 rounded-lg text-[#0A422D]">
            <CalendarDays className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-neutral-800" />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Bar dataKey="sales" fill="#0A422D" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Sales - 12 Months */}
      <Card className="lg:col-span-1 shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-bold text-foreground">
            {t('salesCharts.monthlyTitle', 'Monthly Sales (12 Months)')}
          </CardTitle>
          <div className="p-2 bg-[#0A422D]/10 rounded-lg text-[#0A422D]">
            <CalendarClock className="size-4" />
          </div>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-neutral-800" />
              <XAxis dataKey="month" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Bar dataKey="sales" fill="#0A422D" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
