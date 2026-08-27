"use client";

import { useState } from 'react';
import apiClient from '@/utils/apiClient';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      // Save token and user info
      Cookies.set('jwt_token', token, { expires: 1 }); // expires in 1 day
      Cookies.set('user_info', JSON.stringify(user), { expires: 1 });

      // Redirect to dashboard
      router.push('/');
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('Đăng nhập thất bại. Vui lòng kiểm tra lại đường truyền hoặc tài khoản.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo TTCSKH EVNSPC" className="h-20 mx-auto object-contain mb-4" />
          <h2 className="text-2xl font-bold text-blue-900">Đăng Nhập Hệ Thống</h2>
          <p className="text-sm text-gray-500 mt-2">Kho Tài Liệu Nghiệp Vụ TTCSKH</p>
        </div>
        
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập username (Gợi ý: admin)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập mật khẩu (Gợi ý: 123456)"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-semibold py-3 rounded-lg transition ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
