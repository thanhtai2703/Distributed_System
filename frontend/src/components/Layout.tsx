import { Outlet, Link, useLocation } from 'react-router';
import { ListTodo, Users, BarChart3 } from 'lucide-react';

function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={'flex flex-col min-h-svh bg-gray-50'}>
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">
                Microservices Todo App
              </h1>
            </div>
            <div className="flex gap-1">
              <Link
                to="/todo"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/todo')
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ListTodo className="w-4 h-4" />
                Todos
              </Link>
              <Link
                to="/users"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/users')
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                Users
              </Link>
              <Link
                to="/stats"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/stats')
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className={'flex-1'}>
        <Outlet></Outlet>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600"></div>
      </footer>
    </div>
  );
}

export default Layout;
