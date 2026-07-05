import React, { useState, useEffect } from 'react'
import { useAuth } from 'src/features/auth/context/AuthContext'
import api from 'src/api'
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
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from 'src/components/ui/alert-dialog'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Shield,
  Key,
  User,
  UserLock,
  Check,
  ChevronDown,
  AlertTriangle,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'src/hooks/useTranslation'

interface UserDBItem {
  _id: string;
  username: string;
  name: string;
  role: 'admin' | 'cashier';
  avatar?: string;
  disabled?: boolean;
  bankName?: string;
  bankAccountNumber?: string;
  createdAt?: string;
}

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth()
  const { t } = useTranslation()
  const [usersList, setUsersList] = useState<UserDBItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'cashier'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDBItem | null>(null)

  // Form fields state
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'cashier'>('cashier')
  const [disabled, setDisabled] = useState(false)
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')

  // Alert & Confirmation states
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; type?: 'info' | 'error' | 'warning' } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<UserDBItem | null>(null)

  // Load users from API
  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      if (response.data.success) {
        setUsersList(response.data.data)
      }
    } catch (err) {
      console.error('Failed to load users', err)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Handle loading state
  const isLoading = false // You can add a real loading state if you fetch data from an API

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-4 w-72 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
          <div className="h-9 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>

        {/* Toolbar Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-9 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-9 w-full md:w-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        </div>

        {/* Table Skeleton */}
        <div className="bg-white dark:bg-zinc-950 rounded-lg border">
          <div className="h-12 border-b bg-zinc-50 dark:bg-zinc-900 rounded-t-lg" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b">
              <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto" />
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

  // Clear/Reset form fields
  const resetForm = () => {
    setUsername('')
    setName('')
    setPassword('')
    setRole('cashier')
    setDisabled(false)
    setBankName('')
    setBankAccountNumber('')
    setEditingUser(null)
  }

  // Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !name.trim() || !password.trim()) return

    try {
      const response = await api.post('/users', {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        password,
        role,
      })
      if (response.data.success) {
        await loadUsers()
        setIsAddOpen(false)
        resetForm()
      }
    } catch (err: any) {
      setAlertConfig({
        title: t('common.error', 'Error'),
        message: err.response?.data?.message || 'Failed to create user',
        type: 'error',
      })
    }
  }

  // Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !name.trim()) return

    try {
      const payload: any = {
        name: name.trim(),
        role,
        disabled,
        bankName: bankName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
      }
      if (password) {
        payload.password = password
      }
      const response = await api.put(`/users/${editingUser._id}`, payload)
      if (response.data.success) {
        await loadUsers()
        setEditingUser(null)
        resetForm()
      }
    } catch (err: any) {
      setAlertConfig({
        title: t('common.error', 'Error'),
        message: err.response?.data?.message || 'Failed to update user',
        type: 'error',
      })
    }
  }

  // Delete User Click Handler
  const handleDeleteClick = (userToDelete: UserDBItem) => {
    if (currentUser && currentUser.username === userToDelete.username) {
      setAlertConfig({
        title: t('common.warning', 'Warning'),
        message: t('userManagement.alerts.deleteSelf'),
        type: 'warning',
      })
      return
    }
    if (userToDelete.username === 'admin') {
      setAlertConfig({
        title: t('common.warning', 'Warning'),
        message: t('userManagement.alerts.deleteAdmin'),
        type: 'warning',
      })
      return
    }

    setDeleteTarget(userToDelete)
  }

  // Confirm delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/users/${deleteTarget._id}`)
      await loadUsers()
    } catch (err: any) {
      setAlertConfig({
        title: t('common.error', 'Error'),
        message: err.response?.data?.message || 'Failed to delete user',
        type: 'error',
      })
    } finally {
      setDeleteTarget(null)
    }
  }

  // Toggle user status (active/disabled)
  const handleToggleStatus = async (target: UserDBItem) => {
    if (currentUser && currentUser.username === target.username) {
      setAlertConfig({
        title: t('common.warning', 'Warning'),
        message: t('userManagement.alerts.disableSelf'),
        type: 'warning',
      })
      return
    }
    if (target.username === 'admin') {
      setAlertConfig({
        title: t('common.warning', 'Warning'),
        message: t('userManagement.alerts.disableAdmin'),
        type: 'warning',
      })
      return
    }

    try {
      await api.put(`/users/${target._id}`, { disabled: !target.disabled })
      await loadUsers()
    } catch (err: any) {
      setAlertConfig({
        title: t('common.error', 'Error'),
        message: err.response?.data?.message || 'Failed to update user status',
        type: 'error',
      })
    }
  }

  // Filter user list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter
    const matchesStatus =
      statusFilter === 'all' ? true
        : statusFilter === 'active' ? !u.disabled
          : !!u.disabled
    return matchesSearch && matchesRole && matchesStatus
  })

  // Start Edit helper
  const startEdit = (target: UserDBItem) => {
    setEditingUser(target)
    setUsername(target.username)
    setName(target.name)
    setRole(target.role)
    setDisabled(!!target.disabled)
    setBankName(target.bankName || '')
    setBankAccountNumber(target.bankAccountNumber || '')
    setPassword('') // Password empty, only filled if changing
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="pb-4 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('userManagement.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('userManagement.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsAddOpen(true)
          }}
          className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer self-start md:self-auto gap-2"
        >
          <Plus className="size-4" /> {t('userManagement.addNewUser')}
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Left: Role + Status filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Role filter */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${roleFilter === 'all' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('userManagement.allRole')}
            </button>
            <button
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${roleFilter === 'admin' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('userManagement.adminRole')}
            </button>
            <button
              onClick={() => setRoleFilter('cashier')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${roleFilter === 'cashier' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('userManagement.cashierRole')}
            </button>
          </div>

          {/* Status filter */}
          <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'all' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('userManagement.allStatus')}
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'active' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('userManagement.activeStatus')}
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer transition-colors ${statusFilter === 'disabled' ? 'bg-[#0A422D] text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t('userManagement.disabledStatus')}
            </button>
          </div>
        </div>

        {/* Right: Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            type="text"
            placeholder={t('userManagement.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white pl-9 h-9"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t('userManagement.usersTable.user')}</TableHead>
                <TableHead>{t('userManagement.usersTable.fullName')}</TableHead>
                <TableHead>{t('userManagement.usersTable.username')}</TableHead>
                <TableHead>{t('userManagement.usersTable.role')}</TableHead>
                <TableHead className="text-center">{t('userManagement.usersTable.status')}</TableHead>
                <TableHead className="text-right">{t('userManagement.usersTable.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => {
                const isSelf = currentUser?.username === u.username
                return (
                  <TableRow key={u.username} className={`hover:bg-muted/30 ${isSelf && 'bg-emerald-50/20 dark:bg-emerald-950/5'}`}>
                    <TableCell>
                      <div className="size-8 border border-[#0A422D]/20 dark:border-emerald-500/20 bg-[#0A422D]/10 dark:bg-emerald-500/10 text-[#0A422D] dark:text-[#4ADE80] flex items-center justify-center rounded-lg">
                        {u.role === 'admin' ? (
                          <UserLock className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-[13px] text-foreground">{u.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      @{u.username}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        {u.role === 'admin' ? (
                          <>
                            <Shield className="size-3.5 text-[#0A422D] fill-[#0A422D]/10" />
                            <span className="font-semibold text-foreground">{t('userManagement.adminRole')}</span>
                          </>
                        ) : (
                          <>
                            <Users className="size-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{t('userManagement.cashierRole')}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={isSelf || u.username === 'admin'}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${u.disabled
                            ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 cursor-pointer hover:bg-red-100/50'
                            : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400 cursor-pointer hover:bg-green-100/50'
                            } disabled:opacity-80 disabled:cursor-not-allowed`}
                          title={isSelf ? t('userManagement.alerts.disableSelf') : t('userManagement.usersTable.toggleStatusTooltip')}
                        >
                          {u.disabled ? (
                            <>
                              <UserX className="size-2.5" /> {t('userManagement.disabledStatus')}
                            </>
                          ) : (
                            <>
                              <UserCheck className="size-2.5" /> {t('userManagement.activeStatus')}
                            </>
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon-xs"
                          variant="outline"
                          onClick={() => startEdit(u)}
                          className="cursor-pointer"
                          title={t('userManagement.usersTable.editTooltip')}
                        >
                          <Edit className="size-3 text-muted-foreground hover:text-[#0A422D]" />
                        </Button>
                        <Button
                          size="icon-xs"
                          variant="destructive"
                          disabled={isSelf || u.username === 'admin'}
                          onClick={() => handleDeleteClick(u)}
                          className="cursor-pointer"
                          title={t('userManagement.usersTable.deleteTooltip')}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {t('userManagement.usersTable.noUsers')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => !open && setIsAddOpen(false)}>
        <DialogContent className="max-w-md bg-white border border-[#EBEAE4] dark:bg-[#1C1C19] dark:border-[#2D2D2A] p-6 rounded-lg text-left shadow-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg font-bold text-[#0A422D] dark:text-[#4ADE80]">{t('userManagement.addDialog.title')}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {t('userManagement.addDialog.subtitle')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 py-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-fullname" className="font-semibold text-foreground">{t('userManagement.addDialog.fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                <Input
                  id="add-fullname"
                  type="text"
                  placeholder="e.g. Amanda Cole"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-username" className="font-semibold text-foreground">{t('userManagement.addDialog.username')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground/75 select-none">@</span>
                  <Input
                    id="add-username"
                    type="text"
                    placeholder="e.g. amanda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    required
                    className="pl-7 h-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="add-role" className="font-semibold text-foreground">{t('userManagement.addDialog.accessRole')}</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75 pointer-events-none" />
                  <select
                     id="add-role"
                     value={role}
                     onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
                     className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none cursor-pointer"
                  >
                    <option value="cashier">{t('userManagement.cashierRole')}</option>
                    <option value="admin">{t('userManagement.adminRole')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/80 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-password" className="font-semibold text-foreground">{t('userManagement.addDialog.password')}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                <Input
                  id="add-password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="cursor-pointer">
                {t('userManagement.addDialog.cancel')}
              </Button>
              <Button type="submit" className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer" size="sm">
                {t('userManagement.addDialog.createUser')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md bg-white border border-[#EBEAE4] dark:bg-[#1C1C19] dark:border-[#2D2D2A] p-6 rounded-lg text-left shadow-xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg font-bold text-[#0A422D] dark:text-[#4ADE80]">{t('userManagement.editDialog.title')}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {t('userManagement.editDialog.subtitle', { name: editingUser?.username })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 py-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-fullname" className="font-semibold text-foreground">{t('userManagement.addDialog.fullName')}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                <Input
                  id="edit-fullname"
                  type="text"
                  placeholder="e.g. Amanda Cole"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-muted-foreground">{t('userManagement.editDialog.usernameLocked')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground/50 select-none">@</span>
                  <div className="flex h-9 w-full rounded-md border border-border bg-muted/50 pl-7 pr-3 items-center text-muted-foreground/70 select-none font-mono">
                    {editingUser?.username}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-role" className="font-semibold text-foreground">{t('userManagement.addDialog.accessRole')}</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75 pointer-events-none" />
                  <select
                    id="edit-role"
                    value={role}
                    disabled={editingUser?.username === 'admin' || editingUser?.username === currentUser?.username}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
                    className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-75 disabled:cursor-not-allowed appearance-none cursor-pointer"
                  >
                    <option value="cashier">{t('userManagement.cashierRole')}</option>
                    <option value="admin">{t('userManagement.adminRole')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/80 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-password" className="font-semibold text-foreground">{t('userManagement.editDialog.changePassword')}</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                <Input
                  id="edit-password"
                  type="password"
                  placeholder={t('userManagement.editDialog.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-bank-name" className="font-semibold text-foreground">{t('userManagement.editDialog.bankName', 'Nama Bank')}</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                  <Input
                    id="edit-bank-name"
                    type="text"
                    placeholder="e.g. BCA"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-bank-account" className="font-semibold text-foreground">{t('userManagement.editDialog.bankAccount', 'No. Rekening')}</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/75" />
                  <Input
                    id="edit-bank-account"
                    type="text"
                    placeholder="e.g. 1234567890"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Custom Checkbox - follows MenuManagement style but with red layout */}
            {editingUser?.username !== 'admin' && editingUser?.username !== currentUser?.username && (
              <div
                onClick={() => setDisabled(!disabled)}
                className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none group w-fit"
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-200 shrink-0 ${disabled
                    ? 'bg-red-650 border-red-600 bg-red-600 text-white scale-100 shadow-sm shadow-red-600/10'
                    : 'border-border bg-background group-hover:border-red-600 dark:border-border'
                    }`}
                >
                  {disabled && <Check className="w-2.5 h-2.5 stroke-[3.5]" />}
                </div>
                <span className="font-semibold text-red-600 text-xs select-none">{t('userManagement.editDialog.disableLogin')}</span>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(null)} className="cursor-pointer">
                {t('userManagement.addDialog.cancel')}
              </Button>
              <Button type="submit" className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer" size="sm">
                {t('userManagement.editDialog.saveChanges')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Config Dialog */}
      <AlertDialog open={!!alertConfig} onOpenChange={(open) => !open && setAlertConfig(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {alertConfig?.type === 'error' ? (
                <AlertTriangle className="size-5 text-red-500" />
              ) : (
                <Shield className="size-5 text-amber-500" />
              )}
              {alertConfig?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{alertConfig?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertConfig(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-red-500" />
              {t('userManagement.deleteDialog.title', 'Delete User')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('userManagement.alerts.deleteConfirm', { name: deleteTarget?.name, username: deleteTarget?.username })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>
              {t('userManagement.addDialog.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm}>
              {t('userManagement.usersTable.deleteTooltip', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
