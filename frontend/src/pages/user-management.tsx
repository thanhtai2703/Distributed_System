import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import * as React from 'react';
import axios from 'axios';
import { User, UserPlus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

interface UserType {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  active: boolean;
}

const getApiUrl = () => {
  // @ts-ignore
  if (window.ENV && window.ENV.USER_API_URL) {
    return window.ENV.USER_API_URL;
  }
  return 'http://localhost:8081/users';
};

const API_URL = `${getApiUrl()}/api`;

function UserManagement() {
  const [users, setUsers] = React.useState<UserType[]>([]);
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [department, setDepartment] = React.useState('');
  const [serviceStatus, setServiceStatus] = React.useState<
    'online' | 'offline' | 'checking'
  >('checking');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    fetchUsers();
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      await axios.get(API_URL + '/users', { timeout: 3000 });
      setServiceStatus('online');
    } catch (error) {
      setServiceStatus('offline');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(API_URL + '/users', { timeout: 5000 });
      setUsers(response.data);
      setServiceStatus('online');
      setErrorMessage('');
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setServiceStatus('offline');
      setErrorMessage(
        '⚠️ User Service đang không khả dụng. Vui lòng thử lại sau.'
      );
      setUsers([]);
    }
  };

  const handleAddUser = async () => {
    if (!username || !email) {
      setErrorMessage('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    const userPayload = {
      username,
      email,
      fullName: fullName || username,
      role: role || 'Member',
      department: department || 'General',
      active: true,
    };

    try {
      const response = await axios.post(API_URL + '/user', userPayload, {
        timeout: 5000,
      });
      setUsers([...users, response.data]);
      setUsername('');
      setEmail('');
      setFullName('');
      setRole('');
      setDepartment('');
      setErrorMessage('');
      setSuccessMessage('✅ Thêm user thành công!');
      setServiceStatus('online');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('Error adding user:', error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        setServiceStatus('offline');
        setErrorMessage('❌ User Service không phản hồi (timeout)');
      } else if (error.response?.status === 409) {
        setErrorMessage('❌ Username hoặc Email đã tồn tại!');
      } else {
        setServiceStatus('offline');
        setErrorMessage(
          '❌ Không thể kết nối tới User Service. Service có thể đang down.'
        );
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await axios.delete(API_URL + `/user/${id}`, { timeout: 5000 });
      setUsers(users.filter((u) => u.id !== id));
      setErrorMessage('');
      setSuccessMessage('✅ Xóa user thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setServiceStatus('offline');
      setErrorMessage('❌ Không thể xóa user. Service có thể đang down.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Service Status Indicator */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8" />
          User Management
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
            User Service:{' '}
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Add User Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Thêm User Mới
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              disabled={serviceStatus === 'offline'}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              disabled={serviceStatus === 'offline'}
            />
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              disabled={serviceStatus === 'offline'}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Developer, Designer, Manager..."
              disabled={serviceStatus === 'offline'}
            />
          </div>
          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering, Marketing..."
              disabled={serviceStatus === 'offline'}
            />
          </div>
        </div>
        <Button
          onClick={handleAddUser}
          className="mt-4"
          disabled={serviceStatus === 'offline'}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {serviceStatus === 'offline' ? 'Service Offline' : 'Thêm User'}
        </Button>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">
          Danh Sách Users ({users.length})
        </h2>

        {serviceStatus === 'offline' ? (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <p className="text-lg font-medium">User Service Offline</p>
            <p className="text-sm mt-2">Không thể tải danh sách users</p>
            <Button onClick={fetchUsers} className="mt-4" variant="outline">
              Thử lại
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>Chưa có user nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Username</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">Full Name</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Department</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{user.id}</td>
                    <td className="p-3 font-medium">{user.username}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.fullName}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        {user.role || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        {user.department || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserManagement;
