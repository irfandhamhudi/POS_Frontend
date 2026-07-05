import React, { useMemo, useState, useEffect } from 'react'
import type { Transaction } from 'src/features/order/types'
import { formatCurrency } from 'src/lib/utils'
import { ExportExcelButton } from 'src/features/report/components/ExportExcelButton'
import { useTranslation } from '../../../../hooks/useTranslation'
import api from 'src/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  QrCode,
  Utensils,
  Calendar,
  Award,
  Globe,
} from 'lucide-react'

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

export const ReportManagement: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([])
  const [loadingLocalTransactions, setLoadingLocalTransactions] = useState(true)
  const [cashouts, setCashouts] = useState<{ amount: number; description: string; createdAt: string }[]>([])

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

  const fetchFilteredData = async () => {
    setLoadingLocalTransactions(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }

      const txRes = await api.get('/transactions', { params })
      if (txRes.data.success) {
        setLocalTransactions(txRes.data.data.map((tx: any) => ({
          _id: tx._id,
          id: tx.receiptNumber,
          items: tx.items.map((i: any) => ({
            product: {
              id: i.product?._id || 'unknown',
              name: i.product?.name || 'Unknown Product',
              price: i.product?.price || 0,
              image: i.product?.image || '',
              category: i.product?.category || 'uncategorized',
              available: true,
              stockCount: 0
            },
            quantity: i.quantity,
            size: i.size,
            notes: i.notes
          })),
          subtotal: tx.subtotal,
          tax: tx.tax,
          total: tx.total,
          orderType: tx.orderType,
          customerName: tx.customerName,
          tableNumber: tx.tableNumber || 'N/A',
          timestamp: new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(tx.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          paymentMethod: tx.paymentMethod,
          amountPaid: tx.amountPaid,
          change: tx.change,
          status: tx.status,
          cancelReason: tx.cancelReason || '',
          couponCode: tx.couponCode || '',
          discount: tx.discount || 0,
          shift: tx.shift,
          createdAt: tx.createdAt,
        })))
      }

      const coRes = await api.get('/shifts/cashouts/today', { params })
      if (coRes.data.success) {
        setCashouts(coRes.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch filtered report data:', err)
    } finally {
      setLoadingLocalTransactions(false)
    }
  }

  useEffect(() => {
    fetchFilteredData()
  }, [dateRange])

  // Automatic reset on day change (00:00 reset)
  useEffect(() => {
    let currentDay = new Date().getDate();
    const checkDayChange = setInterval(() => {
      const newDay = new Date().getDate();
      if (newDay !== currentDay) {
        currentDay = newDay;
        if (reportMode === 'today') {
          fetchFilteredData();
        }
      }
    }, 30000);

    return () => clearInterval(checkDayChange);
  }, [reportMode, dateRange]);

  const transactions = localTransactions

  const exportLabels = useMemo(() => {
    const isId = i18n.language === 'id'
    if (reportMode === 'today') {
      return {
        dateLabel: isId ? 'Hari Ini' : 'Today',
        filenameLabel: 'Today'
      }
    } else if (reportMode === 'day') {
      const dateObj = new Date(selectedDate)
      if (isNaN(dateObj.getTime())) return {}

      const day = dateObj.getDate()
      const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const month = isId ? monthsId[dateObj.getMonth()] : monthsEn[dateObj.getMonth()]
      const year = dateObj.getFullYear()

      return {
        dateLabel: `${day} ${month} ${year}`,
        filenameLabel: selectedDate
      }
    } else {
      const [yearStr, monthStr] = selectedMonth.split('-')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10) - 1

      const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const monthLabel = isId ? monthsId[month] : monthsEn[month]

      return {
        dateLabel: `${monthLabel} ${year}`,
        filenameLabel: selectedMonth
      }
    }
  }, [reportMode, selectedDate, selectedMonth, i18n.language])

  // 1. Calculations & Summaries
  const totalRevenue = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      return tx.status === 'cancelled' ? sum : sum + tx.total
    }, 0)
  }, [transactions])

  const completedOrders = useMemo(() => {
    return transactions.filter(tx => tx.status !== 'cancelled').length
  }, [transactions])

  const cancelledOrders = useMemo(() => {
    return transactions.filter(tx => tx.status === 'cancelled').length
  }, [transactions])

  const totalCashouts = useMemo(() => cashouts.reduce((s, c) => s + c.amount, 0), [cashouts])
  const netRevenue = totalRevenue - totalCashouts

  const averageOrderValue = useMemo(() => {
    return completedOrders > 0 ? totalRevenue / completedOrders : 0
  }, [completedOrders, totalRevenue])

  // 2. Payment Method distribution
  const paymentBreakdown = useMemo(() => {
    const counts = {
      cash: { count: 0, amount: 0 },
      qris: { count: 0, amount: 0 },
    }

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return
      const method = (tx.paymentMethod?.toLowerCase() || 'cash') as 'cash' | 'qris'
      if (counts[method]) {
        counts[method].count += 1
        counts[method].amount += tx.total
      }
    })

    const totalAmount = Object.values(counts).reduce((s, c) => s + c.amount, 0)

    return Object.entries(counts).map(([method, data]) => ({
      method: method === 'qris' ? 'QRIS' : method.charAt(0).toUpperCase() + method.slice(1),
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
    }))
  }, [transactions])

  // 3. Order Type distribution
  const orderTypeBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; amount: number }> = {
      dine_in: { count: 0, amount: 0 },
      take_away: { count: 0, amount: 0 },
      order_online: { count: 0, amount: 0 },
    }

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return
      const type = tx.orderType || 'dine_in'
      if (!counts[type]) {
        counts[type] = { count: 0, amount: 0 }
      }
      counts[type].count += 1
      counts[type].amount += tx.total
    })

    const totalAmount = Object.values(counts).reduce((s, c) => s + c.amount, 0)

    return Object.entries(counts).map(([type, data]) => ({
      type: type === 'dine_in' ? 'Dine In' : type === 'take_away' ? 'Takeaway' : type === 'order_online' ? 'Order Online' : type,
      count: data.count,
      amount: data.amount,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
    }))
  }, [transactions])

  // 4. Hourly Sales peak timeline
  const hourlyData = useMemo(() => {
    const isId = i18n.language === 'id'
    const slots = [
      { hour: '08:00', labelEn: '8 AM', labelId: '08:00', amount: 0 },
      { hour: '09:00', labelEn: '9 AM', labelId: '09:00', amount: 0 },
      { hour: '10:00', labelEn: '10 AM', labelId: '10:00', amount: 0 },
      { hour: '11:00', labelEn: '11 AM', labelId: '11:00', amount: 0 },
      { hour: '12:00', labelEn: '12 PM', labelId: '12:00', amount: 0 },
      { hour: '13:00', labelEn: '1 PM', labelId: '13:00', amount: 0 },
      { hour: '14:00', labelEn: '2 PM', labelId: '14:00', amount: 0 },
      { hour: '15:00', labelEn: '3 PM', labelId: '15:00', amount: 0 },
      { hour: '16:00', labelEn: '4 PM', labelId: '16:00', amount: 0 },
      { hour: '17:00', labelEn: '5 PM', labelId: '17:00', amount: 0 },
      { hour: '18:00', labelEn: '6 PM', labelId: '18:00', amount: 0 },
      { hour: '19:00', labelEn: '7 PM', labelId: '19:00', amount: 0 },
      { hour: '20:00', labelEn: '8 PM', labelId: '20:00', amount: 0 },
      { hour: '21:00', labelEn: '9 PM', labelId: '21:00', amount: 0 },
    ]

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return

      let txHour: number | null = null

      if (tx.createdAt) {
        const txDate = new Date(tx.createdAt)
        if (!isNaN(txDate.getTime())) {
          txHour = txDate.getHours()
        }
      }

      if (txHour === null && tx.timestamp) {
        // Fallback to parsing timestamp string
        const isPM = tx.timestamp.toLowerCase().includes('pm')
        const isAM = tx.timestamp.toLowerCase().includes('am')
        const cleanedTime = tx.timestamp.replace(/[^0-9:.]/g, '')
        const timeParts = cleanedTime.includes(':') ? cleanedTime.split(':') : cleanedTime.split('.')
        if (timeParts.length > 0) {
          let hr = parseInt(timeParts[0], 10)
          if (!isNaN(hr)) {
            if (isPM && hr < 12) hr += 12
            if (isAM && hr === 12) hr = 0
            txHour = hr
          }
        }
      }

      if (txHour !== null) {
        const hourVal = txHour
        const slot = slots.find((s) => {
          const slotHour = parseInt(s.hour.split(':')[0], 10)
          return slotHour === hourVal
        })
        if (slot) {
          slot.amount += Number(tx.total) || 0
        }
      }
    })

    return slots.map((slot) => ({
      time: isId ? slot.labelId : slot.labelEn,
      sales: slot.amount,
    }))
  }, [transactions, i18n.language])

  // 5. Category distribution
  const categorySales = useMemo(() => {
    const counts: Record<string, { name: string; sales: number; qty: number }> = {
      coffee: { name: 'Coffee', sales: 0, qty: 0 },
      tea: { name: 'Tea', sales: 0, qty: 0 },
      snack: { name: 'Snack', sales: 0, qty: 0 },
      main_course: { name: 'Main Course', sales: 0, qty: 0 },
    }

    transactions.forEach((tx) => {
      if (tx.status === 'cancelled') return
      tx.items.forEach((item) => {
        const cat = item.product.category
        const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0
        const price = item.product.price + sizePriceModifier
        if (counts[cat]) {
          counts[cat].sales += price * item.quantity
          counts[cat].qty += item.quantity
        }
      })
    })

    return Object.values(counts).map(c => {
      const catKey = c.name.toLowerCase().replace(' ', '_');
      return {
        ...c,
        name: t(`menuManagement.categories.${catKey}`, c.name),
        displaySales: formatCurrency(c.sales)
      };
    })
  }, [t, transactions])

  // 6. Top selling items list
  const popularItemsList = useMemo(() => {
    const itemPopularity: Record<string, { name: string; category: string; qty: number; revenue: number }> = {}

    transactions.forEach((tx) => {
      tx.items.forEach((item) => {
        const id = item.product.id
        const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0
        const unitPrice = item.product.price + sizePriceModifier

        if (itemPopularity[id]) {
          itemPopularity[id].qty += item.quantity
          itemPopularity[id].revenue += tx.status === 'cancelled' ? 0 : unitPrice * item.quantity
        } else {
          itemPopularity[id] = {
            name: item.product.name,
            category: item.product.category,
            qty: item.quantity,
            revenue: tx.status === 'cancelled' ? 0 : unitPrice * item.quantity,
          }
        }
      })
    })

    const list = Object.values(itemPopularity)
    return list.sort((a, b) => b.qty - a.qty)
  }, [transactions])

  const formatDateTime = (dateStr: string) => {
    const isId = i18n.language === 'id'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'

    const day = date.getDate()
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const monthsId = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    const month = isId ? monthsId[date.getMonth()] : monthsEn[date.getMonth()]
    const year = date.getFullYear()

    if (isId) {
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${day} ${month} ${year}, ${hours}:${minutes} WIB`
    } else {
      let hours = date.getHours()
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours ? hours : 12
      return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`
    }
  }

  // Simple formatter for Recharts Y-axis
  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
    return value.toString()
  }

  // Handle loading state
  const isLoading = loadingLocalTransactions

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-9 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          ))}
        </div>

        {/* Charts Row 1 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="flex flex-col gap-6">
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
        </div>

        {/* Charts Row 2 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          <div className="lg:col-span-2 h-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Integrated Date Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('reportManagement.title', 'Reports & Analytics')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('reportManagement.subtitle', 'Monitor transaction metrics, product sales and payment distribution')}
          </p>
        </div>

        {/* Controls: Mode Selectors + Date Inputs + Export Button */}
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
              {i18n.language === 'id' ? 'Hari Ini' : 'Today'}
            </button>
            <button
              onClick={() => setReportMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${reportMode === 'day'
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {i18n.language === 'id' ? 'Harian' : 'Daily'}
            </button>
            <button
              onClick={() => setReportMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${reportMode === 'month'
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {i18n.language === 'id' ? 'Bulanan' : 'Monthly'}
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

          {/* Divider line for visual spacing if needed */}
          <div className="h-5 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1" />

          {/* Export Button */}
          <ExportExcelButton
            transactions={transactions}
            popularItems={popularItemsList.map(item => ({
              name: item.name,
              category: item.category,
              qty: item.qty,
              revenue: item.revenue
            }))}
            cashouts={cashouts}
            dateLabel={exportLabels.dateLabel}
            filenameLabel={exportLabels.filenameLabel}
          />
        </div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue (Net) */}
        <Card className="shadow-sm border-border/50 ">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-[#0A422D] dark:text-[#4ADE80]">
              {t('reportManagement.netRevenue', 'Revenue (Net)')}
            </CardDescription>
            <div className="p-2 bg-[#0A422D]/10 rounded-lg text-[#0A422D]">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-[#0A422D] dark:text-[#4ADE80]">
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('reportManagement.totalRevenueDesc', { count: cancelledOrders })}
            </p>
          </CardContent>
        </Card>

        {/* Completed Orders */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('reportManagement.completedOrders', 'Completed Orders')}
            </CardDescription>
            <div className="p-2 bg-[#0A422D]/10 rounded-lg text-[#0A422D]">
              <ShoppingBag className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{completedOrders}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('reportManagement.completedOrdersDesc', 'Active cashier checkouts')}
            </p>
          </CardContent>
        </Card>

        {/* Avg Order Value */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('reportManagement.averageOrderValue', 'Avg Order Value')}
            </CardDescription>
            <div className="p-2 bg-[#0A422D]/10 rounded-lg text-[#0A422D]">
              <DollarSign className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(averageOrderValue)}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('reportManagement.averageOrderValueDesc', 'Average ticket size')}
            </p>
          </CardContent>
        </Card>

        {/* Void / Cancelled */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('reportManagement.voidedOrders', 'Voided Orders')}
            </CardDescription>
            <div className="p-2 bg-red-100 dark:bg-red-950/20 rounded-lg text-red-600 dark:text-red-400">
              <Calendar className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-600 dark:text-red-400">{cancelledOrders}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('reportManagement.voidedOrdersDesc', 'Voided or returned transactions')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Charts & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Sales Chart */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">{t('reportManagement.hourlySales', 'Hourly Sales Peak')}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('reportManagement.hourlySalesDesc', 'Estimated active sales distribution throughout the day')}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A422D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A422D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-neutral-800" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), i18n.language === 'id' ? 'Penjualan' : 'Sales']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0A422D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distributions (Payment & Order Type) */}
        <div className="flex flex-col gap-6">
          {/* Payment Methods */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">{t('reportManagement.paymentMethods', 'Payment Methods')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {paymentBreakdown.map((item) => {
                const isQRIS = item.method === 'QRIS'
                const displayMethod = item.method === 'Cash' ? (i18n.language === 'id' ? 'Tunai' : 'Cash') : item.method;
                return (
                  <div key={item.method} className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                        {isQRIS ? <QrCode className="size-3.5" /> : <DollarSign className="size-3.5" />}
                        {displayMethod}
                      </span>
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.amount)} ({item.percentage}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0A422D]"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Order Types */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">{t('reportManagement.serviceShare', 'Service Type Share')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {orderTypeBreakdown.map((item) => {
                const displayType =
                  item.type === 'Dine In'
                    ? t('pos.dineIn')
                    : item.type === 'Takeaway'
                      ? t('pos.takeAway')
                      : item.type === 'Order Online'
                        ? t('pos.orderOnline')
                        : item.type;

                const IconComponent =
                  item.type === 'Dine In'
                    ? Utensils
                    : item.type === 'Takeaway'
                      ? ShoppingBag
                      : Globe;

                const barColorClass =
                  item.type === 'Dine In'
                    ? 'bg-[#0A422D]'
                    : item.type === 'Takeaway'
                      ? 'bg-[#EAB308]'
                      : 'bg-[#3B82F6]';

                return (
                  <div key={item.type} className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                        <IconComponent className="size-3.5" />
                        {displayType}
                      </span>
                      <span className="font-bold text-foreground">
                        {t('reportManagement.ordersText', { count: item.count })} ({item.percentage}%)
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColorClass}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grid: Category distribution & Top selling items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category distribution chart */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">{t('reportManagement.categoryPerformance', 'Category Performance')}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {t('reportManagement.categoryPerformanceDesc', 'Total sales distribution per product type')}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categorySales} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-neutral-800" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxis} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), i18n.language === 'id' ? 'Penjualan' : 'Sales']}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#000'
                  }}
                />
                <Bar dataKey="sales" fill="#0A422D" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Product Performance Table */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-foreground">{t('reportManagement.topProducts', 'Top Performing Products')}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('reportManagement.topProductsDesc', 'Cafe items sorted by popularity and unit sales')}
              </CardDescription>
            </div>
            <Award className="size-5 text-[#EAB308]" />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">{t('reportManagement.tableHeaders.rank', 'Rank')}</TableHead>
                  <TableHead>{t('reportManagement.tableHeaders.productName', 'Product Name')}</TableHead>
                  <TableHead>{t('reportManagement.tableHeaders.category', 'Category')}</TableHead>
                  <TableHead className="text-center">{t('reportManagement.tableHeaders.qtySold', 'Quantity Sold')}</TableHead>
                  <TableHead className="text-right pr-4">{t('reportManagement.tableHeaders.totalRevenue', 'Total Revenue')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularItemsList.slice(0, 5).map((item, idx) => (
                  <TableRow key={item.name} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-xs pl-4">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-foreground">{item.name}</TableCell>
                    <TableCell className="capitalize text-xs text-muted-foreground">{t(`menuManagement.categories.${item.category}`, item.category.replace('_', ' '))}</TableCell>
                    <TableCell className="text-center font-bold text-foreground">{item.qty} {t('pos.soldQty')}</TableCell>
                    <TableCell className="text-right font-black text-[#0A422D] dark:text-[#4ADE80] pr-4">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cashout Details */}
      {cashouts.length > 0 && (
        <Card className="shadow-sm border-border/50 mt-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-foreground">{t('reportManagement.cashouts', 'Cashouts')}</CardTitle>
            <div className="text-xs text-muted-foreground font-semibold">
              {t('reportManagement.total', 'Total')}: {formatCurrency(totalCashouts)}
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reportManagement.cashoutTime', 'Time')}</TableHead>
                  <TableHead>{t('reportManagement.cashoutDesc', 'Description')}</TableHead>
                  <TableHead className="text-right pr-4">{t('reportManagement.cashoutAmount', 'Amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashouts.map((co, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/30">
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(co.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">{co.description || '-'}</TableCell>
                    <TableCell className="text-right pr-4 text-xs font-bold text-red-600">-{formatCurrency(co.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
