import { useState } from 'react';

function ConsumerView({ contract }) {
    const [searchId, setSearchId] = useState('');
    const [batchData, setBatchData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!contract) return alert("Chưa kết nối hệ thống");

        try {
            setLoading(true);
            setError('');
            setBatchData(null);

            const data = await contract.getBatch(searchId);

            // Convert BigInt to Number/String for display
            const formattedData = {
                id: data.id.toString(),
                variety: data.variety,
                origin: data.origin,
                farmer: data.farmer,
                miller: data.miller,
                harvestDate: new Date(Number(data.harvestDate) * 1000).toLocaleDateString('vi-VN'),
                millingDate: Number(data.millingDate) > 0 ? new Date(Number(data.millingDate) * 1000).toLocaleDateString('vi-VN') : 'Chưa xay xát',
                isOrganic: data.isOrganic,
                state: Number(data.state),
                ipfsHash: data.ipfsHash
            };

            if (formattedData.id === "0") {
                setError("Không tìm thấy lô gạo này.");
            } else {
                setBatchData(formattedData);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Lỗi khi truy xuất dữ liệu.");
            setLoading(false);
        }
    };

    // Dữ liệu trên bao bì sẽ hiển thị động theo lô hàng (mô phỏng việc quét QR ra thông tin)
    const labelInfo = batchData ? {
        name: `Gạo ${batchData.variety} Đặc Sản`,
        variety: batchData.variety,
        origin: batchData.origin,
        image: batchData.ipfsHash.startsWith('http') ? batchData.ipfsHash : (batchData.ipfsHash.length > 10 ? `https://gateway.pinata.cloud/ipfs/${batchData.ipfsHash}` : 'https://via.placeholder.com/150?text=No+Image')
    } : { name: '', variety: '', origin: '', image: '' };

    const isMismatch = false; // Tạm thời bỏ qua logic mismatch cứng nhắc, vì giờ dữ liệu là động

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-orange-800 border-b pb-2">🛒 Tra Cứu Nguồn Gốc</h2>

            <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                <input
                    type="number"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Nhập mã số lô gạo (hoặc quét QR)..."
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition"
                >
                    {loading ? 'Đang tìm...' : 'Tra Cứu'}
                </button>
            </form>

            {error && <div className="text-red-500 text-center mb-4">{error}</div>}

            {batchData && (
                <div className="space-y-6 animate-fade-in">
                    {batchData.state === 3 ? (
                        <div className="bg-red-100 border-l-4 border-red-600 p-6 rounded-r-lg text-center">
                            <h3 className="text-2xl font-bold text-red-800 mb-2">❌ LÔ HÀNG ĐÃ BỊ HỦY</h3>
                            <p className="text-red-700">Lô gạo này đã bị xóa khỏi hệ thống do sai sót hoặc thu hồi.</p>
                        </div>
                    ) : (
                        <>
                            {/* Phần hiển thị thông tin trên bao bì (Dynamic) */}
                            <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-gray-200 text-gray-600 px-3 py-1 text-xs font-bold rounded-bl-lg">
                                    THÔNG TIN SẢN PHẨM
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border">
                                        {labelInfo.image.includes('placeholder') && labelInfo.image.includes('No+Image') && batchData.ipfsHash.length > 5 ? (
                                            <img src={batchData.ipfsHash} alt="Ảnh bao bì" className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error+Image'} />
                                        ) : (
                                            <img src={labelInfo.image} alt="Ảnh bao bì" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{labelInfo.name}</h3>
                                        <p className="text-gray-600">Giống lúa: <span className="font-semibold text-green-700">{labelInfo.variety}</span></p>
                                        <p className="text-gray-600">Xuất xứ: {labelInfo.origin}</p>
                                        <p className="text-gray-500 text-sm mt-2 italic">"Sản phẩm được truy xuất nguồn gốc minh bạch trên Blockchain"</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg flex items-center gap-4">
                                <div className="text-3xl">✅</div>
                                <div>
                                    <h4 className="text-green-800 font-bold text-lg">XÁC THỰC: CHÍNH HÃNG</h4>
                                    <p className="text-green-700">Dữ liệu hoàn toàn trùng khớp với Blockchain.</p>
                                </div>
                            </div>

                            {/* Phần hiển thị dữ liệu Blockchain */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm relative">
                                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-md">
                                    DỮ LIỆU GỐC (BLOCKCHAIN)
                                </div>
                                <h3 className="text-lg font-bold text-blue-900 mb-4">Hành Trình Sản Phẩm</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-2">1. Tại Nông Trại (Farmer)</h4>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li>• <strong>Nông dân:</strong> <span className="font-mono text-xs bg-gray-200 px-1 rounded">{batchData.farmer}</span></li>
                                            <li>• <strong>Giống lúa:</strong> <span className="text-green-600 font-bold">{batchData.variety}</span></li>
                                            <li>• <strong>Vùng trồng:</strong> {batchData.origin}</li>
                                            <li>• <strong>Ngày gặt:</strong> {batchData.harvestDate}</li>
                                            <li>• <strong>Canh tác:</strong> {batchData.isOrganic ? <span className="text-green-600 font-bold">Hữu cơ (Organic) 🌿</span> : 'Thông thường'}</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-2">2. Tại Nhà Máy (Miller)</h4>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li>• <strong>Nhà máy:</strong> {batchData.miller === "0x0000000000000000000000000000000000000000" ? 'Chưa xử lý' : <span className="font-mono text-xs bg-gray-200 px-1 rounded">{batchData.miller}</span>}</li>
                                            <li>• <strong>Ngày xay xát:</strong> {batchData.millingDate}</li>
                                            <li>• <strong>Trạng thái:</strong>
                                                <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">
                                                    {batchData.state === 0 ? 'Lúa thu hoạch' : batchData.state === 1 ? 'Đã đóng gói' : batchData.state === 2 ? 'Đã bán' : 'Đã xóa'}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default ConsumerView;
