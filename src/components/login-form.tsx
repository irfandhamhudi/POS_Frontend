import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "src/features/auth/context/AuthContext"
import { cn } from "src/lib/utils"
import { Button } from "src/components/ui/button"
import { Card, CardContent } from "src/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "src/components/ui/field"
import { Input } from "src/components/ui/input"
import { Eye, EyeOff, Lock, User, AlertCircle } from "lucide-react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Smooth artificial delay for feedback
    await new Promise((r) => setTimeout(r, 600))

    const result = await login(username, password)
    setIsLoading(false)

    if (!result.success) {
      setError(
        result.message === "Username atau password salah."
          ? "Incorrect username or password."
          : (result.message || "Login failed.")
      )
      return
    }

    if (result.user) {
      navigate(result.user.role === "admin" ? "/admin" : "/pos", { replace: true })
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="h-auto overflow-hidden p-0 border border-zinc-200/50 dark:border-zinc-800/40 dark:shadow-zinc-950/50 rounded-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Left Column: Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 md:p-14 flex flex-col justify-between gap-6">
            <FieldGroup className="gap-5">
              {/* Header section with brand logo & name */}
              <div className="flex items-center justify-center gap-3.5 mb-4 select-none">
                {/* Logo Box */}
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#0A422D] text-white shadow-md">
                  <span className="font-bold text-xl tracking-wider">G</span>
                </div>
                {/* Brand Name */}
                <div className="flex flex-col text-left">
                  <span className="font-bold text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none text-lg">GREEN</span>
                  <span className="font-bold text-[#0A422D] dark:text-[#4ADE80] tracking-tight leading-none text-lg">GROUNDS</span>
                  <span className="text-[10px] text-[#0A422D]/60 dark:text-[#4ADE80]/60 tracking-wider font-semibold uppercase mt-0.5">COFFEE</span>
                </div>
              </div>

              {/* Username Input */}
              <Field className="gap-1.5">
                <FieldLabel htmlFor="username" className="text-xs font-bold text-foreground/80">Username</FieldLabel>
                <div className="relative group/input">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-[#4ADE80] transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-9.5 h-11 text-sm bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:focus-visible:border-[#4ADE80] transition-all"
                  />
                </div>
              </Field>

              {/* Password Input */}
              <Field className="gap-1.5">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password" className="text-xs font-bold text-foreground/80">Password</FieldLabel>
                </div>
                <div className="relative group/input">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 group-focus-within/input:text-emerald-600 dark:group-focus-within/input:text-[#4ADE80] transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9.5 pr-10 h-11 text-sm bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-600 dark:focus-visible:border-[#4ADE80] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground/65 hover:text-emerald-600 dark:hover:text-[#4ADE80] transition-colors focus:outline-none cursor-pointer rounded"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {/* Error Alert Box */}
              {error && (
                <div className="flex items-start gap-2.5 text-xs text-red-800 bg-red-500/10 border border-red-500/20 rounded-lg p-3 font-medium leading-normal animate-in fade-in-50 slide-in-from-top-1 duration-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full font-bold bg-[#0A422D] hover:bg-[#0A422D]/90 active:scale-[0.98] text-white shadow-sm cursor-pointer transition-all duration-200 rounded-lg text-sm mt-1"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Demo Buttons */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-muted-foreground font-semibold">Demo</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setUsername("admin"); setPassword("admin123"); }}
                    className="h-10 text-xs font-bold border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-[#0A422D]/5 hover:border-[#0A422D]/30 transition-all"
                  >
                    Admin Demo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setUsername("kasir1"); setPassword("kasir123"); }}
                    className="h-10 text-xs font-bold border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-[#0A422D]/5 hover:border-[#0A422D]/30 transition-all"
                  >
                    POS Demo
                  </Button>
                </div>
              </div>
            </FieldGroup>

          </form>

          {/* Right Column: Premium Image */}
          <div className="h-auto relative hidden md:block bg-zinc-900">
            {/* Soft gradient overlay to blend image */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-black/10 z-10" />
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1000&auto=format&fit=crop"
              alt="Green Grounds Coffee Shop"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7] dark:grayscale-15"
            />
            {/* Branding badge over the image */}
            {/* <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
              <p className="text-sm font-semibold tracking-wider uppercase text-emerald-400">Green Grounds Coffee</p>
              <h2 className="text-xl font-bold leading-tight mt-1">Crafting Premium Coffee & POS Solutions</h2>
              <div className="mt-3 rounded-md bg-white/10 backdrop-blur-sm border border-white/15 p-3 text-[11px] text-white/80 space-y-1">
                <p className="font-bold text-white text-xs mb-1.5">Demo Credentials</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white/90">Admin</span>
                  <span className="font-mono">admin / admin123</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white/90">Kasir</span>
                  <span className="font-mono">kasir1 / kasir123</span>
                </div>
                <p>NB : Buka di 2 halaman ka kalo mau lihat admin dan sistem POSnya</p>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
