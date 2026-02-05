import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function AdminDashboard({ contract, account }) {
  const [farmerAddress, setFarmerAddress] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]); // Store pending requests
  const [millerAddress, setMillerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isAdminWallet, setIsAdminWallet] = useState(true);
  const [adminAddress, setAdminAddress] = useState('');
  const [farmersList, setFarmersList] = useState([]);

  const fetchFarmers = async () => {
    if (contract) {
      try {
        // 1. Fetch Active Farmers
        const list = await contract.getAllFarmers();
        setFarmersList(list);

        // 2. Fetch Pending Requests from Blockchain
        const requesters = await contract.getRequesters();
        // Map to object structure for UI
        const pending = requesters.map(addr => ({
          username: `Ví: ${addr.slice(0, 6)}...${addr.slice(-4)}`, // Tạm thời dùng ví làm tên
          walletAddress: addr
        }));
        setPendingRequests(pending);

      } catch (err) {
        console.error("Lỗi lấy danh sách:", err);
      }
    }
  };

  useEffect(() => {
    const checkAdmin = async () => {
      if (contract && account) {
        try {
          const _admin = await contract.admin();
          setAdminAddress(_admin);
          if (_admin.toLowerCase() !== account.toLowerCase()) {
            setIsAdminWallet(false);
            setStatus(`⚠️ CẢNH BÁO: Ví đang kết nối (${account.slice(0, 6)}...) KHÔNG PHẢI là Admin!`);
          } else {
            setIsAdminWallet(true);
            setStatus('');
          }
        } catch (error) {
          console.error("Lỗi check admin:", error);
        }
      }
    };
    checkAdmin();
    fetchFarmers();

    // Auto-refresh every 5 seconds to catch new requests
    const interval = setInterval(() => {
      fetchFarmers();
    }, 5000);

    return () => clearInterval(interval);
  }, [contract, account]);

  const validateAndExecute = async (actionName, actionFunc, address) => {
    if (!contract) return;
    if (!isAdminWallet) {
      alert(`Vui lòng kết nối đúng ví Admin: ${adminAddress}`);
      return;
    }
    // Hack: Nếu là xóa batch (param là hàm wrapper), ta bỏ qua check address
    if (actionName.includes('xóa Lô')) {
      // Pass verification
    } else if (!ethers.isAddress(address)) {
      setStatus(`❌ Lỗi: Địa chỉ ví ${actionName} không hợp lệ!`);
      return;
    }

    try {
      setLoading(true);
      setStatus(`Đang ${actionName}...`);

      // Thêm gasLimit thủ công để tránh lỗi ước lượng thấp
      const tx = await actionFunc(address, { gasLimit: 500000 });
      await tx.wait();
      setStatus(`✅ Đã ${actionName} thành công!`);

      // Reset input và reload bảng
      if (actionName.includes('Nông dân')) setFarmerAddress('');

      fetchFarmers(); // Cập nhật danh sách mới ngay lập tức
    } catch (error) {
      console.error(error);
      setStatus('❌ Lỗi: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (address) => {
    // 1. Approve on Blockchain
    await validateAndExecute('cấp quyền Nông Dân', contract.addFarmer, address);
  };

  if (!account) return <div className="text-center py-10 text-gray-500">Vui lòng kết nối ví Admin.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-purple-800 border-b pb-2">🛡️ Admin Dashboard</h2>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-sm text-yellow-800">
        <p><strong>👑 Ví Admin Hệ Thống:</strong> <span className="font-mono font-bold">{adminAddress}</span></p>
        <p className="mt-1">Chỉ ví này mới có quyền Thêm/Xóa nhân viên. Hãy kiểm tra MetaMask xem bạn đã chọn đúng ví này chưa.</p>
        {!isAdminWallet && (
          <p className="mt-2 text-red-600 font-bold">⚠️ BẠN ĐANG DÙNG VÍ KHÁC. VUI LÒNG CHUYỂN VỀ VÍ ADMIN Ở TRÊN.</p>
        )}
      </div>



      <div className="grid grid-cols-1 gap-8 max-w-2xl mx-auto">
        {/* Quản lý Nông dân */}
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 col-span-1">
          <h3 className="font-bold text-yellow-800 mb-4 flex items-center gap-2">
            📩 Yêu Cầu Cấp Quyền (Pending)
          </h3>

          {pendingRequests.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Không có yêu cầu nào.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req, idx) => (
                <div key={idx} className="bg-white p-3 rounded shadow-sm border border-yellow-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{req.username}</p>
                    <p className="text-xs text-gray-500">Xin cấp quyền Nông Dân</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveRequest(req.walletAddress)}
                      className="bg-green-600 text-white text-xs px-3 py-1.5 rounded font-bold hover:bg-green-700 transition"
                    >
                      Kiểm Duyệt ✍️
                    </button>
                    {/* Add Reject button logic if needed later */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Quản lý Nhà máy đã bị xóa theo yêu cầu */}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-xl border border-blue-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-blue-800 flex items-center gap-2">📋 Danh sách Nông Dân đang hoạt động</h3>
          <button
            onClick={fetchFarmers}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 transform"
          >
            🔄 Làm Mới
          </button>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-bold text-blue-800 uppercase">STT</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-blue-800 uppercase">Địa chỉ Ví</th>
                <th className="px-4 py-2 text-right text-xs font-bold text-blue-800 uppercase">Tác vụ</th>
              </tr>
            </thead>
            <tbody>
              {farmersList.length === 0 ? (
                <tr><td colSpan="3" className="px-4 py-4 text-center text-gray-500 italic">Chưa có nông dân nào.</td></tr>
              ) : (
                farmersList.map((fAddr, index) => (
                  <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-600 font-bold">{index + 1}</td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-800">{fAddr}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => { setFarmerAddress(fAddr); validateAndExecute('xóa Nông dân', contract.removeFarmer, fAddr); }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>



      {
        status && (
          <div className={`mt-6 p-4 rounded-lg text-center font-medium ${status.includes('✅') ? 'bg-green-100 text-green-800' : (status.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}`}>
            {status}
          </div>
        )
      }
    </div >
  );
}

export default AdminDashboard;
