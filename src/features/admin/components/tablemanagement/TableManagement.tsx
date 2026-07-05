import React, { useState, useEffect, useCallback } from 'react';
import api from 'src/api';
import { Card, CardContent } from 'src/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { useTranslation } from '../../../../hooks/useTranslation';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Input } from 'src/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from 'src/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from 'src/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, Armchair, Settings, Unlock, QrCode } from 'lucide-react';

interface TableItem {
  _id: string;
  name: string;
  label: string;
  capacity: number;
  zone: 'indoor' | 'outdoor' | 'rooftop' | 'vip';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  position: { x: number; y: number };
  shape: 'square' | 'round' | 'rectangle';
  currentOrder: any;
  active: boolean;
}

const ZONE_COLORS: Record<string, string> = {
  indoor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
  outdoor: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
  rooftop: 'bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400',
  vip: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-450',
};

const ZONE_LABELS: Record<string, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  rooftop: 'Rooftop',
  vip: 'VIP',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'Maintenance',
};

export const TableManagement: React.FC = () => {
  const { t } = useTranslation();
  const [tables, setTables] = useState<TableItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableItem | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [qrTable, setQrTable] = useState<TableItem | null>(null);

  const [form, setForm] = useState({
    name: '',
    label: '',
    capacity: '4',
    zone: 'indoor' as 'indoor' | 'outdoor' | 'rooftop' | 'vip',
    shape: 'square' as 'square' | 'round' | 'rectangle',
    active: true,
  });

  const fetchTables = useCallback(async () => {
    try {
      const res = await api.get('/tables');
      if (res.data.success) setTables(res.data.data);
    } catch (error) {
      console.error('Failed to fetch tables', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const filteredTables = tables.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchZone = selectedZone === 'all' || t.zone === selectedZone;
    return matchSearch && matchZone;
  });

  const resetForm = () => {
    setForm({ name: '', label: '', capacity: '4', zone: 'indoor', shape: 'square', active: true });
    setEditingTable(null);
  };

  const openCreate = () => { resetForm(); setIsFormOpen(true); };

  const openEdit = (table: TableItem) => {
    setEditingTable(table);
    setForm({
      name: table.name,
      label: table.label,
      capacity: table.capacity.toString(),
      zone: table.zone,
      shape: table.shape,
      active: table.active,
    });
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: form.name.toUpperCase(),
        label: form.label,
        capacity: Number(form.capacity) || 4,
        zone: form.zone,
        shape: form.shape,
        active: form.active,
      };

      if (editingTable) {
        const res = await api.put(`/tables/${editingTable._id}`, payload);
        if (res.data.success) {
          setTables(prev => prev.map(t => t._id === editingTable._id ? res.data.data : t));
        }
      } else {
        const res = await api.post('/tables', payload);
        if (res.data.success) {
          setTables(prev => [res.data.data, ...prev]);
        }
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save table', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await api.delete(`/tables/${deleteTarget._id}`);
      if (res.data.success) {
        setTables(prev => prev.filter(t => t._id !== deleteTarget._id));
      }
    } catch (error) {
      console.error('Failed to delete table', error);
    }
    setDeleteTarget(null);
  };

  const handleSeed = async () => {
    try {
      const res = await api.post('/tables/seed');
      if (res.data.success) {
        setTables(res.data.data);
      }
    } catch (error: any) {
      console.error('Failed to seed tables', error);
    }
  };

  const handleFreeTable = async (table: TableItem) => {
    try {
      const res = await api.put(`/tables/${table._id}/status`, { status: 'available' });
      if (res.data.success) {
        setTables(prev => prev.map(t => t._id === table._id ? { ...t, status: 'available', currentOrder: null } : t));
      }
    } catch (error) {
      console.error('Failed to free table', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div><div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" /></div>
        <div className="bg-white dark:bg-zinc-950 rounded-lg border"><div className="h-12 border-b bg-zinc-50 dark:bg-zinc-900 rounded-t-lg" />
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="flex items-center gap-4 p-4 border-b"><div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" /></div>))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="pb-4 border-b border-border/40 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('tableManagement.title', 'Table Management')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('tableManagement.subtitle', 'Manage your cafe table layout and seating')}</p>
        </div>
        <div className="flex gap-2">
          {tables.length === 0 && (
            <Button onClick={handleSeed} variant="outline" className="cursor-pointer">
              <Settings className="size-4 mr-1.5" /> {t('tableManagement.seed', 'Seed Default Tables')}
            </Button>
          )}
          <Button onClick={openCreate} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer">
            <Plus className="size-4 mr-1.5" /> {t('tableManagement.addTable', 'Add Table')}
          </Button>
        </div>
      </div>
      {/* Zone Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg w-fit">
          {['all', 'indoor', 'outdoor', 'rooftop', 'vip'].map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${selectedZone === zone
                ? 'bg-[#0A422D] text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {zone === 'all' ? t('tableManagement.allZones', 'All') : zone.charAt(0).toUpperCase() + zone.slice(1)}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input type="text" placeholder={t('tableManagement.searchPlaceholder', 'Search tables...')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white pl-9 h-9" />
        </div>
      </div>
      {filteredTables.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          {tables.length === 0
            ? t('tableManagement.noTables', 'No tables configured. Click "Seed Default Tables" to get started.')
            : t('tableManagement.noResults', 'No tables found.')
          }
        </div>
      ) : (
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('tableManagement.table.name', 'Name')}</TableHead>
                  <TableHead>{t('tableManagement.table.capacity', 'Capacity')}</TableHead>
                  <TableHead>{t('tableManagement.table.zone', 'Zone')}</TableHead>
                  <TableHead>{t('tableManagement.table.shape', 'Shape')}</TableHead>
                  <TableHead>{t('tableManagement.table.status', 'Status Meja')}</TableHead>
                  <TableHead>{t('tableManagement.table.active', 'Status')}</TableHead>
                  <TableHead>{t('tableManagement.table.order', 'Current Order')}</TableHead>
                  <TableHead className="text-right">{t('tableManagement.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => (
                  <TableRow key={table._id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-[13px]">
                      <span className="flex items-center gap-1.5">
                        <Armchair className="size-3.5 text-[#0A422D]" />
                        {table.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{table.capacity} {t('tableManagement.seats', 'seats')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`rounded text-[10px] py-0 h-4 ${ZONE_COLORS[table.zone]}`}>
                        {t(`tableManagement.zones.${table.zone}`, ZONE_LABELS[table.zone])}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{t(`tableManagement.shapes.${table.shape}`, table.shape)}</TableCell>
                    <TableCell>
                      {table.status === 'available' ? (
                        <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                          {t(`tableManagement.statuses.${table.status}`, STATUS_LABELS[table.status])}
                        </Badge>
                      ) : table.status === 'occupied' ? (
                        <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                          {t(`tableManagement.statuses.${table.status}`, STATUS_LABELS[table.status])}
                        </Badge>
                      ) : table.status === 'reserved' ? (
                        <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                          {t(`tableManagement.statuses.${table.status}`, STATUS_LABELS[table.status])}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded text-[10px] py-0 h-4">
                          {t(`tableManagement.statuses.${table.status}`, STATUS_LABELS[table.status])}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.active ? (
                        <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400">
                          {t('tableManagement.active', 'Aktif')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded text-[10px] py-0 h-4 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                          {t('tableManagement.inactive', 'Nonaktif')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {table.currentOrder ? table.currentOrder.receiptNumber || '-' : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="icon-xs" variant="outline" onClick={() => setQrTable(table)} className="cursor-pointer" title="Generate QR Code">
                          <QrCode className="size-3" />
                        </Button>
                        {table.status === 'occupied' && (
                          <Button size="icon-xs" variant="outline" onClick={() => handleFreeTable(table)} className="cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" title={t('tableManagement.freeTable', 'Free Table')}>
                            <Unlock className="size-3" />
                          </Button>
                        )}
                        <Button size="icon-xs" variant="outline" onClick={() => openEdit(table)} className="cursor-pointer">
                          <Pencil className="size-3" />
                        </Button>
                        <Button size="icon-xs" variant="destructive" onClick={() => setDeleteTarget(table)} className="cursor-pointer">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) { setIsFormOpen(false); resetForm() } }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-left shadow-xl">
          <DialogHeader className="border-b border-[#EBEAE4] dark:border-[#2D2D2A] pb-4">
            <DialogTitle className="text-lg font-black text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none">
              {editingTable ? t('tableManagement.editTable', 'Edit Table') : t('tableManagement.createTable', 'Add Table')}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1 block">
              {editingTable ? t('tableManagement.editDesc', 'Update the table details.') : t('tableManagement.createDesc', 'Add a new table to the layout.')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">{t('tableManagement.form.code', 'Table Code')} *</label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value.toUpperCase() }))} placeholder="e.g. A1" className="uppercase tracking-wider font-bold" disabled={!!editingTable} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">{t('tableManagement.form.label', 'Display Label')} *</label>
                <Input value={form.label} onChange={(e) => setForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Table A1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">{t('tableManagement.form.capacity', 'Capacity')} *</label>
                <Input type="number" min="1" max="20" value={form.capacity} onChange={(e) => setForm(p => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">{t('tableManagement.form.zone', 'Zone')} *</label>
                <select value={form.zone} onChange={(e) => setForm(p => ({ ...p, zone: e.target.value as any }))} className="h-9 px-3 border border-input bg-background rounded-lg text-sm cursor-pointer">
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="rooftop">Rooftop</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-gray-700 dark:text-gray-300">{t('tableManagement.form.shape', 'Shape')} *</label>
                <select value={form.shape} onChange={(e) => setForm(p => ({ ...p, shape: e.target.value as any }))} className="h-9 px-3 border border-input bg-background rounded-lg text-sm cursor-pointer">
                  <option value="square">Square</option>
                  <option value="round">Round</option>
                  <option value="rectangle">Rectangle</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="table-active" checked={form.active} onChange={(e) => setForm(p => ({ ...p, active: e.target.checked }))} className="rounded border-gray-300 cursor-pointer" />
              <label htmlFor="table-active" className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer">{t('tableManagement.form.active', 'Active')}</label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EBEAE4] dark:border-[#2D2D2A]">
            <Button variant="outline" size="sm" onClick={() => { setIsFormOpen(false); resetForm() }} className="cursor-pointer">{t('orderManagement.invoiceDialog.close', 'Cancel')}</Button>
            <Button size="sm" onClick={handleSave} disabled={!form.name.trim() || !form.label.trim()} className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer">
              {editingTable ? t('tableManagement.saveChanges', 'Save Changes') : t('tableManagement.createTable', 'Add Table')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Trash2 className="size-5 text-red-500" />{t('tableManagement.deleteTitle', 'Delete Table')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tableManagement.deleteConfirm', 'Are you sure you want to delete table "{{name}}"?', { name: deleteTarget?.label || '' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('orderManagement.invoiceDialog.close', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>{t('tableManagement.deleteBtn', 'Delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent className="sm:max-w-xs bg-white dark:bg-[#1C1C19] border border-[#EBEAE4] dark:border-[#2D2D2A] rounded-lg p-6 text-center shadow-xl">
          <DialogHeader className="border-b pb-3 mb-4">
            <DialogTitle className="text-base font-black text-[#0A422D] dark:text-[#4ADE80]">QR Code {qrTable?.label}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pindai untuk melakukan pemesanan mandiri
            </DialogDescription>
          </DialogHeader>
          {qrTable && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-lg border border-zinc-200 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/menu?table=${qrTable.label}`)}`}
                  alt={`QR Code ${qrTable.label}`}
                  className="size-48"
                />
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 break-all select-all font-bold">
                {`${window.location.origin}/menu?table=${qrTable.label}`}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(`${window.location.origin}/menu?table=${qrTable.label}`)}`;
                  const a = document.createElement('a');
                  a.href = url;
                  a.target = '_blank';
                  a.download = `QR_${qrTable.label}.png`;
                  a.click();
                }}
                className="bg-[#0A422D] hover:bg-[#0A422D]/95 text-white w-full text-xs font-bold"
              >
                Cetak / Buka QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
