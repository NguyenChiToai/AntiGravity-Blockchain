import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function AdminDashboard({ contract, account }) {
  const [farmerAddress, setFarmerAddress] = useState('');
  const [millerAddress, setMillerAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [isAdminWallet, setIsAdminWallet] = useState(true);
  const [adminAddress, setAdminAddress] = useState('');

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
  }, [contract, account]);

  const validateAndExecute = async (actionName, actionFunc, address) => {
    if (!contract) return;
    if (!isAdminWallet) {
      alert(`Vui lòng kết nối đúng ví Admin: ${adminAddress}`);
      return;
    }
    if (!ethers.isAddress(address)) {
      setStatus(`❌ Lỗi: Địa chỉ ví ${actionName} không hợp lệ!`);
      return;
    }

    try {
      setLoading(true);
      setStatus(`Đang ${actionName}...`);

      // Thêm gasLimit thủ công để tránh lỗi ước lượng thấp
      const tx = await actionFunc(address, { gasLimit: 500000 });
      await tx.wait();
      setStatus(`✅ Đã ${actionName}: ${address}`);
      if (actionName.includes('Nông dân')) setFarmerAddress('');
      else setMillerAddress('');
    } catch (error) {
      console.error(error);
      setStatus('❌ Lỗi: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Quản lý Nông dân */}
        <div className="bg-green-50 p-6 rounded-xl border border-green-200">
          <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            👨‍🌾 Quản lý Nông Dân
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Ví</label>
              <input
                type="text"
                value={farmerAddress}
                onChange={(e) => setFarmerAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                placeholder="0x..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => validateAndExecute('thêm Nông dân', contract.addFarmer, farmerAddress)}
                disabled={loading || !isAdminWallet}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
              <button
                onClick={() => validateAndExecute('xóa Nông dân', contract.removeFarmer, farmerAddress)}
                disabled={loading || !isAdminWallet}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Quản lý Nhà máy */}
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
            🏭 Quản lý Nhà Máy
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ Ví</label>
              <input
                type="text"
                value={millerAddress}
                onChange={(e) => setMillerAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                placeholder="0x..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => validateAndExecute('thêm Nhà máy', contract.addMiller, millerAddress)}
                disabled={loading || !isAdminWallet}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thêm
              </button>
              <button
                onClick={() => validateAndExecute('xóa Nhà máy', contract.removeMiller, millerAddress)}
                disabled={loading || !isAdminWallet}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-100 p-6 rounded-xl border border-gray-300">
        <h3 className="font-bold text-gray-700 mb-4">🧪 Danh sách Ví Test (Hardhat Localhost)</h3>
        <p className="text-sm text-gray-500 mb-4">Sử dụng các địa chỉ này để cấp quyền thử nghiệm:</p>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between bg-white p-3 rounded border">
            <div>
              <span className="font-bold text-gray-800">Account #1 (Ví dụ: Nông dân)</span>
              <code className="block text-xs text-gray-500 mt-1">0x70997970C51812dc3A010C7d01b50e0d17dc79C8</code>
            </div>
            <button
              onClick={() => setFarmerAddress('0x70997970C51812dc3A010C7d01b50e0d17dc79C8')}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition"
            >
              Điền vào ô Nông dân
            </button>
          </div>

          <div className="flex items-center justify-between bg-white p-3 rounded border">
            <div>
              <span className="font-bold text-gray-800">Account #2 (Ví dụ: Nhà máy)</span>
              <code className="block text-xs text-gray-500 mt-1">0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC</code>
            </div>
            <button
              onClick={() => setMillerAddress('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded transition"
            >
              Điền vào ô Nhà máy
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div className={`mt-6 p-4 rounded-lg text-center font-medium ${status.includes('✅') ? 'bg-green-100 text-green-800' : (status.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
