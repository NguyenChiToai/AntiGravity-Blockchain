import { useState } from 'react';
import logo from '../assets/logo.svg';

function Login({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isRegistering) {
            // Logic Đăng ký
            if (!username || !password || !confirmPassword) {
                setError('Vui lòng điền đầy đủ thông tin.');
                return;
            }
            if (password !== confirmPassword) {
                setError('Mật khẩu xác nhận không khớp.');
                return;
            }

            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            if (existingUsers.find(u => u.username === username)) {
                setError('Tên đăng nhập đã tồn tại.');
                return;
            }

            const newUser = { username, password };
            localStorage.setItem('users', JSON.stringify([...existingUsers, newUser]));
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            setIsRegistering(false);
            setPassword('');
            setConfirmPassword('');
        } else {
            // Logic Đăng nhập (Demo Hardcoded)
            if (username === 'admin' && password === '12345') {
                onLogin({ username: 'admin', role: 'admin' });
                return;
            }
            if (username === 'nongdan' && password === '12345') {
                onLogin({ username: 'nongdan', role: 'farmer' });
                return;
            }
            if (username === 'nhamay' && password === '12345') {
                onLogin({ username: 'nhamay', role: 'miller' });
                return;
            }

            const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
            const user = existingUsers.find(u => u.username === username && u.password === password);

            if (user) {
                onLogin({ username: user.username, role: 'consumer', requestStatus: user.requestStatus });
            } else {
                setError('Tên đăng nhập hoặc mật khẩu không đúng.');
            }
        }
    };

    const handleRequestAccess = () => {
        const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = existingUsers.findIndex(u => u.username === username);

        if (userIndex !== -1) {
            existingUsers[userIndex].requestStatus = 'pending';
            localStorage.setItem('users', JSON.stringify(existingUsers));
            alert("Đã gửi yêu cầu lên Admin! Vui lòng chờ phê duyệt.");
        } else {
            // Create temp user if not exists (for Quick Login scenario without register)
            // But usually they register. Let's assume they registered relative to localStorage logic.
            // If Quick Login 'consumer', we might need to add them.
            alert("Vui lòng Đăng Ký tài khoản trước khi gửi yêu cầu.");
        }
    };

    const handleQuickLogin = (role) => {
        if (role === 'admin') {
            setUsername('admin');
            setPassword('12345');
        } else if (role === 'farmer') {
            setUsername('nongdan');
            setPassword('12345');
        } else if (role === 'miller') {
            setUsername('nhamay');
            setPassword('12345');
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-green-600 p-8 text-center">
                    <img src={logo} alt="Logo" className="h-20 w-20 bg-white rounded-full p-1 mx-auto mb-4 shadow-lg" />
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                        Truy Xuất Nguồn Gốc Gạo
                    </h2>
                    <p className="text-green-100 text-sm mt-2">NĂNG SUẤT XANH - NÔNG NGHIỆP SẠCH</p>
                </div>

                <div className="p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                        {isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập Hệ Thống'}
                    </h3>

                    {!isRegistering && (
                        <div className="flex justify-center gap-2 mb-6">
                            <button onClick={() => handleQuickLogin('admin')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 font-bold border border-purple-300">
                                🛡️ Admin
                            </button>
                            <button onClick={() => handleQuickLogin('farmer')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-bold border border-green-300">
                                🌾 Nông Dân
                            </button>
                            <button onClick={() => handleQuickLogin('miller')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-bold border border-blue-300">
                                🏭 Nhà Máy
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Nhập tên đăng nhập"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Nhập mật khẩu"
                            />
                        </div>

                        {isRegistering && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="Nhập lại mật khẩu"
                                />
                            </div>
                        )}

                        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-lg"
                        >
                            {isRegistering ? 'Đăng Ký' : 'Đăng Nhập'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering);
                                setError('');
                                setUsername('');
                                setPassword('');
                                setConfirmPassword('');
                            }}
                            className="text-green-600 hover:text-green-800 font-medium text-sm"
                        >
                            {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký mới'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
