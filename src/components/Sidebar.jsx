import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, BookOpen, Vote, Layers, FileText,
  BarChart3, Gavel, ChevronLeft, ChevronRight, Pen, UserPlus
} from 'lucide-react';
import { useState } from 'react';
import { ROLES } from '../utils/constants';
import { hasPermission } from '../utils/permissions';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD] },
  { path: '/series', label: 'Series', icon: BookOpen, roles: [ROLES.ADMIN, ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD] },
  { path: '/series/new', label: 'New Proposal', icon: Pen, roles: [ROLES.MANGAKA] },
  { path: '/voting', label: 'Board Voting', icon: Vote, roles: [ROLES.EDITORIAL_BOARD, ROLES.ADMIN] },
  { path: '/chapters', label: 'Chapters & Tasks', icon: Layers, roles: [ROLES.MANGAKA, ROLES.ASSISTANT, ROLES.TANTOU_EDITOR, ROLES.ADMIN] },
  { path: '/manuscripts', label: 'Manuscripts', icon: FileText, roles: [ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.ADMIN] },
  { path: '/ranking', label: 'Ranking', icon: BarChart3, roles: [ROLES.ADMIN, ROLES.MANGAKA, ROLES.TANTOU_EDITOR, ROLES.EDITORIAL_BOARD] },
  { path: '/decisions', label: 'Decisions', icon: Gavel, roles: [ROLES.EDITORIAL_BOARD, ROLES.ADMIN] },
  { path: '/admin/create-account', label: 'Create Account', icon: UserPlus, roles: [ROLES.EDITORIAL_OFFICE_ADMIN] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const currentUser = useAuthStore(s => s.currentUser);

  const filteredMenu = menuItems.filter(item =>
    hasPermission(currentUser?.roles || [], item.roles)
  );

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-bg-secondary border-r border-border h-screen flex flex-col transition-all duration-300 flex-shrink-0`}>
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          M
        </div>
        {!collapsed && <span className="font-bold text-lg gradient-text">MangaHub</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 sidebar-scroll overflow-y-auto">
        {filteredMenu.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }`
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
