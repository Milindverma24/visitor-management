import React, { useEffect, useState } from 'react';
import api from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TelegramLog {
  id: number;
  user_email: string;
  action: string;
  target_id: number | null;
  target_type: string | null;
  employee_id: string | null;
  created_at: string;
}

export default function NotificationCenter() {
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reports/telegram_logs');
      setLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch notification logs');
    } finally {
      setLoading(false);
    }
  };

  const sentCount = logs.filter(log => log.action === 'TELEGRAM_MESSAGE_SENT').length;
  const failedCount = logs.filter(log => log.action === 'TELEGRAM_MESSAGE_FAILED').length;
  const totalCount = logs.length;

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading Notification Center...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
          <p className="mt-1 text-sm text-gray-500">Monitor Telegram Delivery Status and Alerts</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Notifications</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">{totalCount}</dd>
        </Card>
        <Card className="p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Delivered Successfully</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">{sentCount}</dd>
        </Card>
        <Card className="p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">Failed (Fallback to Email)</dt>
          <dd className="mt-1 text-3xl font-semibold text-red-600">{failedCount}</dd>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Recent Alerts & Deliveries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target ID</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.action === 'TELEGRAM_MESSAGE_FAILED' ? (
                      <Badge variant="danger">Failed</Badge>
                    ) : (
                      <Badge variant="success">Sent</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.target_id || 'N/A'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No Telegram logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
