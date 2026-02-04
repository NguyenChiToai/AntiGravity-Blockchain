const hre = require("hardhat");

async function main() {
    // Lấy địa chỉ ví từ biến môi trường (nếu có), hoặc dùng địa chỉ mặc định
    const RECEIVER = process.env.RECEIVER || "0x984644b2982b65FF92FEe635FDa87b4A5Ce58029";
    const AMOUNT = "100"; // 100 ETH

    const [sender] = await hre.ethers.getSigners();

    console.log(`Sending ${AMOUNT} ETH from ${sender.address} to ${RECEIVER}...`);

    const tx = await sender.sendTransaction({
        to: RECEIVER,
        value: hre.ethers.parseEther(AMOUNT)
    });

    await tx.wait();

    console.log(`✅ Transaction successful! Hash: ${tx.hash}`);

    const balance = await hre.ethers.provider.getBalance(RECEIVER);
    console.log(`💰 New balance of ${RECEIVER}: ${hre.ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
