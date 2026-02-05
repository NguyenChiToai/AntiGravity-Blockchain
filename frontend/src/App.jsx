
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import RiceTrackingArtifact from './RiceTracking.json';
import WalletConnect from './components/WalletConnect';
import FarmerDashboard from './components/FarmerDashboard';
import ConsumerView from './components/ConsumerView';
import AdminDashboard from './components/AdminDashboard';
import ProductManagement from './components/ProductManagement';
import ProductDetail from './components/ProductDetail';
// Login component removed
import logo from './assets/logo.svg';

const CONTRACT_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

// --- Trang Chủ Component ---
const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
    <img src={logo} alt="Logo" className="w-64 h-64 mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
    <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 mb-4 uppercase tracking-tighter">
      Truy Xuất Nguồn Gốc Gạo
    </h1>
    <div className="h-1 w-32 bg-orange-500 mb-6 rounded-full"></div>
    <p className="text-xl md:text-2xl text-green-600 font-medium tracking-widest uppercase">
      🌿 Năng Suất Xanh - Nông Nghiệp Sạch 🌿
    </p>
  </div>
);

function AppContent() {
  // const [isAuthenticated, setIsAuthenticated] = useState(false); // REMOVED
  // const [currentUser, setCurrentUser] = useState(null); // REMOVED

  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  // const [role, setRole] = useState('consumer'); // UI Role - REMOVED, use Routing
  const [userRole, setUserRole] = useState('consumer'); // Role thực tế từ Blockchain

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            RiceTrackingArtifact.abi,
            signer
          );
          setContract(contractInstance);

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
            checkRole(contractInstance, account);
          }

          window.ethereum.removeAllListeners('accountsChanged');
          window.ethereum.on('accountsChanged', async (accounts) => {
            const acc = accounts[0] || null;
            setAccount(acc);
            if (acc) {
              const newProvider = new ethers.BrowserProvider(window.ethereum);
              const newSigner = await newProvider.getSigner();
              const newContract = new ethers.Contract(CONTRACT_ADDRESS, RiceTrackingArtifact.abi, newSigner);
              setContract(newContract);
              checkRole(newContract, acc);
            } else {
              setContract(null);
              setUserRole('consumer');
            }
          });
        } catch (error) {
          console.error("Lỗi khởi tạo:", error);
        }
      }
    };
    init();
  }, [account]);

  const checkRole = async (contractInstance, address) => {
    if (!contractInstance || !address) return;
    try {
      const adminAddress = await contractInstance.admin();
      if (address.toLowerCase() === adminAddress.toLowerCase()) {
        setUserRole('admin');
        return;
      }
      const isFarmer = await contractInstance.farmers(address);
      if (isFarmer) {
        setUserRole('farmer');
        return;
      }
      const isMiller = await contractInstance.millers(address);
      if (isMiller) {
        setUserRole('miller');
        return;
      }
      setUserRole('consumer');
    } catch (error) {
      console.error("Lỗi kiểm tra quyền:", error);
    }
  };

  // handleLogin/Logout removed


  const location = useLocation();

  // Highlight active link
  const getLinkClass = (path) => {
    const isActive = location.pathname === path;
    return `px-6 py-3 rounded-full font-bold transition-all duration-300 flex items-center gap-2 ${isActive
      ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg scale-105'
      : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-green-600 shadow-sm border border-gray-100'
      }`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 font-sans text-gray-900">

      {/* 1. Header gọn nhẹ (Chỉ chứa WalletConnect) */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo nhỏ góc trái để nhận diện thương hiệu nếu cần, user bảo 'ở trên khỏi cần logo cho rộng' -> Em để text nhỏ thôi */}
          <div className="text-green-800 font-bold text-lg flex items-center gap-2">
            🌾 RiceTracking
          </div>

          <WalletConnect account={account} setAccount={setAccount} />
        </div>
      </header>

      <main className="container mx-auto p-6">

        {/* 2. Menu Điều Hướng (Navigation Bar) */}
        <nav className="flex flex-wrap justify-center gap-4 mb-10">
          <Link to="/" className={getLinkClass("/")}>
            🏠 Trang Chủ
          </Link>
          <Link to="/search" className={getLinkClass("/search")}>
            🔍 Tra Cứu
          </Link>

          {/* Chỉ hiện hoặc disable nếu không có quyền? User muốn hiện hết. */}
          <Link to="/manage" className={getLinkClass("/manage")}>
            📦 Quản Lý Sản Phẩm
            {/* Badge Role check */}
            {(userRole === 'farmer' || userRole === 'admin') && <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
          </Link>

          {userRole === 'admin' && (
            <Link to="/admin" className={getLinkClass("/admin")}>
              🛡️ Admin
              <span className="ml-1 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
            </Link>
          )}
        </nav>

        {/* 3. Nội dung chính */}
        <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8 min-h-[600px] border border-white relative overflow-hidden">
          {/* Trang trí nền */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-yellow-200 rounded-full opacity-20 blur-3xl"></div>

          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<ConsumerView contract={contract} />} />

              <Route path="/manage" element={<ProductManagement contract={contract} account={account} userRole={userRole} />} />

              <Route path="/admin" element={
                (userRole === 'admin')
                  ? <AdminDashboard contract={contract} account={account} />
                  : <div className="text-center py-20 animate-fade-in">
                    <h2 className="text-2xl font-bold text-purple-800 flex flex-col items-center gap-4 mb-4">
                      <span>🛡️</span>
                      <span>Khu Vực Quản Trị Viên</span>
                    </h2>
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl inline-block">
                      ⛔ <strong>Truy cập bị từ chối:</strong> Ví của bạn không phải là Admin.
                    </div>
                  </div>
              } />

              <Route path="/product/:id" element={<ProductDetail contract={contract} />} />
            </Routes>
          </div>
        </div>

      </main>

      <footer className="text-center py-8 text-gray-500 text-sm font-medium">
        &copy; 2025 BlockChain Rice Tracking System. Power by <span className="text-green-600">NguyenChiToai</span>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
