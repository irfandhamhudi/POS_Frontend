import React, { useState, useEffect } from 'react';
import { FileText, User, Settings as SettingsIcon, LogOut, ChevronDown, Archive, UserLock, Clock, LogIn, MinusCircle, ChefHat, BanknoteArrowDown } from 'lucide-react';
import { useOrder } from '../../order/context/OrderContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProfileModal } from './ProfileModal';
import { SettingsModal } from './SettingsModal';
import { NotificationDropdown } from './NotificationDropdown';
import { HeldOrdersModal } from '../../order/components/HeldOrdersModal';
import { PendingOrdersPanel } from './PendingOrdersPanel';
import { useAuth } from '../../auth/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../hooks/useTranslation';
import { formatCurrency, formatNumberInput, unformatNumberInput } from 'src/lib/utils';
import { toast } from 'src/hooks/use-toast';
import api from 'src/api';
// import { useShift } from '../context/ShiftContext';
// import { ShiftReportModal } from './ShiftReportModal';
export const POSHeader: React.FC = () => {
    const { setIsReportOpen, heldOrders, activeShift, setActiveShift, clearCart, pendingTransactions } = useOrder();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    // const { activeShift } = useShift();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHeldOpen, setIsHeldOpen] = useState(false);
    const [isPendingOpen, setIsPendingOpen] = useState(false);
    const [isClockInOpen, setIsClockInOpen] = useState(false);
    const [isClockOutOpen, setIsClockOutOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');
    const [endingCash, setEndingCash] = useState('');
    const [isCashoutOpen, setIsCashoutOpen] = useState(false);
    const [cashoutAmount, setCashoutAmount] = useState('');
    const [cashoutDesc, setCashoutDesc] = useState('');
    const [shiftLoading, setShiftLoading] = useState(false);
    const [shiftSettings, setShiftSettings] = useState<{ openHour: number; closeHour: number } | null>(null);

    useEffect(() => {
        api.get('/shifts/settings').then(res => {
            if (res.data?.success) {
                setShiftSettings(res.data.data);
            }
        }).catch(() => {
            // fallback to defaults if server unreachable
            setShiftSettings({ openHour: 0, closeHour: 24 });
        });
    }, []);

    const totalCashouts = activeShift?.cashouts?.reduce((sum: number, c: any) => sum + (c.amount || 0), 0) || 0;
    const expectedEndingCash = (activeShift?.startingCash || 0) + (activeShift?.totalSales || 0) - totalCashouts;

    useEffect(() => {
        if (isClockOutOpen) {
            setEndingCash(String(expectedEndingCash));
        }
    }, [isClockOutOpen]);

    const handleClockIn = async () => {
        const hour = new Date().getHours();
        const openHour = shiftSettings?.openHour ?? 0;
        const closeHour = shiftSettings?.closeHour ?? 24;
        if (hour < openHour || hour >= closeHour) {
            toast({ title: t('posHeader.outsideHours', `Operating hours are ${openHour}:00 - ${closeHour}:00`), variant: 'amber' });
            setShiftLoading(false);
            return;
        }
        setShiftLoading(true);
        try {
            const res = await api.post('/shifts/start', { startingCash: Number(startingCash) || 0 });
            if (res.data.success) {
                setActiveShift(res.data.data);
                setIsClockInOpen(false);
                setStartingCash('');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to start shift');
        } finally {
            setShiftLoading(false);
        }
    };

    const handleCashout = async () => {
        if (!activeShift) return;
        setShiftLoading(true);
        try {
            const res = await api.post(`/shifts/${activeShift._id}/cashout`, { amount: Number(cashoutAmount), description: cashoutDesc });
            if (res.data.success) {
                setActiveShift(res.data.data);
                setIsCashoutOpen(false);
                setCashoutAmount('');
                setCashoutDesc('');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to record cashout');
        } finally {
            setShiftLoading(false);
        }
    };

    const handleClockOut = async () => {
        if (!activeShift) return;
        setShiftLoading(true);
        try {
            const res = await api.put(`/shifts/${activeShift._id}/end`, { endingCash: Number(endingCash) || 0 });
            if (res.data.success) {
                setActiveShift(null);
                setIsClockOutOpen(false);
                setEndingCash('');
                clearCart();
                window.location.reload();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to end shift');
        } finally {
            setShiftLoading(false);
        }
    };

    return (
        <header className="flex h-20 items-center justify-between px-8 bg-white border-b border-[#EBEAE4]">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#0A422D] text-white">
                    <span className="font-bold text-lg tracking-wider">G</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-[#0A422D] tracking-tight leading-none text-base">GREEN</span>
                    <span className="font-bold text-[#0A422D] tracking-tight leading-none text-base">GROUNDS</span>
                    <span className="text-[10px] text-[#0A422D]/60 tracking-wider font-semibold">COFFEE</span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {/* Held Orders Button */}
                <Button
                    variant="outline"
                    onClick={() => setIsHeldOpen(true)}
                    className="cursor-pointer h-10 px-4 bg-white border-[#EBEAE4] hover:bg-gray-50 text-gray-700 font-semibold gap-2 rounded-lg text-sm relative"
                >
                    <Archive className="size-4 text-gray-600" />
                    {t('posHeader.heldOrders')}
                    {heldOrders.length > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black leading-none border-2 border-white dark:border-[#1C1C19] dark:bg-red-600">
                            {heldOrders.length}
                        </span>
                    )}
                </Button>
                {/* Pending Orders Button (Self-Order Cash Approval) */}
                {pendingTransactions.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setIsPendingOpen(true)}
                    className="cursor-pointer h-10 px-4 bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700 font-semibold gap-2 rounded-lg text-sm relative"
                  >
                    <Clock className="size-4" />
                    {t('posHeader.pendingOrders', 'Pending')}
                    {pendingTransactions.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-amber-600 text-white rounded-full flex items-center justify-center text-[9px] font-black leading-none border-2 border-white dark:border-[#1C1C19]">
                        {pendingTransactions.length}
                      </span>
                    )}
                  </Button>
                )}
                {/* Report Button */}
                <Button
                    variant="outline"
                    onClick={() => setIsReportOpen(true)}
                    className="cursor-pointer h-10 px-4 bg-white border-[#EBEAE4] hover:bg-gray-50 text-gray-700 font-semibold gap-2 rounded-lg text-sm"
                >
                    <FileText className="size-4 text-gray-600" />
                    {t('posHeader.report')}
                </Button>
                {/* Cashout Button (only during active shift) */}
                {activeShift && (
                    <Button
                        variant="outline"
                        onClick={() => setIsCashoutOpen(true)}
                        className="cursor-pointer h-10 px-4 bg-white border-amber-200 hover:bg-amber-50 text-amber-700 font-semibold gap-2 rounded-lg text-sm"
                    >
                        <BanknoteArrowDown className="size-4" />
                        {t('posHeader.cashout', 'Cashout')}
                    </Button>
                )}
                {/* Clock In/Out Button */}
                {activeShift ? (
                    <Button
                        variant="outline"
                        onClick={() => setIsClockOutOpen(true)}
                        className="cursor-pointer h-10 px-4 bg-white border-red-200 hover:bg-red-50 text-red-600 font-semibold gap-2 rounded-lg text-sm"
                    >
                        <LogIn className="size-4" />
                        {t('posHeader.clockOut', 'Clock Out')}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => setIsClockInOpen(true)}
                        className="cursor-pointer h-10 px-4 bg-white border-[#0A422D]/20 hover:bg-[#0A422D]/5 text-[#0A422D] font-semibold gap-2 rounded-lg text-sm"
                    >
                        <Clock className="size-4" />
                        {t('posHeader.clockIn', 'Clock In')}
                    </Button>
                )}
                {/* Notification Dropdown */}
                <NotificationDropdown />
                {/* Profile User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 bg-white hover:bg-gray-50 pl-3 pr-4 py-1.5 border border-[#EBEAE4] rounded-lg cursor-pointer transition-all active:scale-[0.98] select-none text-left"
                    >
                        <div className="w-8 h-8 rounded-full border border-[#0A422D]/20 bg-[#0A422D]/10 text-[#0A422D] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-[#4ADE80] flex items-center justify-center shrink-0">
                            {user?.role === 'admin' ? (
                                <UserLock className="size-4.5" />
                            ) : (
                                <User className="size-4.5" />
                            )}
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-bold text-gray-900 leading-tight">{user?.name || 'Cashier'}</span>
                            <span className="text-[10px] text-gray-500 font-medium capitalize">{user?.role || 'cashier'}</span>
                        </div>
                        <ChevronDown className={`size-3.5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Dropdown Menu Overlay & Box */}
                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-30 cursor-default"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-52 bg-white border border-[#EBEAE4] rounded-lg shadow-sm z-40 py-2 animate-in fade-in-0 zoom-in-95 duration-100 flex flex-col">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setIsProfileOpen(true);
                                    }}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer text-left transition-colors"
                                >
                                    <User className="size-4 text-gray-400" />
                                    {t('posHeader.viewProfile')}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        setIsSettingsOpen(true);
                                    }}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer text-left transition-colors"
                                >
                                    <SettingsIcon className="size-4 text-gray-400" />
                                    {t('posHeader.settings')}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        window.open('/kitchen', '_blank');
                                    }}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer text-left transition-colors"
                                >
                                    <ChefHat className="size-4 text-gray-400" />
                                    {t('posHeader.kitchen', 'Kitchen Display')}
                                </button>
                                <div className="border-t border-[#EBEAE4] my-1" />
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        logout();
                                        navigate('/login', { replace: true });
                                    }}
                                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer text-left transition-colors"
                                >
                                    <LogOut className="size-4 text-red-500" />
                                    {t('posHeader.logOut')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Render subcomponents */}
            <ProfileModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />
            <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
            <HeldOrdersModal open={isHeldOpen} onOpenChange={setIsHeldOpen} />
            <PendingOrdersPanel isOpen={isPendingOpen} onClose={() => setIsPendingOpen(false)} />
            {/* Clock In Dialog */}
            <Dialog open={isClockInOpen} onOpenChange={setIsClockInOpen}>
                <DialogContent className="sm:max-w-sm bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight">{t('posHeader.startShift', 'Start Shift')}</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">{t('posHeader.startShiftDesc', 'Enter the starting cash amount for this shift.')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-2">
                        <label className="text-xs font-bold text-gray-700">{t('posHeader.startingCash', 'Starting Cash')}</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={startingCash ? formatNumberInput(startingCash) : ''}
                            onChange={(e) => setStartingCash(unformatNumberInput(e.target.value))}
                            placeholder="Rp 0"
                            className="w-full h-10 px-3 bg-white dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0A422D]"
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setIsClockInOpen(false)} className="cursor-pointer">{t('orderManagement.invoiceDialog.close', 'Cancel')}</Button>
                        <Button size="sm" onClick={handleClockIn} disabled={shiftLoading} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer">
                            <Clock className="size-3.5 mr-1" />{t('posHeader.startShift', 'Start Shift')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Clock Out Dialog */}
            <Dialog open={isClockOutOpen} onOpenChange={setIsClockOutOpen}>
                <DialogContent className="sm:max-w-sm bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-red-600 tracking-tight">{t('posHeader.endShift', 'End Shift')}</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">{t('posHeader.endShiftAuto', 'Ending cash is calculated automatically. Adjust if there is a difference.')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-semibold">{t('posHeader.startingCash', 'Starting Cash')}</span>
                            <span className="font-bold">{formatCurrency(activeShift?.startingCash || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-semibold">{t('posHeader.totalSales', 'Total Sales')}</span>
                            <span className="font-bold">{formatCurrency(activeShift?.totalSales || 0)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-500 font-semibold">{t('posHeader.totalOrders', 'Total Orders')}</span>
                            <span className="font-bold">{activeShift?.totalOrders || 0}</span>
                        </div>
                        {totalCashouts > 0 && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500 font-semibold">{t('posHeader.totalCashouts', 'Total Cashouts')}</span>
                                <span className="font-bold text-red-600">-{formatCurrency(totalCashouts)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-[#0A422D] border-t border-dashed border-[#EBEAE4] pt-2">
                            <span>{t('posHeader.expectedCash', 'Expected Cash')}</span>
                            <span>{formatCurrency(expectedEndingCash)}</span>
                        </div>
                        <div className="border-t border-[#EBEAE4] dark:border-[#2D2D2A] pt-3 flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700">{t('posHeader.endingCash', 'Ending Cash')}</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={endingCash ? formatNumberInput(endingCash) : ''}
                                onChange={(e) => setEndingCash(unformatNumberInput(e.target.value))}
                                placeholder="Rp 0"
                                className="w-full h-10 px-3 bg-white dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#0A422D]"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setIsClockOutOpen(false)} className="cursor-pointer">{t('orderManagement.invoiceDialog.close', 'Cancel')}</Button>
                        <Button size="sm" variant="destructive" onClick={handleClockOut} disabled={shiftLoading} className="cursor-pointer">
                            <LogIn className="size-3.5 mr-1" />{t('posHeader.endShift', 'End Shift')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Cashout Dialog */}
            <Dialog open={isCashoutOpen} onOpenChange={setIsCashoutOpen}>
                <DialogContent className="sm:max-w-sm bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-amber-700 tracking-tight">{t('posHeader.cashout', 'Cashout')}</DialogTitle>
                        <DialogDescription className="text-xs text-gray-500">{t('posHeader.cashoutDesc', 'Record an expense or cash withdrawal during this shift.')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 mt-2">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700">{t('posHeader.cashoutAmount', 'Amount')}</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={cashoutAmount ? formatNumberInput(cashoutAmount) : ''}
                                onChange={(e) => setCashoutAmount(unformatNumberInput(e.target.value))}
                                placeholder="Rp 0"
                                className="w-full h-10 px-3 bg-white dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-gray-700">{t('posHeader.cashoutDescLabel', 'Description')}</label>
                            <input
                                type="text"
                                value={cashoutDesc}
                                onChange={(e) => setCashoutDesc(e.target.value)}
                                placeholder={t('posHeader.cashoutPlaceholder', 'e.g. Buy supplies')}
                                className="w-full h-10 px-3 bg-white dark:bg-[#232320] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg text-sm font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => setIsCashoutOpen(false)} className="cursor-pointer">{t('orderManagement.invoiceDialog.close', 'Cancel')}</Button>
                        <Button size="sm" onClick={handleCashout} disabled={shiftLoading || !cashoutAmount || Number(cashoutAmount) <= 0} className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer">
                            <MinusCircle className="size-3.5 mr-1" />{t('posHeader.cashoutRecord', 'Record')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </header>
    );
};
