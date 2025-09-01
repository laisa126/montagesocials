import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import { FiUser, FiLock, FiAtSign } from "react-icons/fi"
import { toast } from "sonner"

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [emailOrUsername, setEmailOrUsername] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const navigate = useNavigate()

  const isEmail = (input: string) => {
    return input.includes('@')
  }

  const handleAuth = async () => {
    setShake(false)
    setLoading(true)
    
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        })
        if (signUpError) throw signUpError
        
        if (signUpData.user) {
          await supabase.from("profiles").insert({ 
            user_id: signUpData.user.id, 
            username 
          })
        }
        toast.success("Account created! Check your email to verify.")
      } else {
        // For login, try as email first, then as username
        let loginEmail = emailOrUsername
        
        // If it doesn't look like an email, try to find user by username
        if (!isEmail(emailOrUsername)) {
          // First try to sign in with what they provided in case it's actually an email
          const { error: directError } = await supabase.auth.signInWithPassword({ 
            email: emailOrUsername, 
            password 
          })
          
          if (!directError) {
            toast.success("Welcome back!")
            navigate("/")
            return
          }
          
          // If direct login failed, inform user to use email
          throw new Error("Please use your email address to log in")
        }
        
        const { error: loginError } = await supabase.auth.signInWithPassword({ 
          email: loginEmail, 
          password 
        })
        if (loginError) throw loginError
        toast.success("Welcome back!")
      }
      navigate("/")
    } catch (err: any) {
      setShake(true)
      toast.error(err.message || "Invalid credentials")
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    const resetEmail = mode === "login" ? emailOrUsername : email
    if (!resetEmail) return toast.error("Enter your email first")
    if (!isEmail(resetEmail)) return toast.error("Please enter a valid email address")
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)
    if (error) toast.error(error.message)
    else toast.success("Check your email for password reset link")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      {/* Threads-style logo with Montage branding */}
      <div className="mb-12">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black text-3xl font-bold shadow-2xl">
          M
        </div>
      </div>

      {/* Auth card with Threads-style design */}
      <div
        className={clsx(
          "bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-sm p-8 space-y-6 transition-transform",
          shake && "animate-shake"
        )}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Log in" : "Sign up"}
          </h1>
          <p className="text-sm text-zinc-400">
            {mode === "login" ? "Welcome back to Montage" : "Join the conversation"}
          </p>
        </div>

        <div className="space-y-4">
          {/* Username or Email for login, separate fields for signup */}
          {mode === "login" ? (
            <div className="relative">
              <FiAtSign className="absolute top-3.5 left-3 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-zinc-700 bg-zinc-800 rounded-lg focus:ring-1 focus:ring-white focus:border-white outline-none transition text-white placeholder-zinc-400"
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <FiUser className="absolute top-3.5 left-3 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-zinc-700 bg-zinc-800 rounded-lg focus:ring-1 focus:ring-white focus:border-white outline-none transition text-white placeholder-zinc-400"
                />
              </div>
              <div className="relative">
                <FiAtSign className="absolute top-3.5 left-3 text-zinc-400 w-4 h-4" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-zinc-700 bg-zinc-800 rounded-lg focus:ring-1 focus:ring-white focus:border-white outline-none transition text-white placeholder-zinc-400"
                />
              </div>
            </>
          )}

          {/* Password */}
          <div className="relative">
            <FiLock className="absolute top-3.5 left-3 text-zinc-400 w-4 h-4" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-zinc-700 bg-zinc-800 rounded-lg focus:ring-1 focus:ring-white focus:border-white outline-none transition text-white placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Submit button with Montage gradient */}
        <button
          onClick={handleAuth}
          disabled={loading}
          className={clsx(
            "w-full py-3 rounded-lg font-semibold text-black text-sm bg-white",
            "hover:bg-zinc-200 transition-all",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? "Loading..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        {/* Forgot password for login only */}
        {mode === "login" && (
          <div className="text-center">
            <button 
              className="text-sm text-zinc-400 hover:text-white transition-colors" 
              onClick={handleReset}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Switch mode */}
        <div className="text-center pt-4 border-t border-zinc-700">
          <span className="text-sm text-zinc-400">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            className="text-sm font-semibold text-white hover:underline"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login")
              setEmailOrUsername("")
              setEmail("")
              setUsername("")
              setPassword("")
            }}
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </div>
      </div>
    </div>
  )
}