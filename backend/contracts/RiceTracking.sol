// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RiceTracking {
    enum State { PADDY_HARVESTED, PROCESSED_PACKAGED, SOLD, DELETED }

    struct RiceBatch {
        uint256 id;
        string variety;         // Giống lúa
        string origin;          // Vùng trồng
        address farmer;         // Ví nông dân
        address miller;         // Ví nhà máy
        uint256 harvestDate;    // Ngày gặt
        uint256 millingDate;    // Ngày xay xát
        bool isOrganic;         // Hữu cơ
        State state;
        string ipfsHash;        // Ảnh
    }

    mapping(uint256 => RiceBatch) public batches;
    uint256 public batchCount;

    // Phân quyền
    address public admin;
    mapping(address => bool) public farmers;
    address[] public farmerList; // Mảng lưu danh sách nông dân để hiển thị
    mapping(address => bool) public millers;

    // Yêu cầu quyền (Pending Requests)
    mapping(address => bool) public pendingFarmers;
    address[] public requesterList;

    event PaddyCreated(uint256 indexed id, string variety, address indexed farmer);
    event RiceProcessed(uint256 indexed id, address indexed miller);
    event RoleGranted(bytes32 role, address indexed account);
    event RoleRevoked(bytes32 role, address indexed account);
    event BatchDeleted(uint256 indexed id, address indexed deleter);
    event BatchImageUpdated(uint256 indexed id, string newIpfsHash);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyFarmer() {
        require(farmers[msg.sender], "Only farmer");
        _;
    }

    modifier onlyMiller() {
        require(millers[msg.sender], "Only miller");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addFarmer(address _farmer) public onlyAdmin {
        if (!farmers[_farmer]) {
            farmers[_farmer] = true;
            farmerList.push(_farmer);
        }
        // Sau khi duyệt, xóa khỏi danh sách chờ (nếu có)
        if (pendingFarmers[_farmer]) {
            pendingFarmers[_farmer] = false;
            _removeFromList(requesterList, _farmer);
        }
    }

    function requestFarmerRole() public {
        require(!farmers[msg.sender], "Already a farmer");
        require(!pendingFarmers[msg.sender], "Request already pending");
        
        pendingFarmers[msg.sender] = true;
        requesterList.push(msg.sender);
    }

    function getRequesters() public view returns (address[] memory) {
        return requesterList;
    }

    // Helper: Xóa phần tử khỏi mảng address[]
    function _removeFromList(address[] storage list, address item) internal {
        for (uint i = 0; i < list.length; i++) {
            if (list[i] == item) {
                list[i] = list[list.length - 1];
                list.pop();
                break;
            }
        }
    }

    function removeFarmer(address _farmer) public onlyAdmin {
        require(farmers[_farmer], "Not a farmer");
        farmers[_farmer] = false;
        
        // Xóa khỏi mảng (Swap & Pop)
        for (uint i = 0; i < farmerList.length; i++) {
            if (farmerList[i] == _farmer) {
                farmerList[i] = farmerList[farmerList.length - 1];
                farmerList.pop();
                break;
            }
        }
    }

    // Hàm lấy danh sách nông dân
    function getAllFarmers() public view returns (address[] memory) {
        return farmerList;
    }

    function addMiller(address _miller) public onlyAdmin {
        millers[_miller] = true;
    }

    function removeMiller(address _miller) public onlyAdmin {
        millers[_miller] = false;
    }

    function createPaddyBatch(string memory _variety, string memory _origin, bool _isOrganic, string memory _ipfsHash) public {
        require(farmers[msg.sender] || msg.sender == admin, "Only farmer or admin");
        batchCount++;
        batches[batchCount] = RiceBatch({
            id: batchCount,
            variety: _variety,
            origin: _origin,
            farmer: msg.sender,
            miller: address(0),
            harvestDate: block.timestamp,
            millingDate: 0,
            isOrganic: _isOrganic,
            state: State.PADDY_HARVESTED,
            ipfsHash: _ipfsHash
        });
        emit PaddyCreated(batchCount, _variety, msg.sender);
    }

    function processRice(uint256 _id, string memory _newIpfsHash) public onlyMiller {
        RiceBatch storage batch = batches[_id];
        require(batch.state == State.PADDY_HARVESTED, "Invalid state");
        
        batch.miller = msg.sender;
        batch.millingDate = block.timestamp;
        batch.state = State.PROCESSED_PACKAGED;
        if (bytes(_newIpfsHash).length > 0) {
            batch.ipfsHash = _newIpfsHash; // Cập nhật ảnh bao bì nếu có
        }
        
        emit RiceProcessed(_id, msg.sender);
    }

    function deleteBatch(uint256 _id) public {
        RiceBatch storage batch = batches[_id];
        require(batch.id != 0, "Batch does not exist");
        require(msg.sender == admin || msg.sender == batch.farmer, "Unauthorized");
        
        batch.state = State.DELETED;
        emit BatchDeleted(_id, msg.sender);
    }

    // Hàm sửa thông tin lô lúa (Admin/Farmer/Miller đều có thể sửa ảnh, nhưng chỉ Admin/Farmer sửa thông tin gốc)
    function updateBatch(uint256 _id, string memory _variety, string memory _origin, bool _isOrganic, string memory _ipfsHash) public {
        RiceBatch storage batch = batches[_id];
        require(batch.id != 0, "Batch does not exist");
        require(msg.sender == admin || msg.sender == batch.farmer || farmers[msg.sender], "Unauthorized");

        batch.variety = _variety;
        batch.origin = _origin;
        batch.isOrganic = _isOrganic;
        
        // Chỉ cập nhật ảnh nếu có chuỗi mới (để tiết kiệm gas nếu ko đổi ảnh)
        if (bytes(_ipfsHash).length > 0) {
            batch.ipfsHash = _ipfsHash;
            emit BatchImageUpdated(_id, _ipfsHash);
        }
    }
    
    function getBatch(uint256 _id) public view returns (RiceBatch memory) {
        return batches[_id];
    }
}
