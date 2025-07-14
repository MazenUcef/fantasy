import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { FaUser, FaLock, FaFutbol, FaRunning, FaShieldAlt, FaCheck, FaSpinner } from "react-icons/fa";
import { motion } from "framer-motion";
import { useUnifiedAuth } from "../api/AuthApi";
import { useNavigate } from "react-router";
import type { RootState } from "../store";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

type AuthFormData = {
  email: string;
  password: string;
};

const floatingBalls = [
  { id: 1, color: "bg-blue-500", size: "w-4 h-4", position: "top-1/4 left-1/4" },
  { id: 2, color: "bg-green-500", size: "w-6 h-6", position: "top-1/3 right-1/5" },
  { id: 3, color: "bg-yellow-500", size: "w-5 h-5", position: "bottom-1/4 left-1/3" },
  { id: 4, color: "bg-red-500", size: "w-7 h-7", position: "bottom-1/3 right-1/4" },
];

const AuthPage = () => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const { Register, teamCreationStatus, user } = useUnifiedAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigate only when authenticated and team creation is complete
  useEffect(() => {
    if (teamCreationStatus === "completed" && user?.hasTeam) {
      toast.success("Authentication successful!");
      navigate("/home");
    }
  }, [isAuthenticated, teamCreationStatus, user, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      await Register(data);
    } catch (error) {
      setIsSubmitting(false);
      toast.error(typeof error === "string" ? error : "Authentication failed");
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    reset();
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden">
      {/* Floating balls animation */}
      {floatingBalls.map((ball) => (
        <motion.div
          key={ball.id}
          className={`absolute rounded-full ${ball.color} ${ball.size} ${ball.position}`}
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center justify-center mb-4">
              <FaFutbol className="text-4xl text-yellow-400 mr-2" />
              <h1 className="text-4xl font-bold text-white">
                Fantasy Team Manager
              </h1>
            </div>
            <p className="text-gray-300">
              {isLogin ? "Sign in to manage your dream team" : "Join to create your ultimate squad"}
            </p>
          </motion.div>

          {/* Auth card */}
          <motion.div
            className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-700"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                className={`flex-1 py-4 font-medium ${
                  isLogin ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-400"
                } cursor-pointer`}
                onClick={() => switchMode(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-4 font-medium ${
                  !isLogin ? "text-green-400 border-b-2 border-green-400" : "text-gray-400"
                } cursor-pointer`}
                onClick={() => switchMode(false)}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {/* Email field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-gray-300 mb-2">Email</label>
                <Controller
                  name="email"
                  control={control}
                  rules={{
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="text-gray-500" />
                      </div>
                      <input
                        {...field}
                        type="email"
                        className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="player@fantasyteam.com"
                        disabled={isSubmitting || teamCreationStatus === "in-progress" || teamCreationStatus === "checking"}
                      />
                    </div>
                  )}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </motion.div>

              {/* Password field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-gray-300 mb-2">Password</label>
                <Controller
                  name="password"
                  control={control}
                  rules={{
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  }}
                  render={({ field }) => (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="text-gray-500" />
                      </div>
                      <input
                        {...field}
                        type="password"
                        className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white placeholder-gray-400"
                        placeholder="••••••••"
                        disabled={isSubmitting || teamCreationStatus === "in-progress" || teamCreationStatus === "checking"}
                      />
                    </div>
                  )}
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                )}
              </motion.div>

              {/* Submit button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  type="submit"
                  className={`w-full py-3 px-4 ${
                    teamCreationStatus === "in-progress" || teamCreationStatus === "checking"
                      ? "bg-blue-600"
                      : teamCreationStatus === "completed"
                      ? "bg-green-600"
                      : "bg-gradient-to-r from-yellow-500 to-green-500"
                  } text-white font-bold rounded-lg flex items-center justify-center gap-2`}
                  disabled={isSubmitting || teamCreationStatus === "in-progress" || teamCreationStatus === "checking"}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {(isSubmitting || teamCreationStatus === "in-progress" || teamCreationStatus === "checking") ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      {teamCreationStatus === "in-progress" || teamCreationStatus === "checking" ? (
                        "Creating your team..."
                      ) : isLogin ? (
                        "Signing in..."
                      ) : (
                        "Creating account..."
                      )}
                    </>
                  ) : teamCreationStatus === "completed" ? (
                    <>
                      <FaCheck />
                      Team ready! Redirecting...
                    </>
                  ) : isLogin ? (
                    <>
                      <FaRunning />
                      Sign In
                    </>
                  ) : (
                    <>
                      <FaShieldAlt />
                      Register Team
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Footer links */}
            <div className="px-6 pb-6 text-center">
              <motion.p
                className="text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {isLogin ? (
                  <>
                    New manager?{" "}
                    <button onClick={() => switchMode(false)} className="text-yellow-400 hover:underline">
                      Create your team
                    </button>
                  </>
                ) : (
                  <>
                    Already have a team?{" "}
                    <button onClick={() => switchMode(true)} className="text-green-400 hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        {/* Page footer */}
        <motion.div
          className="mt-8 text-center text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>© {new Date().getFullYear()} Fantasy Team Manager - Build your dream squad</p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;