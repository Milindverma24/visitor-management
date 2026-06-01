import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, ShieldCheck, FileText, LogOut, Menu, Bell } from "lucide-react";
import { cn } from "@/utils/helpers";
import { Toaster, toast } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Departments", href: "/departments", icon: FileText },
  { name: "Visitors", href: "/visitors", icon: Users },
  { name: "Approvals", href: "/approvals", icon: UserCheck },
  { name: "Check-In", href: "/checkin", icon: ShieldCheck },
  { name: "Check-Out", href: "/checkout", icon: LogOut, roles: ["SUPER_ADMIN", "ADMIN", "SECURITY"] },
  { name: "Meetings", href: "/meetings", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_HEAD", "EMPLOYEE"] },
  { name: "Interviews", href: "/interviews", icon: Users, roles: ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"] },
  { name: "Reports", href: "/reports", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN", "DEPARTMENT_HEAD"] },
  { name: "Audit Logs", href: "/audit", icon: FileText, roles: ["SUPER_ADMIN", "ADMIN"] },
  { name: "Notifications", href: "/notifications", icon: Bell, roles: ["SUPER_ADMIN", "ADMIN"] },
];

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState("EMPLOYEE");
  const [userEmail, setUserEmail] = React.useState("User");
  const [sessionTime, setSessionTime] = React.useState<string | null>(null);

  React.useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role || "EMPLOYEE");
        setUserEmail(decoded.sub || "User");
        
        if (decoded.exp) {
          const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - now;
            
            if (remaining <= 0) {
              clearInterval(intervalId);
              localStorage.removeItem("token");
              navigate("/login");
              toast.error("Session expired. Please log in again.");
            } else {
              const minutes = Math.floor(remaining / 60);
              const seconds = remaining % 60;
              setSessionTime(`${minutes}m ${seconds}s`);
            }
          };
          updateTimer();
          intervalId = setInterval(updateTimer, 1000);
        }
      } catch (e) {
        console.error("Invalid token");
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Filter navigation based on userRole
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true; // Default allow if no roles specified
    return item.roles.includes(userRole);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64 flex-col bg-primary pt-5 pb-4">
            <div className="flex items-center px-4 gap-3">
              <img src="/uploads/company_logo.png" alt="IGL" className="h-8 object-contain bg-white rounded p-1" />
              <span className="text-xl font-bold text-white tracking-tight">IGL Portal</span>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      "group flex items-center rounded-md px-2 py-2 text-sm font-medium"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-300",
                        "mr-3 h-5 w-5 flex-shrink-0"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Static Sidebar for Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col print:hidden">
        <div className="flex min-h-0 flex-1 flex-col bg-primary">
          <div className="flex h-16 flex-shrink-0 items-center px-6 gap-3">
            <img src="/uploads/company_logo.png" alt="IGL" className="h-8 object-contain bg-white rounded p-1" />
            <span className="text-xl font-bold text-white tracking-tight">IGL Portal</span>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 space-y-2 px-3">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                      "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                    )}
                  >
                    <item.icon
                      className={cn(
                        isActive ? "text-accent" : "text-slate-400 group-hover:text-slate-300",
                        "mr-3 h-5 w-5 flex-shrink-0"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Header */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-slate-200 print:hidden">
          <button
            type="button"
            className="border-r border-slate-200 px-4 text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center">
              <h1 className="text-xl font-semibold text-slate-800">
                {navigation.find((n) => location.pathname.startsWith(n.href))?.name || "IGL Portal"}
              </h1>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                {sessionTime && (
                  <div className="hidden md:flex items-center text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    Session Time: <span className="text-primary font-semibold ml-1">{sessionTime}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700">{userEmail} ({userRole})</span>
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 focus:outline-none"
                  title="Log out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 bg-slate-50">
          <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto print:m-0 print:p-0 print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
};
