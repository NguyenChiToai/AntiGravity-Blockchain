import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import QRCode from "react-qr-code";

function ProductManagement({ contract, account, userRole }) {
    const [activeBatches, setActiveBatches] = useState([]);
    const [hiddenBatches, setHiddenBatches] = useState([]);

    // Form States
    const [variety, setVariety] = useState('ST25');
    const [origin, setOrigin] = useState('Sóc Trăng');
    const [isOrganic, setIsOrganic] = useState(false);
    const [imagePreview, setImagePreview] = useState(null); // Để hiện ảnh xem trước
    const [base64Image, setBase64Image] = useState('');     // Để lưu vào Blockchain

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [isAdminFarmer, setIsAdminFarmer] = useState(false);
    const [qrCodeId, setQrCodeId] = useState(null); // ID của lô cần hiện QR



    // --- LOGIC CONTRACT ---

    // 1. Fetch Danh sách
    const fetchBatches = async () => {
        if (!contract) return;
        try {
            const count = await contract.batchCount();
            const rawItems = [];

            // Loop to get all items
            for (let i = 1; i <= Number(count); i++) {
                const item = await contract.getBatch(i);
                rawItems.push(item);
            }

            // Lọc sản phẩm
            const active = [];
            const hidden = [];

            const sortedItems = rawItems.reverse(); // Mới nhất lên đầu

            sortedItems.forEach((item, index) => {
                const processedItem = {
                    id: item.id.toString(),
                    displayId: rawItems.length - index, // ID hiển thị giảm dần
                    variety: item.variety,
                    origin: item.origin,
                    farmer: item.farmer,
                    state: Number(item.state),
                    ipfsHash: item.ipfsHash,
                    isOrganic: item.isOrganic
                };

                if (Number(item.state) === 3) {
                    hidden.push(processedItem);
                } else {
                    active.push(processedItem);
                }
            });

            setActiveBatches(active);
            setHiddenBatches(hidden);

        } catch (error) {
            console.error("Lỗi fetch batches:", error);
        }
    };

    // 2. Check quyền Farmer (Admin cần có quyền này để thêm SP)
    useEffect(() => {
        const checkRole = async () => {
            if (contract && account) {
                const isFarmer = await contract.farmers(account);
                setIsAdminFarmer(isFarmer);
            }
        };
        checkRole();
        checkRole();
        fetchBatches();

        // Listen for events to auto-refresh
        if (contract) {
            const onBatchCreated = () => {
                console.log("Event: BatchCreated detected, refreshing...");
                fetchBatches();
            };
            const onBatchUpdated = () => {
                console.log("Event: BatchUpdated detected, refreshing...");
                fetchBatches();
            };

            // Subscribe
            contract.on("PaddyBatchCreated", onBatchCreated);
            contract.on("RiceBatchUpdated", onBatchUpdated);

            // Cleanup
            return () => {
                contract.off("PaddyBatchCreated", onBatchCreated);
                contract.off("RiceBatchUpdated", onBatchUpdated);
            };
        }
    }, [contract, account]);

    // 3. Xin quyền (Request Access)
    const requestAccess = async () => {
        if (!contract || !account) return;
        try {
            setLoading(true);
            setStatus("⏳ Đang gửi yêu cầu trở thành Nông Dân...");
            const tx = await contract.requestFarmerRole();
            await tx.wait();
            setStatus("✅ Đã gửi yêu cầu! Vui lòng chờ Admin duyệt.");
        } catch (error) {
            console.error(error);
            // Handle specific errors
            if (error.reason && error.reason.includes("Already a farmer")) {
                setStatus("ℹ️ Bạn đã là Nông Dân rồi.");
            } else if (error.reason && error.reason.includes("pending")) {
                setStatus("⏳ Yêu cầu của bạn đang chờ duyệt.");
            } else {
                setStatus("❌ Lỗi: " + (error.reason || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // const [editId, setEditId] = useState(null); // REMOVED: Immutability Enforced


    const resetForm = () => {
        setVariety('ST25');
        setOrigin('');
        setIsOrganic(false);
        setImagePreview(null);
        setBase64Image('');
        // setEditId(null);
    };

    // startEdit function removed


    // 4. Tạo hoặc Sửa lô hàng
    const handleCreateBatch = async (e) => {
        e.preventDefault();
        if (!contract) return;
        if (!base64Image) {
            alert("Vui lòng chọn ảnh hoặc nhập link!");
            return;
        }

        try {
            setLoading(true);

            // if (editId) { ... } REMOVED

            // 1. Get current count from Blockchain BEFORE creating
            const initialCount = await contract.batchCount();
            console.log("Initial count:", Number(initialCount));

            // CREATE MODE
            setStatus("Đang tạo lô hàng mới...");
            const tx = await contract.createPaddyBatch(variety, origin, isOrganic, base64Image, { gasLimit: 5000000 });
            setStatus("Đang chờ xác nhận...");
            await tx.wait();
            setStatus("✅ Tạo mới thành công!");

            resetForm();

            // Active Polling: Wait for node to index new item (Count > Initial)
            let retries = 0;
            const maxRetries = 20; // Try for 20 seconds

            const poll = async () => {
                if (retries >= maxRetries) {
                    console.log("Polling timeout, fetching anyway.");
                    fetchBatches();
                    return;
                }

                try {
                    const newCount = await contract.batchCount();
                    console.log(`Polling: ${newCount} vs Initial ${initialCount}`);

                    if (Number(newCount) > Number(initialCount)) {
                        console.log("New item detected on-chain! Refreshing list...");
                        fetchBatches();
                    } else {
                        retries++;
                        setTimeout(poll, 1000);
                    }
                } catch (e) {
                    console.error("Poll error:", e);
                    setTimeout(poll, 1000);
                }
            };

            // Start polling
            poll();

        } catch (error) {
            console.error(error);
            setStatus("❌ Lỗi: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };

    // 5. Xóa lô hàng
    const handleDelete = async (id) => {
        if (!confirm("Bạn chắc chắn muốn xóa lô này?")) return;
        try {
            setLoading(true);
            setStatus(`Đang xóa lô #${id}...`);
            console.log(`[Delete] Deleting batch #${id}...`);

            const tx = await contract.deleteBatch(id, { gasLimit: 500000 });
            console.log(`[Delete] Tx sent: ${tx.hash}, waiting...`);
            await tx.wait();
            console.log(`[Delete] Tx confirmed.`);

            setStatus(`✅ Đã xóa lô #${id}`);

            // Wait slightly before fetching to ensure node update
            setTimeout(() => {
                console.log(`[Delete] Refreshing list...`);
                fetchBatches();
            }, 1000);

        } catch (error) {
            console.error("[Delete Error]", error);
            setStatus("❌ Lỗi xóa: " + (error.reason || error.message));
        } finally {
            setLoading(false);
        }
    };


    const downloadQRCode = () => {
        const svg = document.getElementById("qr-code-svg");
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_Rice_${qrCodeId}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="max-w-5xl mx-auto relative">
            {/* Modal QR Code */}
            {qrCodeId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm w-full text-center animate-bounce-in">
                        <h3 className="text-xl font-bold text-orange-600 mb-2">Quét Mã Truy Xuất</h3>
                        <p className="text-sm text-gray-500 mb-4">Sử dụng camera điện thoại để xem hành trình hạt gạo</p>

                        <div className="bg-white p-4 border border-gray-200 rounded-lg inline-block">
                            <QRCode
                                id="qr-code-svg"
                                value={`http://localhost:5173/product/${qrCodeId}`}
                                size={200}
                                level="H"
                            />
                        </div>

                        <div className="mt-6 flex justify-center gap-4">
                            <button
                                onClick={downloadQRCode}
                                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full transition shadow flex items-center gap-2"
                            >
                                ⬇️ Tải Ảnh
                            </button>
                            <button
                                onClick={() => setQrCodeId(null)}
                                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-full transition"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ... Header ... */}
            <h2 className="text-2xl font-bold mb-6 text-orange-800 border-b pb-2 flex items-center gap-2">
                📦 Quản Lý Sản Phẩm
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CỘT TRÁI - FORM HOẶC REQUEST ACCESS */}
                <div className="lg:col-span-1">
                    {!isAdminFarmer && userRole !== 'admin' ? (
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-400 text-center">
                            <h3 className="text-xl font-bold text-gray-700 mb-4">🚫 Chưa có quyền truy cập</h3>
                            <p className="text-gray-500 mb-6">Bạn cần quyền <strong>Nông Dân</strong> để thêm sản phẩm mới vào Blockchain.</p>

                            <button
                                onClick={requestAccess}
                                disabled={loading}
                                className={`px-6 py-3 rounded-full font-bold text-white shadow-lg transition transform active:scale-95
                                    ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'}`}
                            >
                                {loading ? '⏳ Đang xử lý...' : '🙋‍♂️ Xin Kiểm Duyệt (Lên Nông Dân)'}
                            </button>
                            {status && (
                                <div className={`mt-4 p-3 rounded text-sm ${status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {status}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-orange-500 sticky top-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 text-lg">
                                    ✨ Thêm Sản Phẩm Mới
                                </h3>
                            </div>

                            <form onSubmit={handleCreateBatch} className="space-y-4">
                                {/* ... Fields Variety/Origin ... */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên/Giống Lúa</label>
                                    <select
                                        value={variety}
                                        onChange={(e) => setVariety(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        <option value="ST25">ST25 (Gạo Ông Cua)</option>
                                        <option value="ST24">ST24 (Sóc Trăng)</option>
                                        <option value="Gạo Thơm Jasmine">Gạo Thơm Jasmine</option>
                                        <option value="Nếp Cái Hoa Vàng">Nếp Cái Hoa Vàng</option>
                                        <option value="Nàng Thơm Chợ Đào">Nàng Thơm Chợ Đào</option>
                                        <option value="Tài Nguyên Thơm">Tài Nguyên Thơm</option>
                                        <option value="Gạo OM5451">Gạo OM5451</option>
                                        <option value="Đài Thơm 8">Đài Thơm 8</option>
                                        <option value="Gạo Huyết Rồng">Gạo Huyết Rồng</option>
                                        <option value="Gạo Lứt Đỏ">Gạo Lứt Đỏ</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn Gốc / Vùng Trồng</label>
                                    <select
                                        value={origin}
                                        onChange={(e) => setOrigin(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        <option value="">-- Chọn Tỉnh Thành --</option>
                                        <option value="Sóc Trăng">Sóc Trăng</option>
                                        <option value="Bạc Liêu">Bạc Liêu</option>
                                        <option value="Cần Thơ">Cần Thơ</option>
                                        <option value="An Giang">An Giang</option>
                                        <option value="Đồng Tháp">Đồng Tháp</option>
                                        <option value="Long An">Long An</option>
                                        <option value="Tiền Giang">Tiền Giang</option>
                                        <option value="Kiên Giang">Kiên Giang</option>
                                        <option value="Hậu Giang">Hậu Giang</option>
                                        <option value="Vĩnh Long">Vĩnh Long</option>
                                        <option value="Trà Vinh">Trà Vinh</option>
                                        <option value="Bến Tre">Bến Tre</option>
                                        <option value="Cà Mau">Cà Mau</option>
                                    </select>
                                </div>

                                {/* Image Input Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hình Ảnh Sản Phẩm (URL)</label>
                                    <input
                                        type="text"
                                        value={base64Image}
                                        onChange={(e) => {
                                            setBase64Image(e.target.value);
                                            setImagePreview(e.target.value);
                                        }}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-xs font-mono focus:border-orange-500"
                                        placeholder="https://example.com/image.jpg"
                                    />

                                    {imagePreview && (
                                        <div className="mt-2 text-center">
                                            <img src={imagePreview} alt="Preview" className="mx-auto h-32 object-contain rounded border border-gray-200" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={isOrganic}
                                        onChange={(e) => setIsOrganic(e.target.checked)}
                                        className="w-4 h-4 text-orange-600"
                                    />
                                    <span className="text-sm text-gray-700">Canh tác Hữu cơ (Organic)</span>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition transform active:scale-95
                                        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'}`}
                                >
                                    {loading ? 'Đang xử lý...' : '➕ Tạo Sản Phẩm'}
                                </button>
                            </form>

                            {status && (
                                <div className={`mt-4 p-3 rounded text-sm text-center ${status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {status}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: DANH SÁCH */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">📦 Kho Hàng Blockchain</h3>
                            <button
                                onClick={fetchBatches}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                            >
                                🔄 Làm Mới
                            </button>
                        </div>

                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sản Phẩm</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">QR Truy Xuất</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nguồn Gốc</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Trạng Thái</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Tác Vụ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {activeBatches.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Chưa có sản phẩm nào.</td></tr>
                                    ) : (
                                        activeBatches.map((batch) => (
                                            <tr key={batch.id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-12 w-12 bg-gray-100 rounded-lg overflow-hidden border">
                                                            <img className="h-12 w-12 object-cover"
                                                                src={batch.ipfsHash.startsWith('data:image') ? batch.ipfsHash : (batch.ipfsHash.startsWith('http') ? batch.ipfsHash : 'https://via.placeholder.com/50')}
                                                                alt="" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-bold text-gray-900">#{batch.displayId} - {batch.variety}</div>
                                                            <div className="text-xs text-gray-500 font-mono" title={batch.farmer}>Farmer: {batch.farmer.slice(0, 4)}...{batch.farmer.slice(-4)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => setQrCodeId(batch.id)}
                                                        className="group flex flex-col items-center justify-center p-2 rounded-lg hover:bg-orange-50 transition"
                                                    >
                                                        <div className="p-1 bg-white border rounded shadow-sm group-hover:shadow-md transition">
                                                            <QRCode
                                                                value={`http://localhost:5173/product/${batch.id}`}
                                                                size={32}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-orange-600 font-bold mt-1 opacity-0 group-hover:opacity-100 transition">Phóng to</div>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600 max-w-[150px] truncate" title={batch.origin}>
                                                    {batch.origin}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                                                        ${batch.state === 3 ? 'bg-red-100 text-red-800' : (batch.state === 2 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800')}
                                                     `}>
                                                        {batch.state === 0 ? 'Mới' : batch.state === 1 ? 'Đã đóng gói' : batch.state === 2 ? 'Đã bán' : 'ĐÃ XÓA'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-sm">
                                                    {(userRole === 'admin' || (userRole === 'farmer' && batch.farmer.toLowerCase() === account.toLowerCase())) && (
                                                        <button
                                                            onClick={() => handleDelete(batch.id)}
                                                            className="text-red-600 hover:text-red-900 font-medium bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-xs transition border border-red-200"
                                                            title="Đánh dấu lô hàng lỗi (Không xóa được trên Blockchain)"
                                                        >
                                                            ⚠️ Ẩn / Báo Lỗi
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bảng sản phẩm bị ẩn/lỗi */}
                    {hiddenBatches.length > 0 && (userRole === 'admin' || userRole === 'farmer') && (
                        <div className="mt-12 bg-gray-100 rounded-xl shadow-inner p-6 border border-gray-300">
                            <h3 className="text-xl font-bold mb-4 text-gray-600 flex items-center gap-2">
                                🗑️ Lịch Sử Sản Phẩm Lỗi / Đã Ẩn
                                <span className="text-xs font-normal bg-gray-200 px-2 py-1 rounded text-gray-500">Chỉ Admin & Farmer thấy</span>
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Sản Phẩm</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Nguồn Gốc</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Trạng Thái</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-gray-50 opacity-75">
                                        {hiddenBatches.map((batch) => (
                                            <tr key={batch.id}>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    #{batch.displayId} - {batch.variety}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                    {batch.origin}
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
                                                        ĐÃ ẨN
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductManagement;
