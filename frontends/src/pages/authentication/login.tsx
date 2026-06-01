import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { loginUser } from "@/services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res.data.access_token) {
        localStorage.setItem("token", res.data.access_token);
        toast.success("Logged in successfully");
        navigate("/dashboard");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center mb-2">
            <img src="/uploads/company_logo.png" alt="IGL" className="h-full w-full object-contain" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-slate-900">
            IGL Portal
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to manage visitor operations
          </p>
        </div>
        
        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleLogin}>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access the portal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="admin@igl.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </CardContent>
            <CardFooter className="flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign In
              </Button>
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => navigate('/register')}>
                Open Public Kiosk Mode
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;