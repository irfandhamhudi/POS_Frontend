import React, { useState, useEffect } from 'react'
import { useAuth } from 'src/features/auth/context/AuthContext'
import api from 'src/api'
import {
  Dialog,
  DialogContent,
} from 'src/components/ui/dialog'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import {
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  UserLock,
  User,
} from 'lucide-react'

interface AccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const AccountDialog: React.FC<AccountDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth()

  // --- Profile state ---
  const [name, setName] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  // --- Password state ---
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && user) {
      setName(user.name)
      setProfileMsg(null)
      setPasswordMsg(null)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [open, user])

  if (!user) return null

  // ----------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setProfileLoading(true)
    setProfileMsg(null)

    try {
      const response = await api.put('/auth/profile', { name: name.trim() })
      if (response.data.success) {
        setProfileMsg({
          type: 'success',
          text: 'Display name updated successfully.',
        })
      }
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill in all password fields.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }

    setPasswordLoading(true)
    try {
      const response = await api.put('/auth/password', {
        currentPassword,
        newPassword,
      })
      if (response.data.success) {
        setPasswordMsg({ type: 'success', text: 'Password changed successfully.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  // const initials = (user.name || '')
  //   .trim()
  //   .split(/\s+/)
  //   .map((n) => n[0])
  //   .join('')
  //   .substring(0, 2)
  //   .toUpperCase() || 'US'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-white border border-[#EBEAE4] dark:bg-[#1C1C19] dark:border-[#2D2D2A] p-4 rounded-lg text-left max-h-[85vh] flex flex-col gap-0 overflow-hidden">

        <div className="px-3 flex-1 overflow-y-auto py-4 flex flex-col gap-6 no-scrollbar">
          {/* User info summary banner */}
          <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg text-center">
            <div className="size-18 border-2 border-[#0A422D]/20 dark:border-emerald-500/20 bg-[#0A422D]/10 dark:bg-emerald-500/10 text-[#0A422D] dark:text-[#4ADE80] flex items-center justify-center rounded-full shadow-xs">
              {user.role === 'admin' ? (
                <UserLock className="size-8" />
              ) : (
                <User className="size-8" />
              )}
            </div>
            <div className="flex flex-col items-center">
              <p className="font-bold text-foreground text-sm leading-snug">{user.name}</p>
              <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Profile Section */}
            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4 text-xs">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b pb-1">
                Profile Info
              </h3>

              <div className="flex flex-col gap-1.5">
                <Label className="font-semibold text-muted-foreground">Username</Label>
                <div className="flex h-9 w-full rounded-md border border-border bg-muted/50 px-3 items-center text-muted-foreground font-mono">
                  @{user.username}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-name" className="font-semibold text-foreground">
                  Display Name
                </Label>
                <Input
                  id="acc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="h-9"
                />
              </div>

              {profileMsg && (
                <div className={`flex items-start gap-1.5 rounded px-2.5 py-2 text-[10px] font-medium border ${profileMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                  : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
                  }`}>
                  {profileMsg.type === 'success'
                    ? <CheckCircle2 className="size-3 shrink-0 mt-0.5" />
                    : <AlertCircle className="size-3 shrink-0 mt-0.5" />
                  }
                  <span className="leading-normal">{profileMsg.text}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={profileLoading}
                className="bg-[#0A422D] hover:bg-[#0A422D]/90 text-white cursor-pointer gap-2 self-end h-8 text-[11px]"
                size="sm"
              >
                <Save className="size-3" />
                {profileLoading ? 'Saving...' : 'Save Name'}
              </Button>
            </form>

            <div className="h-px bg-border/60 my-1" />

            {/* Password Section */}
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 text-xs">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 border-b pb-1">
                <KeyRound className="size-3.5" /> Security
              </h3>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-cur-pw" className="font-semibold text-foreground">
                  Current Password
                </Label>
                <Input
                  id="acc-cur-pw"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  required
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-new-pw" className="font-semibold text-foreground">
                  New Password
                </Label>
                <Input
                  id="acc-new-pw"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-confirm-pw" className="font-semibold text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="acc-confirm-pw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="h-9"
                />
              </div>

              {passwordMsg && (
                <div className={`flex items-start gap-1.5 rounded px-2.5 py-2 text-[10px] font-medium border ${passwordMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400'
                  : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400'
                  }`}>
                  {passwordMsg.type === 'success'
                    ? <CheckCircle2 className="size-3 shrink-0 mt-0.5" />
                    : <AlertCircle className="size-3 shrink-0 mt-0.5" />
                  }
                  <span className="leading-normal">{passwordMsg.text}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={passwordLoading}
                className="bg-amber-600 hover:bg-amber-600/90 text-white cursor-pointer gap-2 self-end h-8 text-[11px]"
                size="sm"
              >
                <KeyRound className="size-3" />
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer text-xs"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
