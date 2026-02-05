const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788"; // Địa chỉ hiện tại
    const TARGET_FARMER = "0x984644b2982b65FF92FEe635FDa87b4A5Ce58029";

    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const contract = RiceTracking.attach(CONTRACT_ADDRESS);

    console.log(`Đang cấp quyền Nông dân cho ví: ${TARGET_FARMER}...`);

    const tx = await contract.addFarmer(TARGET_FARMER);
    await tx.wait();

    console.log("✅ Đã thêm Nông dân thành công!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
