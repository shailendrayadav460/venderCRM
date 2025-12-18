import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Package, TrendingUp, X, Users, Filter, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import API_CONFIG, { safeValue } from './utils/config.jsx';
import { AllProductsView, SearchProductsView } from './components/VendorCRMView.jsx';
import MatchingSheet from './components/MatchingSheet.jsx';
import LoginPage from './LoginPage.jsx';

// 1. AppContent Component (The main application UI)

const AppContent = ({ onLogout }) => {
    const [currentView, setCurrentView] = useState('matching'); 
    const [matchingData, setMatchingData] = useState([]);
    const [loadingMatching, setLoadingMatching] = useState(true);
    const [matchingError, setMatchingError] = useState('');
    const [searchTermMatching, setSearchTermMatching] = useState('');
    const [totalMatchingRequests, setTotalMatchingRequests] = useState(0);
    const [currentCrmSubView, setCurrentCrmSubView] = useState('all-products');
    const [isCrmSubViewSelected, setIsCrmSubViewSelected] = useState(false);
    const [dbCount, setDbCount] = useState(0);
    const [apiSearchCount, setApiSearchCount] = useState(0);
    const handleSetDbCount = useCallback((count) => setDbCount(count), []);
    const handleSetApiSearchCount = useCallback((count) => setApiSearchCount(count), []);
    const [isCrmMenuOpen, setIsCrmMenuOpen] = useState(false);
    const closeMenuTimeoutRef = React.useRef(null);

    // Matching Sheet Data Fetching (Placeholder) 
    const fetchMatchingData = useCallback(async () => {
        setLoadingMatching(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setTotalMatchingRequests(42);
            setMatchingError('');
        } catch (err) {
            setMatchingError('Failed to load matching data.');
        } finally {
            setLoadingMatching(false);
        }
    }, []);

    useEffect(() => {
        fetchMatchingData();
        const interval = setInterval(fetchMatchingData, 30000);
        return () => {
            clearInterval(interval);
            if (closeMenuTimeoutRef.current) {
                clearTimeout(closeMenuTimeoutRef.current);
            }
        };
    }, [fetchMatchingData]);

    // Hover/Delay Logic
    const handleMouseEnter = () => {
        if (closeMenuTimeoutRef.current) {
            clearTimeout(closeMenuTimeoutRef.current);
        }
        setIsCrmMenuOpen(true);
    };
    const handleMouseLeave = () => {
        closeMenuTimeoutRef.current = setTimeout(() => {
            setIsCrmMenuOpen(false);
        }, 300);
    };
    const initialLoad = totalMatchingRequests === 0 && loadingMatching;
    const matchingPrimaryContent = (
        <MatchingSheet
            matchingData={matchingData}
            searchTerm={searchTermMatching}
            setSearchTerm={setSearchTermMatching}
            initialLoad={initialLoad}
            fetchMatchingData={fetchMatchingData}
        />
    );
    const crmPrimaryContent = (
        <>
            {/* 1. All Products View (Database) */}
            {currentCrmSubView === 'all-products' && (
                <AllProductsView setTotalProductsCount={handleSetDbCount} isVisible={true} />
            )}

            {/* 2. Search Products View (API) */}
            {currentCrmSubView === 'search-api' && (
                <SearchProductsView setTotalProductsCount={handleSetApiSearchCount} isVisible={true} />
            )}
        </>
    );

    // Function to handle switching sub-view
    const handleCrmSubViewClick = (subView) => {
        setCurrentView('vendor-crm');
        setCurrentCrmSubView(subView);
        setIsCrmMenuOpen(true);
        setIsCrmSubViewSelected(true);
    };

    // NEW FUNCTION: Vendor CRM Main Button Click Handler
    const handleCrmMainClick = () => {
        setCurrentView('vendor-crm');
        setIsCrmMenuOpen(prev => !prev);
        if (!isCrmSubViewSelected) {
            setIsCrmSubViewSelected(false);
        } else {
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 overflow-hidden">
            <aside className="w-full lg:w-72 bg-white border-b lg:border-r lg:border-b-0 border-indigo-100 flex-shrink-0 shadow-lg">
                {/* Header Logo/Name and Logout Button */}
                <div className="p-4 border-b border-indigo-100 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-indigo-700 flex items-center">
                        <Package className="w-6 h-6 mr-2 text-indigo-500" /> Opt2deal
                    </h1>
                    <button
                        onClick={onLogout}
                        className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-3 space-y-2">
                    {/* 1. Matching Requests Tab (Main VendorMatch View) */}
                    <button
                        onClick={() => { setCurrentView('matching'); setIsCrmMenuOpen(false); setIsCrmSubViewSelected(false); }} // 🎯 Sub-view deselected
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-semibold text-sm ${currentView === 'matching' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                        <div className="flex items-center"><TrendingUp className="w-4 h-4 mr-2" /><span>Matching Requests</span></div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${currentView === 'matching' ? 'bg-white text-indigo-600' : 'bg-indigo-200 text-indigo-800'}`}>{totalMatchingRequests}</span>
                    </button>

                    {/* 2. Vendor CRM Hover Container */}
                    <div
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        className="relative space-y-1"
                    >
                        {/* Vendor CRM Main Button (Click sets currentView to 'vendor-crm') */}
                        <button
                            onClick={handleCrmMainClick} // Using new click handler
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all font-semibold text-sm ${currentView === 'vendor-crm' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <div className="flex items-center"><Users className="w-4 h-4 mr-2" /><span>Vendor CRM</span></div>
                            {isCrmMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {/* 3. CRM Sub-Tabs (Dropdown Content) */}
                        {isCrmMenuOpen && ( // Dropdown opens based only on isCrmMenuOpen
                            <div className="pl-2 pr-2 pt-2 space-y-1 absolute left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-xl transition-opacity duration-150 ease-in-out">

                                {/* All Products (Database) Sub-Tab */}
                                <button
                                    onClick={() => handleCrmSubViewClick('all-products')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs font-semibold ${currentCrmSubView === 'all-products' && currentView === 'vendor-crm' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    <div className="flex items-center"><Package className="w-3 h-3 mr-2" /><span>All Products (Database)</span></div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${currentCrmSubView === 'all-products' && currentView === 'vendor-crm' ? 'bg-white text-purple-600' : 'bg-indigo-300 text-indigo-900'}`}>{dbCount}</span>
                                </button>

                                {/* Search Products (API) Sub-Tab */}
                                <button
                                    onClick={() => handleCrmSubViewClick('search-api')}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all text-xs font-semibold ${currentCrmSubView === 'search-api' && currentView === 'vendor-crm' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    <div className="flex items-center"><Search className="w-3 h-3 mr-2" /><span>Search Products (API)</span></div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${currentCrmSubView === 'search-api' && currentView === 'vendor-crm' ? 'bg-white text-purple-600' : 'bg-indigo-300 text-indigo-900'}`}>{apiSearchCount}</span>
                                </button>
                                <div className="p-1"></div>
                            </div>
                        )}
                    </div>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden">
                {/* MODIFIED LOGIC: Render Matching Content if CRM is selected but no sub-view is active */}
                {currentView === 'matching' || (currentView === 'vendor-crm' && !isCrmSubViewSelected) ? (
                    matchingPrimaryContent
                ) : (
                    crmPrimaryContent
                )}
            </main>
        </div>
    );
};

// 2. Root Application Component (App) - Authentication Wrapper

const App = () => {
    // Authentication State Management: Check local storage for initial state
    const [isLoggedIn, setIsLoggedIn] = useState(
        localStorage.getItem('isLoggedIn') === 'true'
    );

    const handleLoginSuccess = useCallback(() => {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
    }, []);

    const handleLogout = useCallback(() => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
    }, []);

    // Conditional Rendering: Show Login Page or Main App Content
    return isLoggedIn ? (
        <AppContent onLogout={handleLogout} />              
    ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} /> 
    );
};
export default App;