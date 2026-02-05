const hre = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const contract = RiceTracking.attach(CONTRACT_ADDRESS);

    const [admin, user1] = await hre.ethers.getSigners();

    console.log("Checking Admin status...");
    const adminAddress = await contract.admin();
    console.log("Contract Admin:", adminAddress);
    console.log("Your Account #0:", admin.address);

    if (adminAddress.toLowerCase() === admin.address.toLowerCase()) {
        console.log("✅ Admin matches Account #0");
    } else {
        console.error("❌ Admin MISMATCH!");
    }

    console.log("\nTrying to add Farmer using Account #0...");
    try {
        const tx = await contract.connect(admin).addFarmer(user1.address);
        await tx.wait();
        console.log("✅ addFarmer success!");
    } catch (error) {
        console.error("❌ addFarmer failed:", error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
