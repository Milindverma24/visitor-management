import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/authentication/login";
import Dashboard from "@/pages/dashboard";
import VisitorDirectory from "@/pages/visitors";
import VisitorRegistration from "@/pages/register";
import Departments from "@/pages/departments";
import Approvals from "@/pages/approvals";
import CheckIn from "@/pages/checkin";
import CheckOut from "@/pages/checkout";
import AuditLogs from "@/pages/audit";
import Meetings from "@/pages/meetings";
import Interviews from "@/pages/interviews";
import Reports from "@/pages/reports";
import NotificationCenter from "@/pages/notifications";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <VisitorRegistration />,
  },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "visitors",
        element: <VisitorDirectory />,
      },
      {
        path: "departments",
        element: <Departments />,
      },
      {
        path: "approvals",
        element: <Approvals />,
      },
      {
        path: "checkin",
        element: <CheckIn />,
      },
      {
        path: "checkout",
        element: <CheckOut />,
      },
      {
        path: "audit",
        element: <AuditLogs />,
      },
      {
        path: "meetings",
        element: <Meetings />,
      },
      {
        path: "interviews",
        element: <Interviews />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "notifications",
        element: <NotificationCenter />,
      },
    ],
  },
]);