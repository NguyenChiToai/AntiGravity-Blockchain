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
    mapping(address => bool) public millers;

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

    // Quản lý Role
    function addFarmer(address _farmer) public onlyAdmin {
        farmers[_farmer] = true;
    }

    function removeFarmer(address _farmer) public onlyAdmin {
        farmers[_farmer] = false;
    }

    function addMiller(address _miller) public onlyAdmin {
        millers[_miller] = true;
    }

    function removeMiller(address _miller) public onlyAdmin {
        millers[_miller] = false;
    }

    function createPaddyBatch(string memory _variety, string memory _origin, bool _isOrganic, string memory _ipfsHash) public onlyFarmer {
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

    function updateBatchImage(uint256 _id, string memory _newIpfsHash) public {
        RiceBatch storage batch = batches[_id];
        require(batch.id != 0, "Batch does not exist");
        require(msg.sender == admin || msg.sender == batch.farmer || msg.sender == batch.miller, "Unauthorized");

        batch.ipfsHash = _newIpfsHash;
        emit BatchImageUpdated(_id, _newIpfsHash);
    }
    
    function getBatch(uint256 _id) public view returns (RiceBatch memory) {
        return batches[_id];
    }
}
