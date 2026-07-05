import React, { useState, useEffect, useCallback } from 'react'
import api from 'src/api'
import { formatCurrency } from 'src/lib/utils'
import { Card, CardContent } from 'src/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { useTranslation } from '../../../../hooks/useTranslation'
import { Button } from 'src/components/ui/button'
import { Badge } from 'src/components/ui/badge'
import { Input } from 'src/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'src/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from 'src/components/ui/alert-dialog'
import { Search, Clock, Eye, ArrowDownCircle, ArrowUpCircle, DollarSign, CreditCard, QrCode, Wallet, MinusCircle, Trash2 } from 'lucide-react'

interface Cashout {
  amount: number
  description: string
  createdAt: string
}

interface Shift {
  _id: string
  cashierName: string
  startTime: string
  endTime: string
  status: 'active' | 'closed'
  startingCash: number
  endingCash: number
  totalSales: number
  totalOrders: number
  cashSales?: number
  cardSales?: number
  qrisSales?: number
  difference?: number
  cashouts?: Cashout[]
  totalCashouts?: number
}

export const ShiftManagement: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [loading, setLoading] = useState(true)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Shift | null>(null)

  const fetchShifts = useCallback(async () => {
    try {
      const res = await api.get('/shifts')
      if (res.data.success) setShifts(res.data.data)
    } catch (error) {
      console.error('Failed to fetch shifts', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const handleDeleteShift = async () => {
    if (!deleteTarget) return
    try {
      const res = await api.delete(`/shifts/${deleteTarget._id}`)
      if (res.data.success) {
        setShifts(prev => prev.filter(s => s._id !== deleteTarget._id))
      }
    } catch (error) {
      console.error('Failed to delete shift', error)
    }
    setDeleteTarget(null)
  }

  const filteredShifts = shifts.filter(s => {
    const matchesSearch = (s.cashierName || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' ? true : s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDateTime = (dateStr: string) => {
    const isId = i18n.language === 'id'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'

    const day = date.getDate()
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
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

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div><div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" /><div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" /></div>
        <div className="bg-white dark:bg-zinc-950 rounded-lg border"><div className="h-12 border-b bg-zinc-50 dark:bg-zinc-900 rounded-t-lg" />
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex items-center gap-4 p-4 border-b"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" /><div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" /><div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" /></div>))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="pb-4 border-b border-border/40 text-2xl font-bold tracking-tight text-foreground">{t('shiftManagement.title', 'Shift Management')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('shiftManagement.subtitle', 'Monitor cashier shifts, cash reconciliation and sales totals')}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('shiftManagement.allStatus', 'All')}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'active' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('shiftManagement.active', 'Active')}
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'closed' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('shiftManagement.closed', 'Closed')}
            </button>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder={t('shiftManagement.searchPlaceholder', 'Search by cashier name...')}
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
                <TableHead>{t('shiftManagement.table.cashier', 'Cashier Name')}</TableHead>
                <TableHead>{t('shiftManagement.table.startTime', 'Start Time')}</TableHead>
                <TableHead>{t('shiftManagement.table.endTime', 'End Time')}</TableHead>
                <TableHead>{t('shiftManagement.table.status', 'Status')}</TableHead>
                <TableHead>{t('shiftManagement.table.startingCash', 'Starting Cash')}</TableHead>
                <TableHead>{t('shiftManagement.table.endingCash', 'Ending Cash')}</TableHead>
                <TableHead>{t('shiftManagement.table.totalSales', 'Total Sales')}</TableHead>
                <TableHead>{t('shiftManagement.table.totalOrders', 'Total Orders')}</TableHead>
                <TableHead className="text-right">{t('shiftManagement.table.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.map((shift) => (
                <TableRow key={shift._id} className="hover:bg-muted/30">
                  <TableCell className="font-bold text-[13px]">
                    <span className="flex items-center gap-1.5">
                      <div className="size-6 bg-[#0A422D]/10 text-[#0A422D] dark:bg-[#4ADE80]/10 dark:text-[#4ADE80] flex items-center justify-center rounded-md">
                        <span className="text-[10px] font-black">{(shift.cashierName || '?').charAt(0).toUpperCase()}</span>
                      </div>
                      {shift.cashierName}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatDateTime(shift.startTime)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {shift.endTime ? formatDateTime(shift.endTime) : '-'}
                  </TableCell>
                  <TableCell>
                    {shift.status === 'active' ? (
                      <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                        {t('shiftManagement.active', 'Active')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded text-[10px] py-0 h-4">
                        {t('shiftManagement.closed', 'Closed')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{formatCurrency(shift.startingCash)}</TableCell>
                  <TableCell className="text-xs font-semibold">
                    {shift.endingCash != null ? formatCurrency(shift.endingCash) : '-'}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-[#0A422D] dark:text-[#4ADE80]">{formatCurrency(shift.totalSales)}</TableCell>
                  <TableCell className="text-xs font-semibold">{shift.totalOrders}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    <Button
                      size="icon-xs"
                      variant="outline"
                      onClick={() => setSelectedShift(shift)}
                      className="cursor-pointer"
                      title={t('shiftManagement.viewDetail', 'View Detail')}
                    >
                      <Eye className="size-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="destructive"
                      onClick={() => setDeleteTarget(shift)}
                      className="cursor-pointer"
                      title={t('shiftManagement.deleteShift', 'Delete Shift')}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredShifts.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">{t('shiftManagement.noShifts', 'No shifts found.')}</div>
          )}
        </CardContent>
      </Card>

      {/* Shift Detail Dialog */}
      <Dialog open={!!selectedShift} onOpenChange={(open) => !open && setSelectedShift(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
            <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">
              {t('shiftManagement.detailTitle', 'Shift Details')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 block">
              {t('shiftManagement.detailDesc', 'Cash reconciliation and payment breakdown for this shift')}
            </DialogDescription>
          </DialogHeader>

          {selectedShift && (
            <div className="flex flex-col gap-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#EBEAE4] dark:border-[#2D2D2A]">
                <div>
                  <span className="text-muted-foreground block mb-0.5">{t('shiftManagement.table.cashier', 'Cashier Name')}</span>
                  <span className="font-bold text-foreground">{selectedShift.cashierName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">{t('shiftManagement.table.status', 'Status')}</span>
                  <Badge variant={selectedShift.status === 'active' ? 'default' : 'secondary'} className="rounded text-[10px] py-0 h-4">
                    {selectedShift.status === 'active' ? t('shiftManagement.active', 'Active') : t('shiftManagement.closed', 'Closed')}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">{t('shiftManagement.table.startTime', 'Start Time')}</span>
                  <span className="font-semibold text-foreground">{formatDateTime(selectedShift.startTime)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">{t('shiftManagement.table.endTime', 'End Time')}</span>
                  <span className="font-semibold text-foreground">{selectedShift.endTime ? formatDateTime(selectedShift.endTime) : '-'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-bold text-sm text-foreground">{t('shiftManagement.cashBreakdown', 'Cash Breakdown')}</span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ArrowDownCircle className="size-3.5 text-green-500" />
                      {t('shiftManagement.startingCash', 'Starting Cash')}
                    </span>
                    <span className="font-bold text-foreground">{formatCurrency(selectedShift.startingCash)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="size-3.5" />
                      {t('shiftManagement.table.totalSales', 'Total Sales')}
                    </span>
                    <span className="font-bold text-[#0A422D] dark:text-[#4ADE80]">{formatCurrency(selectedShift.totalSales)}</span>
                  </div>
                  {selectedShift.cashouts && selectedShift.cashouts.length > 0 && (
                    <div className="flex justify-between items-center py-1 border-b border-border/40">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <MinusCircle className="size-3.5 text-amber-500" />
                        {t('shiftManagement.totalCashouts', 'Total Cashouts')}
                      </span>
                      <span className="font-bold text-red-600">-{formatCurrency(selectedShift.cashouts.reduce((s, c) => s + c.amount, 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ArrowUpCircle className="size-3.5 text-blue-500" />
                      {t('shiftManagement.endingCash', 'Ending Cash')}
                    </span>
                    <span className="font-bold text-foreground">
                      {selectedShift.endingCash != null ? formatCurrency(selectedShift.endingCash) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <DollarSign className="size-3.5 text-amber-500" />
                      {t('shiftManagement.difference', 'Difference')}
                    </span>
                    <span className={`font-bold ${(selectedShift.difference || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {selectedShift.difference !== undefined ? formatCurrency(selectedShift.difference) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-bold text-sm text-foreground">{t('shiftManagement.salesByPayment', 'Sales by Payment Method')}</span>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="size-3.5" />
                      {t('shiftManagement.cashSales', 'Cash Sales')}
                    </span>
                    <span className="font-bold text-foreground">{formatCurrency(selectedShift.cashSales || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CreditCard className="size-3.5" />
                      {t('shiftManagement.cardSales', 'Card Sales')}
                    </span>
                    <span className="font-bold text-foreground">{formatCurrency(selectedShift.cardSales || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <QrCode className="size-3.5" />
                      {t('shiftManagement.qrisSales', 'QRIS Sales')}
                    </span>
                    <span className="font-bold text-foreground">{formatCurrency(selectedShift.qrisSales || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-t border-[#EBEAE4] dark:border-[#2D2D2A] mt-0.5">
                    <span className="font-bold text-foreground">{t('shiftManagement.table.totalSales', 'Total Sales')}</span>
                    <span className="font-black text-sm text-[#0A422D] dark:text-[#4ADE80]">{formatCurrency(selectedShift.totalSales)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#EBEAE4] dark:border-[#2D2D2A]">
                <span className="text-muted-foreground">{t('shiftManagement.table.totalOrders', 'Total Orders')}</span>
                <span className="font-bold text-foreground">{selectedShift.totalOrders} {t('shiftManagement.orders', 'orders')}</span>
              </div>

              {/* Cashouts Section */}
              {selectedShift.cashouts && selectedShift.cashouts.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#EBEAE4] dark:border-[#2D2D2A]">
                  <span className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <MinusCircle className="size-3.5 text-amber-500" />
                    {t('shiftManagement.cashouts', 'Cashouts')}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {selectedShift.cashouts.map((co, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">{co.description || '-'}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(co.createdAt)}</span>
                        </div>
                        <span className="font-bold text-red-600 dark:text-red-400">-{formatCurrency(co.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-1.5 border-t border-[#EBEAE4] dark:border-[#2D2D2A] mt-0.5">
                      <span className="font-bold text-foreground text-xs">{t('shiftManagement.totalCashouts', 'Total Cashouts')}</span>
                      <span className="font-black text-sm text-red-600 dark:text-red-400">-{formatCurrency(selectedShift.cashouts.reduce((sum, c) => sum + c.amount, 0))}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-[#EBEAE4] dark:border-[#2D2D2A]">
            <Button variant="outline" size="sm" onClick={() => setSelectedShift(null)} className="cursor-pointer">
              {t('shiftManagement.close', 'Close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-red-500" />
              {t('shiftManagement.deleteTitle', 'Delete Shift')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('shiftManagement.deleteConfirm', 'Are you sure you want to delete shift for "{{name}}"? This action cannot be undone.', { name: deleteTarget?.cashierName || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('shiftManagement.close', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteShift}>{t('shiftManagement.deleteBtn', 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
