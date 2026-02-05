const hre = require("hardhat");

async function main() {
    const RiceTracking = await hre.ethers.getContractFactory("RiceTracking");
    const riceTracking = await RiceTracking.deploy();

    await riceTracking.waitForDeployment();

    console.log("RiceTracking deployed to:", await riceTracking.getAddress());

    // --- AUTO FUNDING FOR DEMO ---
    const STRANGER_ADDRESS = "0x236EC842887079fa61CE45f29c1E4e970bA7b7b6";
    const [deployer] = await hre.ethers.getSigners();
    console.log(`💸 Auto-funding 100 ETH to ${STRANGER_ADDRESS}...`);

    await deployer.sendTransaction({
        to: STRANGER_ADDRESS,
        value: hre.ethers.parseEther("100")
    });
    console.log("✅ Funding successful! No need to run faucet manually.");

    // --- AUTO UPDATE FRONTEND & SCRIPTS ---
    const fs = require("fs");
    const path = require("path");
    const newAddress = await riceTracking.getAddress();

    function updateFile(filePath, searchRegex, replacement) {
        try {
            const absolutePath = path.resolve(__dirname, filePath);
            let content = fs.readFileSync(absolutePath, "utf8");
            if (searchRegex.test(content)) {
                content = content.replace(searchRegex, replacement);
                fs.writeFileSync(absolutePath, content);
                console.log(`✅ Auto-updated contract address in: ${path.basename(filePath)}`);
            } else {
                console.warn(`⚠️ Could not find contract address pattern in: ${path.basename(filePath)}`);
            }
        } catch (err) {
            console.error(`❌ Error updating ${path.basename(filePath)}:`, err.message);
        }
    }

    // Update App.jsx
    updateFile(
        "../../frontend/src/App.jsx",
        /const CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/,
        `const CONTRACT_ADDRESS = "${newAddress}";`
    );

    // Update verify_admin.js
    updateFile(
        "./verify_admin.js",
        /const CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/,
        `const CONTRACT_ADDRESS = "${newAddress}";`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
