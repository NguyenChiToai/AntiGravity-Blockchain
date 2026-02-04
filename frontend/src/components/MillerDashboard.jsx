import { useState } from 'react';

function MillerDashboard({ contract, account }) {
    const [batchId, setBatchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');

    const handleProcess = async (e) => {
        e.preventDefault();
        if (!contract) return alert("Chưa kết nối Smart Contract");

        try {
            setLoading(true);
            setStatus('Đang gửi giao dịch...');

            // Giả lập upload ảnh bao bì mới
            const newIpfsHash = "QmPackagedRiceHash";

            const tx = await contract.processRice(batchId, newIpfsHash);
            setStatus('Đang chờ xác nhận...');
            await tx.wait();

            setStatus('✅ Xử lý & Đóng gói thành công!');
            setLoading(false);
        } catch (error) {
            console.error(error);
            setStatus('❌ Có lỗi xảy ra: ' + (error.reason || error.message));
            setLoading(false);
        }
    };

    if (!account) return <div className="text-center py-10 text-gray-500">Vui lòng kết nối ví để tiếp tục.</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-blue-800 border-b pb-2">🏭 Dashboard Nhà Máy</h2>

            <form onSubmit={handleProcess} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Lô Lúa Cần Xử Lý</label>
                    <input
                        type="number"
                        value={batchId}
                        onChange={(e) => setBatchId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nhập ID lô lúa (VD: 1)"
                    />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-2">Thông tin chế biến</h3>
                    <p className="text-sm text-gray-500">Hệ thống sẽ tự động ghi nhận ngày giờ xay xát và cập nhật trạng thái sang "Đã đóng gói".</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-bold text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg'}`}
                >
                    {loading ? 'Đang xử lý...' : 'Xác Nhận Đóng Gói'}
                </button>

                {status && (
                    <div className={`mt-4 p-4 rounded-lg ${status.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {status}
                    </div>
                )}
            </form>
        </div>
    );
}

export default MillerDashboard;
