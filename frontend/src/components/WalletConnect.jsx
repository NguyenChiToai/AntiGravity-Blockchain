import { useState } from 'react';
import { ethers } from 'ethers';

const HARDHAT_NETWORK_ID = '0x7a69'; // 31337
const HARDHAT_RPC_URL = 'http://127.0.0.1:8545';

function WalletConnect({ account, setAccount }) {
    const [isConnecting, setIsConnecting] = useState(false);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Vui lòng cài đặt MetaMask extension!");
            return;
        }

        setIsConnecting(true);
        try {
            // 1. Yêu cầu quyền truy cập (Buộc hiển thị popup chọn ví)
            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }]
            });

            // 2. Lấy danh sách tài khoản sau khi user đã chọn
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            localStorage.setItem('isWalletConnected', 'true'); // Lưu trạng thái đã kết nối

            // 2. Kiểm tra và chuyển mạng sang Localhost
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== HARDHAT_NETWORK_ID) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: HARDHAT_NETWORK_ID }],
                    });
                } catch (switchError) {
                    // Nếu mạng chưa được thêm, hãy thêm nó
                    if (switchError.code === 4902) {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: HARDHAT_NETWORK_ID,
                                    chainName: 'Hardhat Local',
                                    rpcUrls: [HARDHAT_RPC_URL],
                                    nativeCurrency: {
                                        name: 'ETH',
                                        symbol: 'ETH',
                                        decimals: 18,
                                    },
                                },
                            ],
                        });
                    } else {
                        console.error("Lỗi chuyển mạng:", switchError);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        localStorage.removeItem('isWalletConnected'); // Xóa trạng thái kết nối
    };

    return (
        <div>
            {account ? (
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-sm">
                        <div className="relative">
                            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
                        </div>
                        <span className="font-mono text-sm font-bold text-white tracking-wide">
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </span>
                    </div>
                    <button
                        onClick={disconnectWallet}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition"
                        title="Ngắt kết nối ví"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                    </button>
                </div>
            ) : (
                <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="group relative bg-white text-green-700 px-6 py-2 rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 overflow-hidden"
                >
                    {isConnecting ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Đang kết nối...</span>
                        </>
                    ) : (
                        <>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            <span>Kết nối MetaMask</span>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

export default WalletConnect;
