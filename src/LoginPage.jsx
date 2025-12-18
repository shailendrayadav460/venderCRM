import React, { useState } from 'react';
import { Package, Mail, Lock } from 'lucide-react';


const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError(" Please enter both email and password.");
            return;
        }
        setLoading(true);
 
        setTimeout(() => {
            if (email === 'admin@gmail.com' && password === '1234') {
                if (onLoginSuccess) {
                    onLoginSuccess();
                }
            } else {
                setError("⚠️ Invalid email or password. Use: admin@opt2deal.com / password");
            }
            setLoading(false);
        }, 1500);
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-indigo-200">

                {/* Header/Logo Section */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex flex-col items-center">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-3 shadow-md">
                        <Package className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Welcome to Opt2Deal</h1>
                    <p className="text-sm text-indigo-200 mt-1">Sign in to manage your requests and vendors</p>
                </div>

                {/* Login Form Section */}
                <div className="p-6 md:p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Login to Dashboard</h2>
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">

                        {/* Email Input */}
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500 w-5 h-5" />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-150"
                            />
                        </div>
                        
                        {/* Password Input */}
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-500 w-5 h-5" />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition duration-150"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-600 transform hover:scale-[1.01]'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Logging in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default LoginPage;