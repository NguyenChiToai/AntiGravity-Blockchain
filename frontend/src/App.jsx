import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import RiceTrackingArtifact from './RiceTracking.json';
import WalletConnect from './components/WalletConnect';
import FarmerDashboard from './components/FarmerDashboard';
import MillerDashboard from './components/MillerDashboard';
import ConsumerView from './components/ConsumerView';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import logo from './assets/logo.svg';

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [role, setRole] = useState('consumer'); // consumer, farmer, miller, admin
  const [userRole, setUserRole] = useState('consumer'); // Role thực tế từ Blockchain

  useEffect(() => {
    // Luôn logout khi reload trang
  }, []);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum && isAuthenticated) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            RiceTrackingArtifact.abi,
            signer
          );
          setContract(contractInstance);

          // Chỉ lấy account nếu chưa có (lần đầu load)
          if (!account) {
            const isConnected = localStorage.getItem('isWalletConnected') === 'true';
            if (isConnected) {
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts.length > 0) {
                setAccount(accounts[0]);
                checkRole(contractInstance, accounts[0]);
              }
            }
          } else {
            // Nếu đã có account (do đổi ví), check role lại
            checkRole(contractInstance, account);
          }

          // Cleanup listener cũ để tránh duplicate
          window.ethereum.removeAllListeners('accountsChanged');

          window.ethereum.on('accountsChanged', async (accounts) => {
            const acc = accounts[0] || null;
            setAccount(acc);

            // Khi đổi account, cần update lại signer cho contract
            if (acc) {
              const newProvider = new ethers.BrowserProvider(window.ethereum);
              const newSigner = await newProvider.getSigner();
              const newContract = new ethers.Contract(
                CONTRACT_ADDRESS,
                RiceTrackingArtifact.abi,
                newSigner
              );
              setContract(newContract);
              checkRole(newContract, acc);
            } else {
              setContract(null);
              setUserRole('consumer');
              setRole('consumer');
            }
          });
        } catch (error) {
          console.error("Lỗi khởi tạo:", error);
        }
      }
    };
    init();
  }, [isAuthenticated, account]); // Thêm account vào dependency để re-run khi account đổi? Không, sẽ loop.
  // Cách tốt hơn: Chỉ chạy 1 lần, và handle event.
  // Nhưng ở trên tôi đã viết logic handle event để update contract. 
  // Vấn đề là init() phụ thuộc isAuthenticated.

  // Logic sửa đổi:
  // useEffect chạy khi isAuthenticated thay đổi.
  // Bên trong init, ta setup listener.
  // Listener sẽ update account VÀ contract.

  const checkRole = async (contractInstance, address) => {
    if (!contractInstance || !address) return;
    try {
      const adminAddress = await contractInstance.admin();
      if (address.toLowerCase() === adminAddress.toLowerCase()) {
        setUserRole('admin');
        // Nếu login web là admin thì auto set role admin
        if (currentUser?.role === 'admin') setRole('admin');
        return;
      }

      const isFarmer = await contractInstance.farmers(address);
      if (isFarmer) {
        setUserRole('farmer');
        if (currentUser?.role !== 'admin') setRole('farmer');
        return;
      }

      const isMiller = await contractInstance.millers(address);
      if (isMiller) {
        setUserRole('miller');
        if (currentUser?.role !== 'admin') setRole('miller');
        return;
      }

      setUserRole('consumer');
      setRole('consumer');
    } catch (error) {
      console.error("Lỗi kiểm tra quyền:", error);
    }
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    if (user.role === 'admin') {
      setRole('admin');
    } else {
      setRole('consumer');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setAccount(null);
    setContract(null);
    setRole('consumer');
    setUserRole('consumer');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <header className="bg-green-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="h-24 w-24 bg-white rounded-full p-1 shadow-lg" />
            <div>
              <h1 className="text-3xl font-bold uppercase tracking-wide">
                Truy Xuất Nguồn Gốc Gạo
              </h1>
              <p className="text-green-100 text-sm font-medium tracking-wider">NĂNG SUẤT XANH - NÔNG NGHIỆP SẠCH</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="font-bold text-sm">Xin chào, {currentUser?.username}</p>
              <button
                onClick={handleLogout}
                className="text-xs text-green-100 hover:text-white underline"
              >
                Đăng xuất
              </button>
            </div>
            <WalletConnect account={account} setAccount={setAccount} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="mb-6 flex justify-center gap-4">
          <button
            onClick={() => setRole('consumer')}
            className={`px-4 py-2 rounded-full font-medium transition ${role === 'consumer' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            Người Tiêu Dùng
          </button>

          {/* Chỉ hiển thị nút Dashboard nếu user có quyền tương ứng */}
          {(userRole === 'farmer' || userRole === 'admin') && (
            <button
              onClick={() => setRole('farmer')}
              className={`px-4 py-2 rounded-full font-medium transition ${role === 'farmer' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Nông Dân
            </button>
          )}

          {(userRole === 'miller' || userRole === 'admin') && (
            <button
              onClick={() => setRole('miller')}
              className={`px-4 py-2 rounded-full font-medium transition ${role === 'miller' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Nhà Máy
            </button>
          )}

          {/* Chỉ hiển thị nút Admin nếu đăng nhập web là admin */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setRole('admin')}
              className={`px-4 py-2 rounded-full font-medium transition ${role === 'admin' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
            >
              Admin
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 min-h-[500px]">
          {role === 'consumer' && <ConsumerView contract={contract} />}
          {role === 'farmer' && <FarmerDashboard contract={contract} account={account} userRole={userRole} />}
          {role === 'miller' && <MillerDashboard contract={contract} account={account} />}
          {role === 'admin' && <AdminDashboard contract={contract} account={account} />}
        </div>
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 text-center mt-12">
        <p>&copy; 2025 Hệ thống Truy xuất Nguồn gốc Gạo trên Blockchain.</p>
      </footer>
    </div>
  );
}

export default App;
