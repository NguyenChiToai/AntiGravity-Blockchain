// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RiceTracking (Hệ Thống Truy Xuất Nguồn Gốc Gạo)
 * @dev Hợp đồng thông minh quản lý vòng đời sản phẩm từ Nông Dân -> Nhà Máy -> Người Tiêu Dùng.
 *      Được thiết kế cho đồ án tốt nghiệp, tập trung vào tính minh bạch và bất biến.
 */
contract RiceTracking {
    // ------------------------------------------
    // 1. CẤU TRÚC DỮ LIỆU (DATA STRUCTURES)
    // ------------------------------------------

    // Các trạng thái của lô lúa
    enum State { 
        PADDY_HARVESTED,    // 0: Lúa vừa thu hoạch (Nông dân tạo)
        PROCESSED_PACKAGED, // 1: Đã qua chế biến & đóng gói (Nhà máy xử lý)
        SOLD,               // 2: Đã bán cho khách hàng
        DELETED             // 3: Đánh dấu đã xóa (Chỉ hiển thị với Admin)
    }

    // Thông tin chi tiết một lô lúa
    struct RiceBatch {
        uint256 id;             // ID duy nhất của lô
        string variety;         // Giống lúa (VD: ST25, OM5451...)
        string origin;          // Vùng trồng (VD: Sóc Trăng, Cần Thơ...)
        address farmer;         // Địa chỉ ví Nông Dân
        address miller;         // Địa chỉ ví Nhà Máy (Người chế biến)
        uint256 harvestDate;    // Thời gian thu hoạch (Lưu Timestamp)
        uint256 millingDate;    // Thời gian chế biến
        bool isOrganic;         // Xác nhận đạt chuẩn Hữu cơ (Organic)
        State state;            // Trạng thái hiện tại
        string ipfsHash;        // Hash ảnh lưu trên IPFS/Link ảnh
    }

    // Lưu trữ danh sách lô lúa (Mapping giúp tiết kiệm Gas hơn Array)
    mapping(uint256 => RiceBatch) public batches;
    uint256 public batchCount;

    // ------------------------------------------
    // 2. PHÂN QUYỀN & QUẢN LÝ USER
    // ------------------------------------------

    address public admin;       // Người quản trị cao nhất (Triển khai hợp đồng)
    
    // Hệ thống danh sách trắng (Whitelist) cho Nông Dân và Nhà Máy
    mapping(address => bool) public farmers;
    address[] public farmerList; // Mảng phụ để Admin dễ dàng hiển thị danh sách
    
    mapping(address => bool) public millers;

    // Danh sách chờ duyệt (Pending Requests)
    mapping(address => bool) public pendingFarmers;
    address[] public requesterList;

    // ------------------------------------------
    // 3. SỰ KIỆN (EVENTS) - GHI LOG BLOCKCHAIN
    // ------------------------------------------
    event PaddyCreated(uint256 indexed id, string variety, address indexed farmer);
    event RiceProcessed(uint256 indexed id, address indexed miller);
    event BatchDeleted(uint256 indexed id, address indexed deleter);
    event BatchImageUpdated(uint256 indexed id, string newIpfsHash);

    // ------------------------------------------
    // 4. CÁC HÀM KIỂM TRA (MODIFIERS)
    // ------------------------------------------

    modifier onlyAdmin() {
        require(msg.sender == admin, unicode"Chỉ Admin mới có quyền này");
        _;
    }

    modifier onlyFarmer() {
        require(farmers[msg.sender], unicode"Chỉ Nông Dân được cấp quyền mới thực hiện được");
        _;
    }

    modifier onlyMiller() {
        require(millers[msg.sender], unicode"Chỉ Nhà Máy được cấp quyền mới thực hiện được");
        _;
    }

    // ------------------------------------------
    // 5. LOGIC CHÍNH (MAIN FUNCTIONS)
    // ------------------------------------------

    constructor() {
        // NGƯỜI DEPLOY (Account #0) LÀ ADMIN DUY NHẤT & VĨNH VIỄN
        admin = msg.sender; 
    }

    /**
     * @dev Chức năng: Đăng ký xin làm Nông Dân
     * Người lạ gọi hàm này để gửi yêu cầu đến Admin
     */
    function requestFarmerRole() public {
        require(!farmers[msg.sender], unicode"Bạn đã là Nông Dân rồi");
        require(!pendingFarmers[msg.sender], unicode"Yêu cầu đang được xử lý");
        
        pendingFarmers[msg.sender] = true;
        requesterList.push(msg.sender);
    }

    /**
     * @dev Chức năng: Admin duyệt yêu cầu
     * @param _farmer Địa chỉ ví người được duyệt
     */
    function addFarmer(address _farmer) public onlyAdmin {
        if (!farmers[_farmer]) {
            farmers[_farmer] = true;
            farmerList.push(_farmer);
        }
        // Duyệt xong xóa khỏi danh sách chờ
        if (pendingFarmers[_farmer]) {
            pendingFarmers[_farmer] = false;
            _removeFromList(requesterList, _farmer);
        }
    }

    /**
     * @dev Chức năng: Admin xóa quyền Nông Dân
     */
    function removeFarmer(address _farmer) public onlyAdmin {
        require(farmers[_farmer], unicode"Ví này không phải Nông Dân");
        farmers[_farmer] = false;
        
        // Xóa khỏi danh sách hiển thị
        for (uint i = 0; i < farmerList.length; i++) {
            if (farmerList[i] == _farmer) {
                farmerList[i] = farmerList[farmerList.length - 1]; // Đổi chỗ phần tử cuối
                farmerList.pop(); // Xóa phần tử cuối
                break;
            }
        }
    }

    // Lấy danh sách yêu cầu chờ duyệt
    function getRequesters() public view returns (address[] memory) {
        return requesterList;
    }

    // Lấy danh sách nông dân chính thức
    function getAllFarmers() public view returns (address[] memory) {
        return farmerList;
    }

    // Helper: Hàm nội bộ hỗ trợ xóa phần tử khỏi mảng
    function _removeFromList(address[] storage list, address item) internal {
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == item) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
    }

    // ------------------------------------------
    // 6. QUẢN LÝ SẢN PHẨM (CORE FEATURES)
    // ------------------------------------------

    /**
     * @dev Nông dân tạo lô lúa mới sau khi gặt
     */
    function createPaddyBatch(string memory _variety, string memory _origin, bool _isOrganic, string memory _ipfsHash) public {
        require(farmers[msg.sender] || msg.sender == admin, unicode"Không có quyền");
        batchCount++;
        batches[batchCount] = RiceBatch({
            id: batchCount,
            variety: _variety,
            origin: _origin,
            farmer: msg.sender,
            miller: address(0), // Chưa qua nhà máy
            harvestDate: block.timestamp,
            millingDate: 0,
            isOrganic: _isOrganic,
            state: State.PADDY_HARVESTED,
            ipfsHash: _ipfsHash
        });
        emit PaddyCreated(batchCount, _variety, msg.sender);
    }

    /**
     * @dev Cập nhật thông tin lô lúa (Chỉnh sửa nếu nhập sai)
     */
    function updateBatch(uint256 _id, string memory _variety, string memory _origin, bool _isOrganic, string memory _ipfsHash) public {
        RiceBatch storage batch = batches[_id];
        require(batch.id != 0, unicode"Lô hàng không tồn tại");
        require(msg.sender == admin || msg.sender == batch.farmer, unicode"Không chính chủ");

        batch.variety = _variety;
        batch.origin = _origin;
        batch.isOrganic = _isOrganic;
        
        // Chỉ cập nhật ảnh nếu có link mới
        if (bytes(_ipfsHash).length > 0) {
            batch.ipfsHash = _ipfsHash;
            emit BatchImageUpdated(_id, _ipfsHash);
        }
    }

    /**
     * @dev Admin ẩn/xóa lô lúa vi phạm (Soft Delete)
     * Dữ liệu Blockchain không thể xóa thật, chỉ đổi trạng thái sang DELETED
     */
    function deleteBatch(uint256 _id) public onlyAdmin {
        RiceBatch storage batch = batches[_id];
        require(batch.id != 0, unicode"Lô hàng không tồn tại");
        
        batch.state = State.DELETED;
        emit BatchDeleted(_id, msg.sender);
    }
    
    // Lấy thông tin chi tiết lô hàng
    function getBatch(uint256 _id) public view returns (RiceBatch memory) {
        return batches[_id];
    }
}
