import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Link as LinkIcon,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps & { isCollapsed: boolean }> = ({ icon: Icon, label, path, isActive, onClick, isCollapsed }) => (
  <Link
    to={path}
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 group ${isActive
      ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300 font-semibold shadow-sm'
      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
  >
    <Icon className={`w-5 h-5 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
    {!isCollapsed && <span>{label}</span>}
    {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 ml-auto text-sky-500" />}
  </Link>
);

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Documents', path: '/documents' },
    { icon: UploadCloud, label: 'Upload New', path: '/upload' },
    { icon: History, label: 'History', path: '/history' },
    { icon: LinkIcon, label: 'Integrations', path: '/integrations' },
    { icon: User, label: 'Profile', path: '/profile' }, // Added Profile Link
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-[#111625] border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        <div className={`p-6 ${isCollapsed ? 'px-4 flex justify-center' : ''}`}>
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shrink-0">
              <img src="/icon.png" alt="Logo" className="w-5 h-5 invert brightness-0" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-xl font-sora text-slate-900 dark:text-white tracking-tight whitespace-nowrap">Clarity OCR</span>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              {...item}
              isCollapsed={isCollapsed}
              isActive={location.pathname.startsWith(item.path)}
            />
          ))}
        </nav>

        {/* Footer Removed as per user request */}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-[#111625] border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
              <span className="font-bold text-white">C</span>
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">Clarity</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </header>

        {/* Mobile Menu Overlay - New Design */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-sky-900/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Card */}
            <div className="relative w-full max-w-sm bg-white dark:bg-[#111625] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    C
                  </div>
                  <span className="font-bold text-xl text-slate-900 dark:text-white">Clarity</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-violet-50 text-violet-600 rounded-full hover:bg-violet-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <div className="p-4 space-y-1">
                {navItems.map((item) => (
                  <div key={item.path} className="relative">
                    {location.pathname.startsWith(item.path) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500 rounded-r-full" />
                    )}
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${location.pathname.startsWith(item.path)
                        ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                    >
                      <item.icon className={`w-5 h-5 ${location.pathname.startsWith(item.path) ? 'text-sky-600' : 'text-slate-400'}`} />
                      <span className="text-base">{item.label}</span>
                      {location.pathname.startsWith(item.path) && <ChevronRight className="w-4 h-4 ml-auto text-sky-500" />}
                    </Link>
                  </div>
                ))}
              </div>

              {/* Footer (Profile) */}
              <div className="p-6 pt-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                    <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>


      </div>
    </div>
  );
}