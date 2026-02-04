const hre = require("hardhat");

async function main() {
    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const riceTracking = await RiceTracking.deploy();

    await riceTracking.waitForDeployment();

    console.log("RiceTracking deployed to:", await riceTracking.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
