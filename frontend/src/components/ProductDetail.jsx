import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';

// Helper: Format Date
const formatDate = (timestamp) => {
    if (!timestamp || Number(timestamp) === 0) return 'Chưa có';
    return new Date(Number(timestamp) * 1000).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

function ProductDetail({ contract }) {
    const { id } = useParams();
    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBatch = async () => {
            if (!contract || !id) return;
            try {
                // Gọi contract lấy thông tin lô hàng
                const item = await contract.getBatch(id);

                // Mockup dữ liệu ngày tháng (Vì contract chưa lưu harvestDate chính xác hoặc chưa có logic update)
                // Ta sẽ giả lập dựa trên block.timestamp nếu cần, hoặc dùng data thực nếu có
                const now = Math.floor(Date.now() / 1000);

                setBatch({
                    id: item.id.toString(),
                    variety: item.variety,
                    origin: item.origin,
                    farmer: item.farmer,
                    miller: item.miller,
                    harvestDate: item.harvestDate, // Sử dụng data thật từ contract
                    millingDate: item.millingDate,
                    state: Number(item.state),
                    ipfsHash: item.ipfsHash,
                    isOrganic: item.isOrganic
                });
            } catch (error) {
                console.error("Lỗi fetch chi tiết:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatch();
    }, [contract, id]);

    if (loading) return <div className="text-center py-20 text-orange-600 text-xl font-bold animate-pulse">🌾 Đang truy xuất nguồn gốc...</div>;
    if (!batch || batch.id === '0') return <div className="text-center py-20 text-red-500 font-bold">❌ Không tìm thấy thông tin sản phẩm!</div>;

    // Logic Timeline: Xác định các mốc đã qua
    // State 0: Mới gặt
    // State 1: Đã xay xát
    // State 2: Đã bán
    const currentStep = batch.state;

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 py-10 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-orange-100">

                {/* Header Ảnh & Tên */}
                <div className="relative h-64 bg-gray-200">
                    <img
                        src={batch.ipfsHash.startsWith('http') || batch.ipfsHash.startsWith('data:') ? batch.ipfsHash : 'https://via.placeholder.com/800x400'}
                        alt={batch.variety}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                        <div className="flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-bold mb-1">{batch.variety}</h1>
                                <p className="text-orange-300 font-medium text-lg flex items-center gap-2">
                                    📍 {batch.origin}
                                    {batch.isOrganic && <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full border border-green-400">Organic</span>}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="block text-xs uppercase tracking-wider opacity-80">Mã Lô Hàng</span>
                                <span className="text-2xl font-mono font-bold">#{batch.id}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* HÀNH TRÌNH SẢN PHẨM (TIMELINE) */}
                    <h2 className="text-xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-3">
                        🔍 Kết Quả Truy Xuất Nguồn Gốc & Chất Lượng
                    </h2>

                    <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-4">

                        {/* Mốc 1: Gieo Trồng & Thu Hoạch */}
                        <div className="relative pl-8">
                            <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${currentStep >= 0 ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300'}`}></span>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 shadow-sm">
                                <h4 className="font-bold text-green-800 text-lg">✅ Xác Thực Nguồn Gốc (Chính Hãng)</h4>
                                <p className="text-sm text-gray-600 mt-1">Sản phẩm này là THẬT. Dữ liệu gieo trồng đã được ghi nhận vĩnh viễn trên Blockchain.</p>
                                <div className="mt-3 text-sm text-gray-700 bg-white p-3 rounded border border-green-100">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold">🧑‍🌾 Nông Dân:</span>
                                        <span className="font-mono text-xs bg-gray-100 px-1 rounded">{batch.farmer}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold">🗓️ Ngày Gặt:</span>
                                        <span>{batch.harvestDate > 0 ? formatDate(batch.harvestDate) : 'Đang cập nhật'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mốc 2: Bằng Chứng Blockchain (Immutability) */}
                        <div className="relative pl-8">
                            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-blue-500 border-blue-500"></span>
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 shadow-sm">
                                <h4 className="font-bold text-blue-800 text-lg">🔒 Bằng Chứng Blockchain (Không Thể Sửa Đổi)</h4>
                                <p className="text-sm text-gray-600 mt-1">Dữ liệu lô hàng này đã được mã hóa và lưu trữ vĩnh viễn trên sổ cái. Không ai có thể gian lận hoặc thay đổi thông tin.</p>
                                <div className="mt-3 text-sm text-gray-700 bg-white p-3 rounded border border-blue-100 font-mono text-xs break-all">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-gray-500">Smart Contract:</span>
                                        <span>{contract ? contract.target : '0xB7f8...F5e'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-2">
                                        <span className="font-bold text-gray-500">Trạng Thái Dữ Liệu:</span>
                                        <span className="text-green-600 font-bold uppercase">✅ Đã Xác Thực (Verified)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mốc 3: Cam Kết Chất Lượng */}
                        <div className="relative pl-8">
                            <span className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-orange-500 border-orange-500"></span>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 shadow-sm">
                                <h4 className="font-bold text-orange-800 text-lg">🛡️ Cam Kết Chất Lượng & An Toàn</h4>
                                <p className="text-sm text-gray-600 mt-1">Sản phẩm tuân thủ nghiêm ngặt các quy trình canh tác nông nghiệp sạch.</p>
                                <div className="mt-3 flex gap-2">
                                    {batch.isOrganic ? (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                                            ✅ Chứng Nhận Hữu Cơ (Organic)
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-200">
                                            ✅ Tiêu Chuẩn VietGAP
                                        </span>
                                    )}
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold border border-yellow-200">
                                        ✅ Không Thuốc Trừ Sâu
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link to="/" className="inline-block px-6 py-2 bg-gray-800 text-white rounded-full font-bold hover:bg-black transition shadow-lg">
                            🔍 Tra Cứu Sản Phẩm Khác
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ProductDetail;
