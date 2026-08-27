"use client";

import { useState, useEffect } from "react";
import apiClient from "@/utils/apiClient";

interface Document {
  id: number;
  title: string;
  description: string;
  filePath: string;
  fileType: string;
  category?: { name: string };
  uploadedBy?: { fullName: string };
  version: string;
  validityStatus: string;
  parentDocumentId?: number;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [docHistory, setDocHistory] = useState<Document[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch categories on load
  useEffect(() => {
    apiClient.get("/Categories").then((res) => {
      setCategories(res.data);
    });
  }, []);

  const openPreview = async (doc: Document) => {
    setPreviewDoc(doc);
    setShowHistory(false);
    setDocHistory([]);
    try {
      const res = await apiClient.get(`/Documents/${doc.id}/history`);
      setDocHistory(res.data);
    } catch (e) {
      console.error(e);
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !categoryId) return; // Allow empty query if category is selected

    setLoading(true);
    setHasSearched(true);
    try {
      let url = `/Documents?status=Published`; // Note: Controller returns all Published. It might include Expired if not filtered backend.
      if (query.trim()) url += `&search=${encodeURIComponent(query)}`;
      if (categoryId) url += `&categoryId=${categoryId}`;

      const res = await apiClient.get(url);
      setResults(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isPreviewable = (type: string) => {
    const t = type.toLowerCase();
    return t.includes('pdf') || t.includes('png') || t.includes('jpg') || t.includes('jpeg');
  };

  const getValidityWarning = (vStatus: string) => {
    if (vStatus === 'Expired') return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold animate-pulse">⚠️ HẾT HIỆU LỰC</span>;
    if (vStatus === 'Replaced') return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">⚠️ BỊ THAY THẾ</span>;
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative">
      <div className="bg-white p-8 rounded-lg shadow-sm border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Tra Cứu Nhanh Tài Liệu</h2>
        <form onSubmit={handleSearch} className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
          <select 
            value={categoryId} 
            onChange={e => setCategoryId(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg bg-white sm:w-1/3"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Nhập từ khóa (Ví dụ: quy trình cấp điện...)" 
            className="flex-1 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 font-medium text-lg transition"
          >
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">
            Kết quả tìm kiếm cho: <span className="text-blue-600">"{query}"</span>
          </h3>
          
          {loading ? (
            <p className="text-gray-500 text-center py-8">Đang xử lý...</p>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map(doc => (
                <div key={doc.id} className={`border border-gray-100 rounded-lg p-5 hover:shadow-md transition flex flex-col sm:flex-row gap-4 items-start sm:items-center ${doc.validityStatus !== 'Active' ? 'bg-red-50 border-red-200 opacity-80' : 'bg-gray-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-medium text-blue-800">{doc.title}</h4>
                      {getValidityWarning(doc.validityStatus || 'Active')}
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{doc.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="bg-white px-2 py-1 rounded border font-mono font-medium text-gray-700">🏷️ {doc.version || 'v1.0'}</span>
                      <span className="bg-white px-2 py-1 rounded border">📁 {doc.category?.name || 'Không có danh mục'}</span>
                      <span className="bg-white px-2 py-1 rounded border">📄 {doc.fileType?.toUpperCase()}</span>
                      <span className="bg-white px-2 py-1 rounded border">👤 Đăng bởi: {doc.uploadedBy?.fullName || 'Hệ thống'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    {isPreviewable(doc.fileType) && (
                      <button 
                        onClick={() => openPreview(doc)}
                        className="inline-block bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium px-4 py-2 rounded transition whitespace-nowrap"
                      >
                        Chi tiết
                      </button>
                    )}
                    <a 
                      href={`http://localhost:5166${doc.filePath}`} 
                      target="_blank"
                      download
                      className="inline-block bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium px-4 py-2 rounded transition whitespace-nowrap"
                    >
                      Tải về
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">Không tìm thấy tài liệu nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-800">{previewDoc.title}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">{previewDoc.version || 'v1.0'}</span>
                </div>
                <p className="text-xs text-gray-500">Đăng bởi: {previewDoc.uploadedBy?.fullName || 'Hệ thống'} • {previewDoc.fileType?.toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${showHistory ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Lịch sử phiên bản
                </button>
                <a 
                  href={`http://localhost:5166${previewDoc.filePath}`} 
                  target="_blank"
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded-md hover:bg-blue-200 text-sm font-medium"
                >
                  Mở thẻ mới
                </a>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div className={`flex-1 bg-gray-100 flex items-center justify-center transition-all ${showHistory ? 'w-2/3' : 'w-full'}`}>
                {previewDoc.fileType.toLowerCase().includes('pdf') ? (
                  <iframe 
                    src={`http://localhost:5166${previewDoc.filePath}#toolbar=0`} 
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                ) : (
                  <img 
                    src={`http://localhost:5166${previewDoc.filePath}`} 
                    alt={previewDoc.title} 
                    className="max-w-full max-h-full object-contain p-4"
                  />
                )}
              </div>
              
              {showHistory && (
                <div className="w-1/3 border-l bg-white overflow-y-auto p-4">
                  <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Lịch sử thay đổi</h4>
                  {docHistory.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Đang tải lịch sử...</p>
                  ) : (
                    <div className="space-y-4">
                      {docHistory.map((h, i) => (
                        <div key={h.id} className={`p-3 rounded-lg border ${h.id === previewDoc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-sm text-blue-700">{h.version || 'v1.0'}</span>
                            <span className="text-xs text-gray-500">{new Date(h.uploadedAt || '').toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2 truncate" title={h.title}>{h.title}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Bởi: {h.uploadedBy?.fullName}</span>
                            <a href={`http://localhost:5166${h.filePath}`} target="_blank" download className="text-xs font-medium text-blue-600 hover:underline">Tải về</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
