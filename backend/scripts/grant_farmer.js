const hre = require("hardhat");

async function main() {
    const FARMER_ADDRESS = "0x984644b2982b65FF92FEe635FDa87b4A5Ce58029";
    const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Address from last deployment

    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const contract = RiceTracking.attach(CONTRACT_ADDRESS);

    const [admin] = await hre.ethers.getSigners();

    console.log(`Granting Farmer role to ${FARMER_ADDRESS} using Admin ${admin.address}...`);

    try {
        const tx = await contract.connect(admin).addFarmer(FARMER_ADDRESS);
        await tx.wait();
        console.log(`✅ Successfully granted Farmer role to ${FARMER_ADDRESS}`);
    } catch (error) {
        console.error("❌ Failed to grant role:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
