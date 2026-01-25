import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';

const EditProfile = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', serviceType: ''
  });
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current data
    api.get('/auth/me').then(res => {
      const u = res.data.user;
      setFormData({
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        address: u.address || '',
        serviceType: u.serviceType || ''
      });
      setRole(u.role);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/updatedetails', formData);
      toast.success("Profile Updated Successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Edit Profile</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Common Fields */}
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
            <input 
              className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input 
              className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
          <input 
            className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Address</label>
          <input 
            className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white focus:ring-2 ring-blue-100 outline-none transition"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        {/* Vendor Specific Field */}
        {role === 'vendor' && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Service Type</label>
            <select 
              className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white outline-none"
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
            >
               <option value="Doctor">Doctor</option>
               <option value="Nurse">Nurse</option>
               <option value="Ambulance">Ambulance</option>
            </select>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
        </button>

      </form>

      <BottomNav />
    </div>
  );
};

export default EditProfile;