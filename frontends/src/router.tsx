import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

// Authentication
import Login from "@/pages/authentication/login";
import EmployeeLogin from "@/pages/authentication/EmployeeLogin";

// Portals (no AppLayout)
import LandingPage from "@/pages/landing/LandingPage";
import VisitorPortal from "@/pages/visitor/VisitorPortal";
import SecurityLoginPage from "@/pages/security-login";
import SecurityOps from "@/pages/security-ops";

// Admin Portal Pages (inside AppLayout)
import Dashboard from "@/pages/dashboard";
import VisitorDirectory from "@/pages/visitors";
import VisitorRegistration from "@/pages/register";
import Departments from "@/pages/departments";
import Employees from "@/pages/employees";
import Approvals from "@/pages/approvals";
import CheckIn from "@/pages/checkin";
import CheckOut from "@/pages/checkout";
import AuditLogs from "@/pages/audit";
import Locations from "@/pages/locations";

import Reports from "@/pages/reports";

import Profile from "@/pages/profile";


// New IGLGATE Pages
import BlacklistPage from "@/pages/blacklist";
import Analytics from "@/pages/analytics";
import EmergencyCommand from "@/pages/emergency";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/visitor",
    element: <VisitorPortal />,
  },

  {
    path: "/employee-login",
    element: <EmployeeLogin />,
  },
  {
    path: "/security-login",
    element: <SecurityLoginPage />,
  },
  {
    path: "/security-ops",
    element: <SecurityOps />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    // Pathless layout route for authenticated portal pages
    element: <AppLayout />,
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "visitors", element: <VisitorDirectory /> },
      { path: "departments", element: <Departments /> },
      { path: "employees", element: <Employees /> },
      { path: "approvals", element: <Approvals /> },
      { path: "register", element: <VisitorRegistration /> },
      { path: "checkin", element: <CheckIn /> },
      { path: "checkout", element: <CheckOut /> },
      { path: "audit", element: <AuditLogs /> },
      { path: "locations", element: <Locations /> },

      { path: "reports", element: <Reports /> },

      { path: "profile", element: <Profile /> },
      // New IGLGATE routes
      { path: "blacklist", element: <BlacklistPage /> },
      { path: "analytics", element: <Analytics /> },
      { path: "emergency", element: <EmergencyCommand /> },
    ],
  },
]);