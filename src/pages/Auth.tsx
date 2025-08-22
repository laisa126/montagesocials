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
      }import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"
import clsx from "clsx"
import { FiUser, FiLock, FiAtSign } from "react-icons/fi"
import { toast } from "@/components/ui/sonner"

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
          // Since we can't access auth.users directly, we'll try a different approach
          // First try to sign in with what they provided in case it's actually an email
          const { error: directError } = await supabase.auth.signInWithPassword({ 
            email: emailOrUsername, 
            password 
          })
          
          if (!directError) {

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-threads-gray p-4">
      {/* Threads-style logo */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-threads-accent flex items-center justify-center text-white text-2xl font-bold">
          @
        </div>
      </div>

      {/* Auth card */}
      <div
        className={clsx(
          "bg-white rounded-2xl border border-threads-border w-full max-w-sm p-8 space-y-6 transition-transform",
          shake && "animate-shake"
        )}
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-threads-text mb-2">
            {mode === "login" ? "Log in" : "Sign up"}
          </h1>
          <p className="text-sm text-gray-500">
            {mode === "login" ? "Welcome back to Threads" : "Join the conversation"}
          </p>
        </div>

        <div className="space-y-4">
          {/* Username or Email for login, separate fields for signup */}
          {mode === "login" ? (
            <div className="relative">
              <FiAtSign className="absolute top-3.5 left-3 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border border-threads-border bg-white rounded-lg focus:ring-1 focus:ring-threads-accent focus:border-threads-accent outline-none transition text-threads-text placeholder-gray-400"
              />
            </div>
          ) : (
            <>
              <div className="relative">
                <FiUser className="absolute top-3.5 left-3 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-threads-border bg-white rounded-lg focus:ring-1 focus:ring-threads-accent focus:border-threads-accent outline-none transition text-threads-text placeholder-gray-400"
                />
              </div>
              <div className="relative">
                <FiAtSign className="absolute top-3.5 left-3 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-threads-border bg-white rounded-lg focus:ring-1 focus:ring-threads-accent focus:border-threads-accent outline-none transition text-threads-text placeholder-gray-400"
                />
              </div>
            </>
          )}

          {/* Password */}
          <div className="relative">
            <FiLock className="absolute top-3.5 left-3 text-gray-400 w-4 h-4" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-threads-border bg-white rounded-lg focus:ring-1 focus:ring-threads-accent focus:border-threads-accent outline-none transition text-threads-text placeholder-gray-400"
            />
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleAuth}
          disabled={loading}
          className={clsx(
            "w-full py-3 rounded-lg font-semibold text-white text-sm bg-threads-accent",
            "hover:bg-gray-800 transition-colors",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          {loading ? "Loading..." : mode === "login" ? "Log in" : "Sign up"}
        </button>

        {/* Forgot password for login only */}
        {mode === "login" && (
          <div className="text-center">
            <button 
              className="text-sm text-gray-500 hover:text-threads-text transition-colors" 
              onClick={handleReset}
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Switch mode */}
        <div className="text-center pt-4 border-t border-threads-border">
          <span className="text-sm text-gray-500">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            className="text-sm font-semibold text-threads-accent hover:underline"
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
            }      setLoading(false)
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
      <div
        className={clsx(
          "bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-6 transition-transform",
          shake && "animate-shake"
        )}
      >
        <h1 className="text-3xl font-extrabold text-center">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h1>

        <div className="space-y-4">
          {/* Email */}
          <div className="relative">
            <FiMail className="absolute top-3 left-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FiLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
            />
          </div>

          {/* Username (signup only) */}
          {mode === "signup" && (
            <div className="relative">
              <FiUser className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
              />
            </div>
          )}
        </div>

        {/* Submit button */}
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

        {/* Bottom links */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <button className="underline" onClick={handleReset}>
            Forgot password?
          </button>
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
  }      setLoading(false)
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
      <div
        className={clsx(
          "bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 space-y-6 transition-transform",
          shake && "animate-shake"
        )}
      >
        <h1 className="text-3xl font-extrabold text-center">
          {mode === "login" ? "Log In" : "Sign Up"}
        </h1>

        <div className="space-y-4">
          {/* Email */}
          <div className="relative">
            <FiMail className="absolute top-3 left-3 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <FiLock className="absolute top-3 left-3 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
            />
          </div>

          {/* Username (signup only) */}
          {mode === "signup" && (
            <div className="relative">
              <FiUser className="absolute top-3 left-3 text-gray-400" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border rounded-xl focus:ring-2 focus:ring-pink-400 outline-none transition"
              />
            </div>
          )}
        </div>

        {/* Submit button */}
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

        {/* Bottom links */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <button className="underline" onClick={handleReset}>
            Forgot password?
          </button>
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
    }      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) return toast.error("Enter your email first")
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) toast.error(error.message)
    else toast.success("Check your email for password reset link")
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
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
          }                  <Input
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

export default Auth;    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users to home
        if (session?.user) {
          navigate('/');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Password reset email sent! Check your inbox.');
          setIsForgotPassword(false);
        }
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Welcome back!');
        }
      } else {
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
