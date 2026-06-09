import React from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  FileText,
  LogOut,
  Menu,
  Bell,
  Building2,
  ClipboardList,
  BarChart3,
  Settings,
  UserCog,
  Truck,
  ShieldOff,
  TrendingUp,
  Package,
  AlertTriangle,
  Maximize,
  Minimize
} from "lucide-react";
import { cn } from "@/utils/helpers";
import { Toaster, toast } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import logo from "@/assets/logo.png";
import api from "@/services/api";

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Departments", href: "/departments", icon: Building2 },
  { name: "Visitors", href: "/visitors", icon: Users },
  { name: "Vehicles", href: "/vehicles", icon: Truck },
  { name: "Approvals", href: "/approvals", icon: UserCheck },
];

const securityNavigation = [
  { name: "Check-In", href: "/checkin", icon: ShieldCheck },
  { name: "Check-Out", href: "/checkout", icon: LogOut, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "SECURITY_SUPERVISOR", "SECURITY_GUARD"] },
  { name: "Blacklist", href: "/blacklist", icon: ShieldOff, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "SECURITY_SUPERVISOR"] },
  { name: "Emergency", href: "/emergency", icon: AlertTriangle, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "SECURITY_SUPERVISOR"] },
];

const managementNavigation = [
  { name: "Analytics", href: "/analytics", icon: TrendingUp, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"] },
  { name: "Employees", href: "/employees", icon: UserCog, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"] },
  { name: "Meetings", href: "/meetings", icon: Users, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "DEPARTMENT_HEAD", "DEPARTMENT_EXECUTIVE", "HR_MANAGER", "EMPLOYEE", "RECEPTIONIST"] },
  { name: "Interviews", href: "/interviews", icon: ClipboardList, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "HR_MANAGER", "HR_EXECUTIVE"] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN", "DEPARTMENT_HEAD"] },
  { name: "Audit Logs", href: "/audit", icon: FileText, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"] },
  { name: "Notifications", href: "/notifications", icon: Bell, roles: ["CORPORATE_SUPER_ADMIN", "PLANT_ADMIN"] },
];

const allNavigation = [...mainNavigation, ...securityNavigation, ...managementNavigation];

const NavLink = ({ item, isActive, onClick }: { item: any; isActive: boolean; onClick?: () => void }) => (
  <Link
    to={item.href}
    onClick={onClick}
    className={cn(
      "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
      isActive
        ? "bg-[#2563EB] text-white shadow-md shadow-blue-900/30"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    )}
  >
    <item.icon
      className={cn(
        "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
      )}
      aria-hidden="true"
    />
    {item.name}
  </Link>
);

const NavSection = ({ title, items, userRole, location, onLinkClick }: {
  title: string;
  items: any[];
  userRole: string;
  location: any;
  onLinkClick?: () => void;
}) => {
  const filtered = items.filter(item => !item.roles || item.roles.includes(userRole));
  if (filtered.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="px-3 mb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      <div className="space-y-0.5">
        {filtered.map(item => (
          <NavLink
            key={item.name}
            item={item}
            isActive={location.pathname.startsWith(item.href)}
            onClick={onLinkClick}
          />
        ))}
      </div>
    </div>
  );
};

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState("EMPLOYEE");
  const [userEmail, setUserEmail] = React.useState("User");
  const [sessionTime, setSessionTime] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/api/auth/me");
      if (response.data.success && response.data.user) {
        setUserProfile(response.data.user);
      }
    } catch (err) {
      console.error("Failed to load user profile", err);
    }
  };

  React.useEffect(() => {
    fetchProfile();
    window.addEventListener("profileUpdate", fetchProfile);
    return () => window.removeEventListener("profileUpdate", fetchProfile);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

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
              navigate("/");
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
        navigate("/");
      }
    } else {
      navigate("/");
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("You have been signed out.");
    navigate("/");
  };

  const roleLabel: Record<string, string> = {
    CORPORATE_SUPER_ADMIN: "Corporate Admin",
    PLANT_ADMIN: "Plant Admin",
    DEPARTMENT_HEAD: "Dept. Head",
    HR_MANAGER: "HR Manager",
    HR_EXECUTIVE: "HR Executive",
    DEPARTMENT_EXECUTIVE: "Dept. Executive",
    RECEPTIONIST: "Receptionist",
    SECURITY_SUPERVISOR: "Security Sup.",
    SECURITY_GUARD: "Security Guard",
    EMPLOYEE: "Employee",
  };

  const renderSidebar = (onLinkClick?: () => void) => (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0F172A]">
      {/* Logo & Company Name */}
      <div className="flex flex-shrink-0 flex-col items-start px-5 pt-6 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-1">
          <img src={logo} alt="Indian Glycol Limited" className="h-8 w-auto object-contain bg-slate-900 rounded p-1 border border-slate-800" />
          <div className="flex flex-col">
            <span className="text-[11px] font-black text-white tracking-tight leading-tight">INDIAN GLYCOL</span>
            <span className="text-[11px] font-black text-white tracking-tight leading-tight">LIMITED</span>
          </div>
        </div>
        <span className="text-[9px] font-bold text-[#FBBF24] uppercase tracking-widest mt-1.5 ml-0">
          Visitor Management System
        </span>
      </div>

      {/* Navigation */}
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-10 px-3 space-y-4">
        <NavSection
          title="Overview"
          items={mainNavigation}
          userRole={userRole}
          location={location}
          onLinkClick={onLinkClick}
        />
        <NavSection
          title="Gate Control"
          items={securityNavigation}
          userRole={userRole}
          location={location}
          onLinkClick={onLinkClick}
        />
        <NavSection
          title="Management"
          items={managementNavigation}
          userRole={userRole}
          location={location}
          onLinkClick={onLinkClick}
        />
      </div>

      {/* Bottom: copyright only (Sign Out is in top nav) */}
      <div className="border-t border-slate-800 px-5 py-4 flex-shrink-0">
        <p className="text-[9px] text-slate-600 text-center font-medium">
          © {new Date().getFullYear()} Indian Glycol Limited
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex w-full max-w-full overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64 flex-col">
            {renderSidebar(() => setSidebarOpen(false))}
          </div>
        </div>
      )}

      {/* Desktop Static Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col print:hidden">
        {renderSidebar()}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0 w-full max-w-full">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-slate-200 shadow-sm print:hidden">
          <button
            type="button"
            className="border-r border-slate-200 px-4 text-slate-500 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1 items-center">
              <h1 className="text-base font-bold text-slate-800">
                {allNavigation.find((n) => location.pathname.startsWith(n.href))?.name || "Dashboard"}
              </h1>
            </div>
            <div className="ml-4 flex items-center gap-4">
              {sessionTime && (
                <div className="hidden md:flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                  <span className="text-slate-400 mr-1">Session:</span>
                  <span className="text-[#0F172A] font-bold">{sessionTime}</span>
                </div>
              )}
              
              <button
                onClick={toggleFullscreen}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all cursor-pointer"
                title="Toggle TV / Kiosk Mode"
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                <span className="hidden md:block">TV Mode</span>
              </button>

              <div
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors animate-fade-in"
                onClick={() => navigate("/profile")}
                title="View Profile Settings"
              >
                {userProfile?.profile_photo_path ? (
                  <img
                    src={userProfile.profile_photo_path}
                    alt={userProfile.full_name}
                    className="h-6 w-6 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${userProfile?.full_name || userEmail}`;
                    }}
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs">
                    {(userProfile?.full_name || userEmail).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col text-left hidden sm:flex">
                  <span className="text-xs font-bold text-slate-800 leading-none">{userProfile?.full_name || "User"}</span>
                  <span className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{roleLabel[userRole] || userRole}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 bg-slate-50 min-w-0">
          <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 w-full max-w-[1920px] mx-auto print:m-0 print:p-0 print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
