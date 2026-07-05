import React, { useMemo, useState, useEffect } from 'react'
import api from 'src/api'
import { useTranslation } from '../../../../hooks/useTranslation'
import { SalesCharts } from './SalesCharts';
import { Calendar } from 'lucide-react'

// Subcomponents
import { DashboardStats } from './DashboardStats'
import { HourlySalesChart } from './HourlySalesChart'
import { PerformanceScore } from './PerformanceScore'
import { RecentTransactions } from './RecentTransactions'
import { ItemsPerformance } from './ItemsPerformance'

const HOURLY_DATA = [
  { time: '8 AM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '9 AM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '10 AM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '11 AM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '12 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '1 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '2 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '3 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '4 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '5 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '6 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '7 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '8 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
  { time: '9 PM', coffee: 0, tea: 0, snack: 0, main: 0 },
]

const getTodayDateString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayMonthString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}


export const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation()

  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [reportMode, setReportMode] = useState<'today' | 'day' | 'month'>('today')
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString)
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayMonthString)

  const todayDateString = getTodayDateString()
  const todayMonthString = getTodayMonthString()

  const dateRange = useMemo(() => {
    let startDate: Date
    let endDate: Date

    if (reportMode === 'today') {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      startDate = todayStart
      endDate = todayEnd
    } else if (reportMode === 'day') {
      const parsedDate = new Date(selectedDate)
      if (isNaN(parsedDate.getTime())) {
        const fallback = new Date()
        fallback.setHours(0, 0, 0, 0)
        startDate = fallback
        endDate = new Date(fallback)
        endDate.setHours(23, 59, 59, 999)
      } else {
        startDate = new Date(parsedDate)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(parsedDate)
        endDate.setHours(23, 59, 59, 999)
      }
    } else {
      const [yearStr, monthStr] = selectedMonth.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1

      startDate = new Date(year, month, 1, 0, 0, 0, 0)
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  }, [reportMode, selectedDate, selectedMonth])

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        const response = await api.get('/dashboard', {
          params: {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
          }
        })
        if (response.data.success) {
          setDashboardData(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [dateRange])

  const totalRevenue = dashboardData?.stats?.totalRevenue ?? 0
  const totalCashouts = dashboardData?.stats?.totalCashouts ?? 0
  const netRevenue = totalRevenue - totalCashouts
  const todaySales = dashboardData?.stats?.todaySales ?? 0
  const onProgress = dashboardData?.stats?.onProgress ?? 0
  const avgOrder = dashboardData?.stats?.avgOrder ?? 0

  const radarData = dashboardData?.radarData ?? []

  const recentTransactions = useMemo(() => {
    const rawList = dashboardData?.recentTransactions ?? []
    return rawList.map((tx: any) => ({
      id: tx.receiptNumber,
      customerName: tx.customerName,
      orderType: tx.orderType,
      tableNumber: tx.tableNumber,
      total: tx.total
    }))
  }, [dashboardData])

  const hourlyChartData = useMemo(() => {
    const rawData = dashboardData?.hourlyData ?? HOURLY_DATA
    const isId = i18n.language === 'id'
    if (!isId) return rawData

    const timeMap: Record<string, string> = {
      '8 AM': '08:00',
      '9 AM': '09:00',
      '10 AM': '10:00',
      '11 AM': '11:00',
      '12 PM': '12:00',
      '1 PM': '13:00',
      '2 PM': '14:00',
      '3 PM': '15:00',
      '4 PM': '16:00',
      '5 PM': '17:00',
      '6 PM': '18:00',
      '7 PM': '19:00',
      '8 PM': '20:00',
      '9 PM': '21:00',
    }

    return rawData.map((item: any) => ({
      ...item,
      time: timeMap[item.time] || item.time,
    }))
  }, [dashboardData, i18n.language])

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Integrated Date Filters */}
      <div className="pb-4 border-b border-border/40 flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('adminDashboard.title', 'Dashboard')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('adminDashboard.subtitle', 'Ringkasan data penjualan, performa menu, dan aktivitas kasir.')}
          </p>
        </div>

        {/* Controls: Mode Selectors + Date Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented Controller (Pill style) */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setReportMode('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${reportMode === 'today'
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t('adminDashboard.today', 'Hari Ini')}
            </button>
            <button
              onClick={() => setReportMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${reportMode === 'day'
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t('adminDashboard.daily', 'Harian')}
            </button>
            <button
              onClick={() => setReportMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${reportMode === 'month'
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {t('adminDashboard.monthly', 'Bulanan')}
            </button>
          </div>

          {/* Dynamic input/info based on active mode */}
          <div className="flex items-center gap-2">
            {reportMode === 'today' && (
              <span className="text-[11px] text-[#0A422D] dark:text-[#4ADE80] bg-[#0A422D]/8 dark:bg-[#4ADE80]/8 px-3 py-2 rounded-lg font-extrabold flex items-center gap-1.5 border border-[#0A422D]/15 dark:border-[#4ADE80]/15">
                <Calendar className="size-3.5" />
                {new Date().toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}

            {reportMode === 'day' && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value
                  if (val > todayDateString) {
                    setSelectedDate(todayDateString)
                  } else {
                    setSelectedDate(val)
                  }
                }}
                max={todayDateString}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#0A422D] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm max-w-[140px]"
              />
            )}

            {reportMode === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => {
                  const val = e.target.value
                  if (val > todayMonthString) {
                    setSelectedMonth(todayMonthString)
                  } else {
                    setSelectedMonth(val)
                  }
                }}
                max={todayMonthString}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#0A422D] bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-sm max-w-[140px]"
              />
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6 w-full animate-pulse">
          {/* Stat Cards Skeleton */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            ))}
          </div>

          {/* Charts Row Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg lg:col-span-2" />
            <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>

          {/* Bottom Row Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg lg:col-span-2" />
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          {/* Row 1: Stat Cards */}
          <DashboardStats
            netRevenue={netRevenue}
            todaySales={todaySales}
            onProgress={onProgress}
            avgOrder={avgOrder}
          />

          {/* Row 2: Sales Chart + Score Circular Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HourlySalesChart hourlyChartData={hourlyChartData} />
            <PerformanceScore todaySales={todaySales} transactions={dashboardData?.transactions || []} />
          </div>

          {/* Row 3: Recent Transactions + Radar chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RecentTransactions recentTransactions={recentTransactions} />
            <ItemsPerformance radarData={radarData} />
          </div>

          {/* Sales Charts */}
          <SalesCharts
            transactions={dashboardData?.transactions || []}
            reportMode={reportMode}
            selectedDate={selectedDate}
            selectedMonth={selectedMonth}
          />
        </>
      )}
    </div>
  )
}
