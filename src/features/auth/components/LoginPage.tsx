import React from "react"
import { LoginForm } from "src/components/login-form"

export const LoginPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 md:p-10 overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 dark:bg-emerald-950/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 dark:bg-amber-950/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] rounded-full bg-emerald-600/5 dark:bg-emerald-900/10 blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md md:max-w-4xl flex justify-center">
        <LoginForm className="w-full" />
      </div>
    </div>
  )
}

