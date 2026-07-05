import React, { useState, useMemo, useEffect } from 'react'
import { useOrder } from '../../../order/context/OrderContext'
import { formatCurrency } from 'src/lib/utils'
import api from 'src/api'
import type { Transaction } from '../../../order/types'
import {
  Card,
  CardContent,
} from 'src/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table'
import { useTranslation } from '../../../../hooks/useTranslation'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { Input } from 'src/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import {
  Search,
  Eye,
  Trash2,
  Calendar,
  AlertTriangle,
  Trash,
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

export const OrderManagement: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { cancelOrder, deleteOrder } = useOrder()

  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const [reportMode, setReportMode] = useState<'today' | 'day' | 'month'>('today')
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString)
  const [selectedMonth, setSelectedMonth] = useState<string>(getTodayMonthString)

  const todayDateString = getTodayDateString()
  const todayMonthString = getTodayMonthString()

  const [searchQuery, setSearchQuery] = useState('')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine_in' | 'take_away' | 'order_online'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all')

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

  const fetchFilteredTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
      const response = await api.get('/transactions', { params })
      if (response.data.success) {
        setLocalTransactions(response.data.data.map((tx: any) => ({
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
    } catch (error) {
      console.error('Failed to fetch transactions', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFilteredTransactions()
  }, [dateRange])

  const filteredTx = useMemo(() => {
    return localTransactions.filter((tx) => {
      const matchesSearch =
        tx.id.includes(searchQuery) ||
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType =
        orderTypeFilter === 'all' ? true : tx.orderType === orderTypeFilter

      const matchesStatus =
        statusFilter === 'all' ? true : tx.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [localTransactions, searchQuery, orderTypeFilter, statusFilter])

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [targetTxId, setTargetTxId] = useState<string | null>(null)

  const formatTime = (createdAtStr: string, timestampFallback: string) => {
    const isId = i18n.language === 'id'
    if (createdAtStr) {
      const date = new Date(createdAtStr)
      if (!isNaN(date.getTime())) {
        if (isId) {
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${hours}:${minutes} WIB`
        } else {
          let hours = date.getHours()
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const ampm = hours >= 12 ? 'PM' : 'AM'
          hours = hours % 12
          hours = hours ? hours : 12
          return `${hours}:${minutes} ${ampm}`
        }
      }
    }
    return isId ? `${timestampFallback} WIB` : timestampFallback
  }

  const isLoading = loading

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div>
          <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
          <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-9 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-9 w-full md:w-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-lg border">
          <div className="h-12 border-b bg-zinc-50 dark:bg-zinc-900 rounded-t-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div className="flex-1 flex justify-end gap-2">
                <div className="h-7 w-7 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-7 w-7 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleVoidClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTargetTxId(id)
    setVoidDialogOpen(true)
  }

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setTargetTxId(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmVoid = async () => {
    if (!targetTxId) return
    const success = await cancelOrder(targetTxId)
    if (success) {
      fetchFilteredTransactions()
    }
    setVoidDialogOpen(false)
    setTargetTxId(null)
  }

  const handleConfirmDelete = async () => {
    if (!targetTxId) return
    await deleteOrder(targetTxId)
    fetchFilteredTransactions()
    setDeleteDialogOpen(false)
    setTargetTxId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Date Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('orderManagement.title', 'Order Management')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('orderManagement.subtitle', 'View, detail, and manage transaction logs')}
          </p>
        </div>

        {/* Date Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
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

      {/* Type & Status Filters + Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setOrderTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${orderTypeFilter === 'all' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('orderManagement.allType', 'All Type')}
            </button>
            <button
              onClick={() => setOrderTypeFilter('dine_in')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${orderTypeFilter === 'dine_in' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('pos.dineIn', 'Dine In')}
            </button>
            <button
              onClick={() => setOrderTypeFilter('take_away')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${orderTypeFilter === 'take_away' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('pos.takeAway', 'Takeaway')}
            </button>
            <button
              onClick={() => setOrderTypeFilter('order_online')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${orderTypeFilter === 'order_online' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('pos.orderOnline', 'Online')}
            </button>
          </div>

          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('orderManagement.allStatus', 'All Status')}
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'completed' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('orderManagement.completed', 'Completed')}
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'cancelled' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('orderManagement.cancelled', 'Cancelled')}
            </button>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder={t('orderManagement.searchPlaceholder', 'Search by ID or customer...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white pl-9 h-9"
          />
        </div>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('orderManagement.invoiceTable.invoiceId', 'Invoice ID')}</TableHead>
                <TableHead>{t('orderManagement.invoiceTable.customer', 'Customer')}</TableHead>
                <TableHead>{t('orderManagement.invoiceTable.dateTime', 'Date / Time')}</TableHead>
                <TableHead>{t('orderManagement.invoiceTable.type', 'Type')}</TableHead>
                <TableHead>{t('orderManagement.invoiceTable.payment', 'Payment')}</TableHead>
                <TableHead className="text-left">{t('orderManagement.invoiceTable.total', 'Total')}</TableHead>
                <TableHead>{t('orderManagement.invoiceTable.status', 'Status')}</TableHead>
                <TableHead className="text-right">{t('orderManagement.invoiceTable.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTx.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/30">
                  <TableCell className="font-bold text-[13px]">{tx.id}</TableCell>
                  <TableCell className="font-bold text-[13px]">{tx.customerName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {tx.date || (i18n.language === 'id' ? 'Hari ini' : 'Today')}, {formatTime(tx.createdAt || '', tx.timestamp || '')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tx.orderType === 'dine_in' ? 'default' : 'secondary'} className="rounded text-[10px] py-0 h-4">
                      {tx.orderType === 'dine_in' ? t('pos.dineIn') : tx.orderType === 'take_away' ? t('pos.takeAway') : t('pos.orderOnline')}
                    </Badge>
                  </TableCell>
                  <TableCell className="uppercase text-xs font-semibold text-muted-foreground">
                    {tx.paymentMethod === 'cash' ? (i18n.language === 'id' ? 'TUNAI' : 'CASH') : tx.paymentMethod?.toUpperCase()}
                  </TableCell>
                  <TableCell className="text-left font-bold text-[13px] text-foreground">
                    {formatCurrency(tx.total)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.status === 'cancelled' ? 'destructive' : 'secondary'}
                      className={`rounded text-[10px] py-2 px-3 h-4 font-bold ${tx.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'}`}
                    >
                      {tx.status === 'cancelled'
                        ? t('orderManagement.cancelled')
                        : t('orderManagement.completed')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="icon-xs"
                        variant="outline"
                        onClick={() => setSelectedTx(tx)}
                        className="cursor-pointer"
                        title={t('notifications.seeDetail', 'View Detail')}
                      >
                        <Eye className="size-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                      {tx.status !== 'cancelled' && (
                        <Button
                          size="icon-xs"
                          variant="destructive"
                          onClick={(e) => handleVoidClick(tx.id, e)}
                          className="cursor-pointer"
                          title={t('orderManagement.invoiceDialog.voidBtn', 'Void / Cancel Order')}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                      {tx.status === 'cancelled' && (
                        <Button
                          size="icon-xs"
                          variant="destructive"
                          onClick={(e) => handleDeleteClick(tx.id, e)}
                          className="cursor-pointer"
                          title="Delete Order Permanently"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredTx.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {t('orderManagement.invoiceTable.noOrders', 'No orders found matching the filter criteria.')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Void AlertDialog */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              {t('orderManagement.voidAlertTitle', 'Void Order')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('orderManagement.confirmVoid', 'Are you sure you want to cancel and void order {{id}}?', { id: targetTxId || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('orderManagement.invoiceDialog.close', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmVoid}
            >
              {t('orderManagement.invoiceDialog.voidBtn', 'Void Order')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash className="size-5 text-red-500" />
              {t('orderManagement.deleteAlertTitle', 'Delete Order Permanently')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('orderManagement.confirmDelete', 'Are you sure you want to permanently delete order {id}? This action cannot be undone.', { id: targetTxId || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('orderManagement.invoiceDialog.close', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              {t('orderManagement.deleteBtn', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(open) => !open && setSelectedTx(null)}>
        <DialogContent className="max-w-md bg-white border border-[#EBEAE4] dark:bg-[#1C1C19] dark:border-[#2D2D2A] p-6 rounded-lg text-left shadow-xl">
          <DialogHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg font-bold text-[#0A422D] dark:text-[#4ADE80]">{t('orderManagement.invoiceDialog.title', 'Invoice Details')}</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1 block">
              {t('orderManagement.invoiceDialog.subtitle', { id: selectedTx?.id, type: selectedTx?.orderType === 'dine_in' ? t('pos.dineIn') : t('pos.takeAway') })}
            </DialogDescription>
          </DialogHeader>

          {selectedTx && (
            <div className="flex flex-col gap-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground block">{t('orderManagement.invoiceDialog.customerLabel', 'Customer:')}</span>
                  {selectedTx.customerName}
                </div>
                <div>
                  <span className="font-semibold text-foreground block">{t('orderManagement.invoiceDialog.tableLabel', 'Table / Spot:')}</span>
                  {selectedTx.orderType === 'dine_in' ? selectedTx.tableNumber || 'B12' : 'N/A'}
                </div>
                <div>
                  <span className="font-semibold text-foreground block">{t('orderManagement.invoiceDialog.dateTimeLabel', 'Date & Time:')}</span>
                  {selectedTx.date || (i18n.language === 'id' ? 'Hari ini' : 'Today')}, {formatTime(selectedTx.createdAt || '', selectedTx.timestamp || '')}
                </div>
                <div>
                  <span className="font-semibold text-foreground block">{t('orderManagement.invoiceDialog.paymentMethodLabel', 'Payment Method:')}</span>
                  <span className="uppercase font-bold text-foreground">
                    {selectedTx.paymentMethod === 'cash' ? (i18n.language === 'id' ? 'Tunai' : 'Cash') : selectedTx.paymentMethod?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-bold text-sm text-foreground">{t('orderManagement.invoiceDialog.itemsSummary', 'Items Summary')}</span>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {selectedTx.items.map((item, idx) => {
                    const sizePriceModifier = item.size === 'small' ? -2000 : item.size === 'large' ? 5000 : 0
                    const itemPrice = item.product.price + sizePriceModifier
                    return (
                      <div key={idx} className="flex justify-between items-start text-xs border-b border-border/40 pb-1">
                        <div>
                          <p className="font-bold text-foreground">{item.product.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t('orderManagement.invoiceDialog.sizeLabel', 'Size')}: <span className="capitalize">{item.size}</span>
                            {item.notes && ` | ${t('orderManagement.invoiceDialog.notesLabel', 'Notes')}: ${item.notes}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">{item.quantity}x</p>
                          <p className="text-[10px] text-muted-foreground">{formatCurrency(itemPrice * item.quantity)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t pt-2 font-semibold">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('orderManagement.invoiceDialog.subtotalLabel', 'Subtotal')}</span>
                  <span>{formatCurrency(selectedTx.subtotal || selectedTx.total - Math.round(selectedTx.total * 0.1))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('orderManagement.invoiceDialog.taxLabel', 'Tax (10%)')}</span>
                  <span>{formatCurrency(selectedTx.tax || Math.round(selectedTx.total * 0.1))}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t pt-1.5 mt-1">
                  <span>{t('orderManagement.invoiceDialog.totalAmountLabel', 'Total Amount')}</span>
                  <span>{formatCurrency(selectedTx.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground mt-1">
                  <span>{t('orderManagement.invoiceDialog.amountPaidLabel', 'Amount Paid')}</span>
                  <span>{formatCurrency(selectedTx.amountPaid || selectedTx.total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('orderManagement.invoiceDialog.changeDueLabel', 'Change Due')}</span>
                  <span>{formatCurrency(selectedTx.change || 0)}</span>
                </div>
              </div>

              {selectedTx.status === 'cancelled' && (
                <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2.5 rounded-lg border border-red-200/20 text-center font-bold">
                  {t('orderManagement.invoiceDialog.voidAlert', 'This order has been voided / cancelled.')}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)} className="cursor-pointer">
              {t('orderManagement.invoiceDialog.close', 'Close')}
            </Button>
            {selectedTx && selectedTx.status !== 'cancelled' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (selectedTx) {
                    setTargetTxId(selectedTx.id)
                    setSelectedTx(null)
                    setVoidDialogOpen(true)
                  }
                }}
                className="cursor-pointer"
              >
                {t('orderManagement.invoiceDialog.voidBtn', 'Void Order')}
              </Button>
            )}
            {selectedTx && selectedTx.status === 'cancelled' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (selectedTx) {
                    setTargetTxId(selectedTx.id)
                    setSelectedTx(null)
                    setDeleteDialogOpen(true)
                  }
                }}
                className="cursor-pointer"
              >
                {t('orderManagement.deleteBtn', 'Delete')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
