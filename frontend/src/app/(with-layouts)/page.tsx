"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/utils/apiClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function HomePage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    apiClient.get("/Documents/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error("Error fetching stats", err));
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Trang Chủ Hệ Thống</h1>
        <p className="text-gray-500">Tổng quan dữ liệu Kho Tài Liệu Nghiệp Vụ EVNSPC</p>
      </div>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl">
            📄
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Tài liệu đã công bố</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats?.publishedDocuments || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-2xl">
            ⏳
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Tài liệu chờ duyệt</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats?.pendingDocuments || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl">
            🗂️
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Danh mục tài liệu</p>
            <h3 className="text-2xl font-bold text-gray-800">{stats?.categoryStats?.length || 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Lối tắt chức năng</h3>
          <div className="space-y-4 flex-1">
            <Link href="/search" className="flex items-center p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition">🔍</div>
              <div>
                <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">Tra cứu Tài liệu</h4>
                <p className="text-sm text-gray-500">Tìm kiếm nhanh các quy trình nghiệp vụ</p>
              </div>
            </Link>
            
            <Link href="/documents" className="flex items-center p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition group">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-4 group-hover:bg-green-600 group-hover:text-white transition">📁</div>
              <div>
                <h4 className="font-semibold text-gray-800 group-hover:text-green-700">Quản lý Tài liệu</h4>
                <p className="text-sm text-gray-500">Thêm mới, sửa, xóa, và duyệt tài liệu</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Phân bổ tài liệu theo danh mục</h3>
          <div className="h-[250px] w-full">
            {stats && stats.categoryStats && stats.categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" name="Số lượng tài liệu" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Đang tải dữ liệu biểu đồ...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
