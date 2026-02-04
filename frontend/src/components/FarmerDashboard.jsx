import { useState, useEffect } from 'react';

function FarmerDashboard({ contract, account, userRole }) {
    const [variety, setVariety] = useState('ST25');
    const [origin, setOrigin] = useState('Sóc Trăng');
    const [isOrganic, setIsOrganic] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [myBatches, setMyBatches] = useState([]);
    const [batchCount, setBatchCount] = useState(0);

    // Fetch danh sách lô hàng
    const fetchBatches = async () => {
        if (!contract) return;
        try {
            const count = await contract.batchCount();
            setBatchCount(Number(count));
            const batches = [];
            for (let i = Number(count); i >= 1; i--) {
                const batch = await contract.getBatch(i);
                // Chỉ lấy lô hàng của mình hoặc hiển thị tất cả nếu muốn (ở đây hiển thị tất cả để dễ test, hoặc filter theo msg.sender nếu cần)
                // Nhưng theo yêu cầu "hiện số thứ tự lô hàng để tra cứu", nên hiển thị hết hoặc ít nhất là ID.
                // Để tiện cho Farmer quản lý, ta sẽ filter những lô do chính họ tạo HOẶC hiển thị hết nhưng chỉ cho sửa/xóa lô của họ.
                // Ở đây tôi sẽ hiển thị hết để dễ nhìn tổng quan.
                if (batch.id !== 0n) { // Check if exists
                    batches.push({
                        id: batch.id.toString(),
                        variety: batch.variety,
                        origin: batch.origin,
                        farmer: batch.farmer,
                        state: Number(batch.state),
                        ipfsHash: batch.ipfsHash
                    });
                }
            }
            setMyBatches(batches);
        } catch (error) {
            console.error("Lỗi fetch batches:", error);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, [contract, account, status]); // Re-fetch khi status thay đổi (tức là sau khi tạo/xóa xong)

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contract) return alert("Chưa kết nối Smart Contract");

        if (userRole !== 'farmer' && userRole !== 'admin') {
            setStatus('❌ Lỗi: Ví của bạn chưa được cấp quyền Nông Dân!');
            return;
        }

        try {
            setLoading(true);
            setStatus('Đang gửi giao dịch...');

            // Sử dụng URL ảnh người dùng nhập, hoặc placeholder nếu để trống
            const finalImage = imageUrl || "https://via.placeholder.com/150?text=Rice+Image";

            // Thêm gasLimit để tránh lỗi ước lượng
            const tx = await contract.createPaddyBatch(variety, origin, isOrganic, finalImage, { gasLimit: 500000 });
            setStatus('Đang chờ xác nhận...');
            await tx.wait();

            setStatus('✅ Tạo lô lúa thành công!');
            setLoading(false);
            setVariety('ST25'); // Reset form
            setOrigin('Sóc Trăng');
            setImageUrl('');
        } catch (error) {
            console.error(error);
            setStatus('❌ Có lỗi xảy ra: ' + (error.reason || error.message));
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(`Bạn có chắc muốn xóa lô hàng #${id}?`)) return;
        try {
            setLoading(true);
            setStatus(`Đang xóa lô #${id}...`);
            const tx = await contract.deleteBatch(id, { gasLimit: 500000 });
            await tx.wait();
            setStatus(`✅ Đã xóa lô #${id}`);
            setLoading(false);
        } catch (error) {
            setStatus('❌ Lỗi xóa: ' + (error.reason || error.message));
            setLoading(false);
        }
    };

    if (!account) return <div className="text-center py-10 text-gray-500">Vui lòng kết nối ví để tiếp tục.</div>;

    if (userRole !== 'farmer' && userRole !== 'admin') {
        return (
            <div className="max-w-2xl mx-auto text-center py-10">
                <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl">
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">⚠️ Chưa có quyền Nông Dân</h3>
                    <p className="text-yellow-700 mb-4">
                        Ví hiện tại <strong>{account.slice(0, 6)}...{account.slice(-4)}</strong> chưa được cấp quyền Nông Dân.
                    </p>
                    <p className="text-sm text-gray-600">
                        Vui lòng liên hệ <strong>Admin</strong> để thêm địa chỉ ví này vào danh sách Nông Dân.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-green-800 border-b pb-2">👨‍🌾 Dashboard Nông Dân</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Tạo Lô */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-4">Tạo Lô Lúa Mới</h3>
                    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giống Lúa</label>
                            <select
                                value={variety}
                                onChange={(e) => setVariety(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            >
                                <option value="ST25">ST25 (Gạo ngon nhất thế giới)</option>
                                <option value="ST24">ST24</option>
                                <option value="DaiThom8">Đài Thơm 8</option>
                                <option value="IR50404">IR50404 (Lúa thường)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vùng Trồng</label>
                            <input
                                type="text"
                                value={origin}
                                onChange={(e) => setOrigin(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Ví dụ: Ngã Năm, Sóc Trăng"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Link Ảnh (URL)</label>
                            <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="organic"
                                checked={isOrganic}
                                onChange={(e) => setIsOrganic(e.target.checked)}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <label htmlFor="organic" className="text-gray-700 font-medium">Canh tác Hữu cơ (Organic)</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg'}`}
                        >
                            {loading ? 'Đang xử lý...' : 'Tạo Lô Lúa Mới'}
                        </button>

                        {status && (
                            <div className={`mt-4 p-4 rounded-lg text-sm ${status.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                {status}
                            </div>
                        )}
                    </form>
                </div>

                {/* Danh sách Lô */}
                <div>
                    <h3 className="font-bold text-gray-700 mb-4 flex justify-between items-center">
                        <span>Danh Sách Lô Hàng ({batchCount})</span>
                        <button onClick={fetchBatches} className="text-xs text-blue-600 hover:underline">Làm mới</button>
                    </h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {myBatches.map((batch) => (
                            <div key={batch.id} className={`p-4 rounded-lg border ${batch.state === 3 ? 'bg-red-50 border-red-200 opacity-70' : 'bg-white border-gray-200'} shadow-sm`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-green-800">#{batch.id} - {batch.variety}</span>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${batch.state === 3 ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {batch.state === 0 ? 'Mới tạo' : batch.state === 1 ? 'Đã đóng gói' : batch.state === 2 ? 'Đã bán' : 'Đã xóa'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-1">📍 {batch.origin}</p>
                                <p className="text-xs text-gray-400 mb-2 truncate">🖼️ {batch.ipfsHash}</p>

                                {batch.state !== 3 && (batch.farmer.toLowerCase() === account.toLowerCase() || userRole === 'admin') && (
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleDelete(batch.id)}
                                            disabled={loading}
                                            className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200"
                                        >
                                            Xóa lô này
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {myBatches.length === 0 && <p className="text-gray-500 text-center italic">Chưa có lô hàng nào.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FarmerDashboard;
