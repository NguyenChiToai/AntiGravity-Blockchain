const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // Current Contract
    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const contract = RiceTracking.attach(CONTRACT_ADDRESS);

    console.log("🔍 Checking Pending Requests on Blockchain...");

    try {
        const requesters = await contract.getRequesters();
        console.log(`📊 Total Requests found: ${requesters.length}`);

        if (requesters.length > 0) {
            requesters.forEach((addr, index) => {
                console.log(`   ${index + 1}. ${addr}`);
            });
        } else {
            console.log("❌ No pending requests found on-chain.");
        }

        // Check specifically for the stranger wallet
        const stranger = "0x236EC842887079fa61CE45f29c1E4e970bA7b7b6";
        const isPending = await contract.pendingFarmers(stranger);
        console.log(`\n🕵️ Specfic Check for Stranger (${stranger}):`);
        console.log(`   - Is Pending in Mapping? ${isPending}`);

    } catch (error) {
        console.error("❌ Error fetching requests:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
