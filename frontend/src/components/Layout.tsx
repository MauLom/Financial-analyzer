import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Calculator,
  Settings as SettingsIcon,
  Menu,
  X,
  Home,
  LogOut,
  User,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const { user, logout } = useAuth();


  const navigation = [
    { name: t('nav.dashboard'), href: '/', icon: Home, key: 'nav.dashboard' },
    { name: t('nav.transactions'), href: '/transactions', icon: DollarSign, key: 'nav.transactions' },
    { name: t('nav.projects'), href: '/projects', icon: TrendingUp, key: 'nav.projects' },
    { name: t('nav.analytics'), href: '/analytics', icon: BarChart3, key: 'nav.analytics' },
    { name: t('nav.simulator'), href: '/simulator', icon: Calculator, key: 'nav.simulator' },
    { name: t('nav.settings'), href: '/settings', icon: SettingsIcon, key: 'nav.settings' },
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile menu */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-300 ease-linear`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-white ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out`}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center justify-between px-4">
              <h1 className="text-xl font-bold text-gray-900">Financial Analyzer</h1>
            </div>
            <div className="px-4 mt-2">
              <LanguageSelector />
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isCurrentPath(item.href)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            
            {/* User menu for mobile */}
            <div className="mt-8 px-2 pt-4 border-t border-gray-200">
              <div className="flex items-center px-2 py-2">
                <div className="flex items-center">
                  {user?.avatar_url ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar_url}
                      alt={user.username}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-900">{user?.first_name || user?.username}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-2 w-full group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-4 h-6 w-6" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center justify-between flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">Financial Analyzer</h1>
              </div>
              <div className="px-4 mt-2 mb-4">
                <LanguageSelector />
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isCurrentPath(item.href)
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="mr-3 h-6 w-6" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              
              {/* User menu for desktop */}
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center w-full">
                  <div className="flex items-center">
                    {user?.avatar_url ? (
                      <img
                        className="inline-block h-9 w-9 rounded-full"
                        src={user.avatar_url}
                        alt={user.username}
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.first_name || user?.username}
                      </p>
                      <p className="text-xs text-gray-600 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                      title="Sign out"
                    >
                      <LogOut className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;