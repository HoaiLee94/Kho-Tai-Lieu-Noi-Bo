"use client";

import { useState, useEffect, useRef } from "react";
import apiClient from "@/utils/apiClient";
import Cookies from "js-cookie";

interface Document {
  id: number;
  title: string;
  description: string;
  filePath: string;
  fileType: string;
  size: number;
  uploadedAt: string;
  status: string;
  reviewComments: string;
  version: string;
  validityStatus: string;
  parentDocumentId?: number;
  category?: { id: number; name: string };
}

interface Category {
  id: number;
  name: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("Reader");
  const [userId, setUserId] = useState<number>(0);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("v1.0");
  const [parentDocumentId, setParentDocumentId] = useState<number | null>(null);
  const [parentDocumentTitle, setParentDocumentTitle] = useState("");
  
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const formRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      const docsRes = await apiClient.get("/Documents");
      setDocuments(docsRes.data);

      const catsRes = await apiClient.get("/Categories");
      setCategories(catsRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userInfoStr = Cookies.get("user_info");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      setUserRole(userInfo.role || userInfo.Role || "Reader");
      setUserId(userInfo.Id || userInfo.id || 0);
    }
    fetchData();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !categoryId) {
      setUploadMsg("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    setUploading(true);
    setUploadMsg("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("categoryId", categoryId);
    formData.append("uploadedById", userId.toString()); 
    formData.append("version", version); 
    if (parentDocumentId) {
      formData.append("parentDocumentId", parentDocumentId.toString());
    }
    formData.append("file", file);

    try {
      await apiClient.post("/Documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadMsg("Tải lên thành công (Bản nháp)!");
      
      resetForm();
      fetchData();
    } catch (error: any) {
      setUploadMsg("Lỗi khi tải lên: " + (error.response?.data?.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setCategoryId("");
    setVersion("v1.0");
    setParentDocumentId(null);
    setParentDocumentTitle("");
  }

  const handleReplace = (doc: Document) => {
    setParentDocumentId(doc.parentDocumentId || doc.id); // Trỏ về bản gốc nếu có
    setParentDocumentTitle(doc.title);
    setCategoryId(doc.category?.id?.toString() || ""); // category is nested, actually we should fetch it or mapping it
    setTitle(doc.title);
    
    // Auto increment version string naive logic
    let newVer = "v2.0";
    if (doc.version.startsWith("v")) {
      const parts = doc.version.substring(1).split(".");
      if (parts.length > 0) {
        newVer = `v${parseInt(parts[0]) + 1}.0`;
      }
    }
    setVersion(newVer);
    
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const handleExpire = async (id: number) => {
    if (!confirm("Bạn có chắc muốn ĐÌNH CHỈ hiệu lực của tài liệu này?")) return;
    try {
      await apiClient.post(`/Documents/${id}/expire`);
      fetchData();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || error.response?.data || ""));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài liệu này?")) return;
    try {
      await apiClient.delete(`/Documents/${id}`);
      fetchData();
    } catch (error: any) {
      alert("Lỗi khi xóa: " + (error.response?.data?.message || ""));
    }
  };

  // Workflow Handlers
  const handleSubmitForReview = async (id: number) => {
    if (!confirm("Xác nhận gửi duyệt tài liệu này?")) return;
    try {
      await apiClient.post(`/Documents/${id}/submit`);
      fetchData();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || error.response?.data || ""));
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Xác nhận duyệt và công bố tài liệu này?")) return;
    try {
      await apiClient.post(`/Documents/${id}/approve_publish`, userId, {
        headers: { 'Content-Type': 'application/json' }
      });
      fetchData();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || error.response?.data || ""));
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt("Vui lòng nhập lý do từ chối (yêu cầu sửa):");
    if (reason === null) return;
    try {
      await apiClient.post(`/Documents/${id}/reject`, {
        reviewerId: userId,
        comments: reason
      });
      fetchData();
    } catch (error: any) {
      alert("Lỗi: " + (error.response?.data?.message || error.response?.data || ""));
    }
  };

  const getStatusBadge = (status: string, comments: string) => {
    switch (status) {
      case 'Draft': 
        return (
          <div className="flex flex-col">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Bản nháp</span>
            {comments && <span className="text-xs text-red-500 mt-1" title={comments}>Bị từ chối: {comments.length > 20 ? comments.substring(0,20)+'...' : comments}</span>}
          </div>
        );
      case 'PendingReview': 
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'Published': 
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã công bố</span>;
      default: 
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getValidityBadge = (vStatus: string) => {
    switch (vStatus) {
      case 'Active': return <span className="text-green-600 font-medium">Còn hiệu lực</span>;
      case 'Expired': return <span className="text-red-600 font-medium">Hết hiệu lực</span>;
      case 'Replaced': return <span className="text-orange-600 font-medium">Bị thay thế</span>;
      default: return <span>{vStatus}</span>;
    }
  }

  // Permissions
  const canUpload = ["Editor", "ContentAdmin", "SystemAdmin"].includes(userRole);
  const canReview = ["Reviewer", "ContentAdmin", "SystemAdmin"].includes(userRole);

  return (
    <div className="space-y-6">
      {canUpload && (
        <div ref={formRef} className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${parentDocumentId ? 'border-orange-500' : 'border-blue-500'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {parentDocumentId ? 'Tải lên Phiên Bản Mới (Bản Nháp)' : 'Tải lên Tài Liệu Mới (Bản Nháp)'}
            </h3>
            {parentDocumentId && (
              <button type="button" onClick={resetForm} className="text-sm text-gray-500 hover:underline">Hủy tải bản thay thế</button>
            )}
          </div>
          
          {parentDocumentId && (
             <div className="mb-4 p-3 bg-orange-50 text-orange-800 rounded text-sm font-medium">
               ⚠️ Đang tạo bản thay thế cho tài liệu: {parentDocumentTitle}. Sau khi được duyệt, tài liệu cũ sẽ bị đổi trạng thái thành "Bị thay thế".
             </div>
          )}
          
          {uploadMsg && <div className="mb-4 text-sm text-blue-600 font-medium">{uploadMsg}</div>}
          <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phiên bản</label>
              <input type="text" value={version} onChange={e => setVersion(e.target.value)} placeholder="v1.0" required className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="w-full border rounded px-3 py-2 bg-white">
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Tóm tắt nội dung)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={2}></textarea>
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chọn File *</label>
              <input type="file" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} required className="w-full border rounded px-3 py-2 bg-gray-50" />
            </div>
            <div className="md:col-span-4 flex justify-end mt-2">
              <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition">
                {uploading ? 'Đang tải...' : 'Tạo bản nháp'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold mb-4">Danh sách Tài Liệu</h3>
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Tiêu đề</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Phiên bản</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Hiệu lực</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map(doc => (
                  <tr key={doc.id} className={`hover:bg-gray-50 ${doc.validityStatus !== 'Active' ? 'opacity-70 bg-gray-50' : ''}`}>
                    <td className="px-4 py-3">{doc.id}</td>
                    <td className="px-4 py-3 font-medium">
                      {doc.title}
                      {doc.parentDocumentId && <div className="text-xs text-gray-500">Thay thế cho ID: {doc.parentDocumentId}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{doc.version || 'v1.0'}</td>
                    <td className="px-4 py-3">{getStatusBadge(doc.status, doc.reviewComments)}</td>
                    <td className="px-4 py-3">{getValidityBadge(doc.validityStatus || 'Active')}</td>
                    <td className="px-4 py-3">
                      <a href={`http://localhost:5166${doc.filePath}`} target="_blank" className="text-blue-600 hover:underline mr-4">Xem file</a>
                      
                      {doc.status === 'Draft' && canUpload && (
                        <button onClick={() => handleSubmitForReview(doc.id)} className="text-green-600 font-medium hover:underline mr-4">Gửi duyệt</button>
                      )}
                      
                      {doc.status === 'PendingReview' && canReview && (
                        <>
                          <button onClick={() => handleApprove(doc.id)} className="text-purple-600 font-medium hover:underline mr-4">Duyệt & Công bố</button>
                          <button onClick={() => handleReject(doc.id)} className="text-orange-600 font-medium hover:underline mr-4">Từ chối</button>
                        </>
                      )}

                      {doc.status === 'Published' && doc.validityStatus === 'Active' && canUpload && (
                        <button onClick={() => handleReplace(doc)} className="text-blue-600 font-medium hover:underline mr-4" title="Tạo phiên bản mới thay thế tài liệu này">Thay thế</button>
                      )}

                      {doc.status === 'Published' && doc.validityStatus === 'Active' && canReview && (
                        <button onClick={() => handleExpire(doc.id)} className="text-gray-600 font-medium hover:underline mr-4" title="Đánh dấu hết hiệu lực">Đình chỉ</button>
                      )}

                      {canReview && (
                         <button onClick={() => handleDelete(doc.id)} className="text-red-600 hover:underline">Xóa</button>
                      )}
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Chưa có tài liệu nào.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
