import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import { FiMail, FiLock, FiUser } from "react-icons/fi"
import { toast } from "@/components/ui/sonner"

export default function Auth() {
  const [mode, setMode] = useState<"login"|"signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async () => {
    setShake(false)
    setLoading(true)
    try {
      if (mode === "signup") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
        if (signUpError) throw signUpError
        await supabase.from("profiles").insert({ id: signUpData.user?.id, username })
        toast.success("Account created!")
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
        toast.success("Logged in!")
      }
      navigate("/") // redirect to Home/Feed
    } catch (err: any) {
      setShake(true)
      toast.error(err.message || "Invalid credentials")
      setTimeout(() => setShake(false), 500)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) return toast.error("Enter your email first")
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) toast.error(error.message)
    else toast.success("Check your email for password reset link")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 via-purple-50 to-white p-4">
      {/* Floating gradient logo */}
      <div className="mb-10">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
          M
        </div>
      </div>

      {/* Auth card */}
      <div className={clsx(
        "bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-6 transition-transform",
        shake && "animate-shake"
      )}>
        <h1 className="text-3xl font-extrabold text-center">{mode === "login" ? "Log In" : "Sign Up"}</h1>

        <div className="space-y-4">
          <div className="relative">
            <FiMail className="absolute top-3 left-3 text-gray-400"/>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
            />
          </div>

          <div className="relative">
            <FiLock className="absolute top-3 left-3 text-gray-400"/>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
            />
          </div>

          {mode === "signup" && (
            <div className="relative">
              <FiUser className="absolute top-3 left-3 text-gray-400"/>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e=>setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleAuth}
          disabled={loading}
          className={clsx(
            "w-full py-3 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-pink-500 to-purple-500",
            "hover:from-pink-600 hover:to-purple-600 transition",
            loading && "opacity-50"
          )}
        >
          {loading ? "Loading..." : mode === "login" ? "Log In" : "Sign Up"}
        </button>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <button className="underline" onClick={handleReset}>Forgot password?</button>
          <button
            className="font-semibold text-pink-500 underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Sign Up" : "Log In"}
          </button>
        </div>
      </div>
    </div>
  )
    }      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: formData.username,
              full_name: formData.fullName,
            }
          }
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created! Please check your email to verify your account.');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/src/assets/montage-icon.png" 
              alt="Montage" 
              className="h-16 w-16"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            {isForgotPassword ? 'Reset password' : (isLogin ? 'Welcome back' : 'Create account')}
          </CardTitle>
          <CardDescription>
            {isForgotPassword 
              ? 'Enter your email to reset your password'
              : (isLogin 
                ? 'Sign in to your Montage account' 
                : 'Join Montage to share your moments')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            {!isLogin && !isForgotPassword && (
              <>
                <div className="space-y-2">
                  <Input
                    name="username"
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    name="fullName"
                    type="text"
                    placeholder="Full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}
            
            {!isForgotPassword && (
              <div className="space-y-2 relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isForgotPassword ? 'Send reset email' : (isLogin ? 'Sign in' : 'Create account'))}
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            {!isForgotPassword && (
              <>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground block w-full"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : 'Already have an account? Sign in'
                  }
                </button>
                {isLogin && (
                  <button
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
            {isForgotPassword && (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
