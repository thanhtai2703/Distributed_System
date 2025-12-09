import * as React from 'react';
import axios from 'axios';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';

interface StatsData {
  totalTodos: number;
  completedTodos: number;
  pendingTodos: number;
  completionRate: number;
  totalUsers: number;
}

const getStatsApiUrl = () => {
  // @ts-ignore
  if (window.ENV && window.ENV.STATS_API_URL) {
    return window.ENV.STATS_API_URL;
  }
  return 'http://localhost:8082/stats';
};

const STATS_API_URL = `${getStatsApiUrl()}/api/stats`;

function StatsDashboard() {
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [serviceStatus, setServiceStatus] = React.useState<
    'online' | 'offline' | 'checking'
  >('checking');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [userServiceDown, setUserServiceDown] = React.useState(false);

  React.useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(STATS_API_URL, { timeout: 5000 });
      setStats(response.data);
      setServiceStatus('online');
      setErrorMessage('');

      // Check if User Service is down (totalUsers = 0 might indicate this)
      if (response.data.totalUsers === 0 && response.data.totalTodos > 0) {
        setUserServiceDown(true);
      } else {
        setUserServiceDown(false);
      }

      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      setServiceStatus('offline');
      setErrorMessage('⚠️ Stats Service đang không khả dụng');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Service Status */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="w-8 h-8" />
          Analytics Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              serviceStatus === 'online'
                ? 'bg-green-500 animate-pulse'
                : serviceStatus === 'offline'
                ? 'bg-red-500'
                : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm font-medium">
            Stats Service:{' '}
            {serviceStatus === 'online'
              ? '🟢 Online'
              : serviceStatus === 'offline'
              ? '🔴 Offline'
              : '🟡 Checking...'}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">{errorMessage}</p>
            <p className="text-red-600 text-sm mt-1">
              Stats Service không phản hồi. Các service khác vẫn hoạt động bình
              thường.
            </p>
            <Button
              onClick={fetchStats}
              className="mt-2"
              size="sm"
              variant="outline"
            >
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* User Service Warning */}
      {userServiceDown && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-yellow-800 font-medium">
              ⚠️ User Service đang không khả dụng
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              Stats Service vẫn hoạt động và hiển thị thống kê Todos. Chỉ có
              thông tin Users tạm thời không khả dụng.
            </p>
          </div>
        </div>
      )}

      {serviceStatus === 'offline' ? (
        <div className="text-center py-20 text-gray-500">
          <AlertCircle className="w-20 h-20 mx-auto mb-4 text-red-400" />
          <p className="text-xl font-medium">Stats Service Offline</p>
          <p className="text-sm mt-2">Không thể tải dữ liệu thống kê</p>
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Todos */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Todos</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {stats.totalTodos}
                  </p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Completed Todos */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {stats.completedTodos}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Pending Todos */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {stats.pendingTodos}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {userServiceDown ? (
                      <span className="text-gray-400 text-base">N/A</span>
                    ) : (
                      stats.totalUsers
                    )}
                  </p>
                  {userServiceDown && (
                    <p className="text-xs text-red-500 mt-1">Service Down</p>
                  )}
                </div>
                <div
                  className={`p-3 rounded-full ${
                    userServiceDown ? 'bg-gray-100' : 'bg-purple-100'
                  }`}
                >
                  <Users
                    className={`w-6 h-6 ${
                      userServiceDown ? 'text-gray-400' : 'text-purple-600'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Completion Rate Card */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-2">Completion Rate</p>
                <p className="text-5xl font-bold">
                  {stats.completionRate.toFixed(1)}%
                </p>
                <p className="text-blue-100 text-sm mt-2">
                  {stats.completedTodos} out of {stats.totalTodos} todos
                  completed
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <TrendingUp className="w-12 h-12" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Progress Overview</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Completed Tasks
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.completedTodos} / {stats.totalTodos}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Pending Tasks
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {stats.pendingTodos} / {stats.totalTodos}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-orange-500 h-4 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        stats.totalTodos > 0
                          ? (stats.pendingTodos / stats.totalTodos) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Refresh Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Dữ liệu tự động cập nhật mỗi 10 giây</p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default StatsDashboard;
