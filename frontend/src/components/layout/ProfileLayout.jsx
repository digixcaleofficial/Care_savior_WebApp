import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  History, 
  UserPen, 
  LogOut, 
  Trash2, 
  Menu, 
  X 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProfileLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const navigate = useNavigate();

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success("Logged out successfully");
    navigate('/login');
  };

  // --- DELETE ACCOUNT LOGIC ---
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    try {
      await api.delete('/auth/delete');
      localStorage.clear();
      toast.success("Account Deleted Permanently");
      navigate('/login');
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  // Navigation Items
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/profile/dashboard' },
    { name: 'History', icon: <History size={20} />, path: '/profile/history' },
    { name: 'Edit Profile', icon: <UserPen size={20} />, path: '/profile/edit' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* 1. MOBILE HEADER (Hamburger) */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b z-20 p-4 flex justify-between items-center">
        <span className="font-bold text-lg text-primary">Care Saviour</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* 2. SIDEBAR (Fixed on Desktop, Drawer on Mobile) */}
      <aside className={`
        fixed md:relative z-30 h-full w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-20 md:pt-0
      `}>
        {/* Logo Area (Desktop) */}
        <div className="hidden md:flex items-center justify-center h-16 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-600">My Studio</h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)} // Close on click (mobile)
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium
                ${isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}
              `}
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}

          <hr className="my-4 border-slate-100" />

          {/* Logout Button */}
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>

          {/* Delete Button */}
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors font-medium text-sm mt-auto"
          >
            <Trash2 size={18} />
            Delete Account
          </button>
        </nav>
      </aside>

      {/* 3. MAIN CONTENT AREA (Outlet) */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        <Outlet />
      </main>

      {/* 4. LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold mb-2">Confirm Logout?</h3>
            <p className="text-slate-500 mb-6">Are you sure you want to end your session?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2 bg-slate-100 rounded-lg font-semibold text-slate-700">Cancel</button>
              <button onClick={handleLogout} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border-2 border-red-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <Trash2 className="w-8 h-8" />
              <h3 className="text-xl font-bold">Delete Account</h3>
            </div>
            <p className="text-slate-600 mb-4">
              This action is <span className="font-bold text-red-600">IRREVERSIBLE</span>. All your bookings, history, and data will be permanently removed.
            </p>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
              Type "DELETE" to confirm
            </label>
            <input 
              type="text" 
              className="w-full border p-3 rounded-lg mb-6 text-center tracking-widest font-bold uppercase"
              placeholder="DELETE"
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-700">Cancel</button>
              <button 
                onClick={handleDeleteAccount} 
                disabled={deleteConfirmation !== 'DELETE'}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileLayout;