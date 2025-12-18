import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Package, Users, Filter, Upload, RefreshCw, Phone, Mail } from 'lucide-react';

import API_CONFIG, { getFieldValue } from '../../utils/config.jsx';
import { VendorCRMDetailsModal } from '../shared/VendorCRMDetailsModal.jsx';

// =========================================================================
// --- 💡 मॉड्यूल-लेवल डेटा कैश (Data Cache at Module Level) 💡 ---
// यह डेटा कंपोनेंट के अनमाउंट होने पर भी मेमोरी में बना रहेगा।
let vendorsCache = [];
let isDataInitiallyLoaded = false;
// =========================================================================


// --- Component: All Products (Database View) with Infinite Scroll & Sticky Header ---
const AllProductsView = ({ setTotalProductsCount, isVisible }) => {
    
    if (!isVisible) {
        return null;
    }
    
    // --- State Management ---
    const [allVendorsState, setAllVendorsState] = useState(vendorsCache); 
    const [currentChunk, setCurrentChunk] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All'); 

    // Tracks which cell is expanded (format: "row-index-field")
    const [expandedCell, setExpandedCell] = useState(null); 

    // --- Refs ---
    const tableContainerRef = useRef(null); 
    const filteredVendorsRef = useRef([]); 

    // --- Configuration ---
    const ITEMS_PER_PAGE = API_CONFIG.ITEMS_PER_PAGE || 10;
    const GET_ALL_API = API_CONFIG.API_ENDPOINTS.ALL_PRODUCTS;
    const UPLOAD_API = API_CONFIG.API_ENDPOINTS.UPLOAD_CSV;

    // --- Core Infinite Scroll & Filter Logic ---

    const filterAndChunkData = useCallback((term, status) => {
        const filtered = vendorsCache.filter(vendor => { 
            const description = (getFieldValue(vendor, 'Item_Description', 'itemDescription', 'item_description') || '').toLowerCase();
            const buyer = (getFieldValue(vendor, 'Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1') || '').toLowerCase();
            const id = (vendor.Id || '').toString();
            const vendorStatus = (getFieldValue(vendor, 'Status', 'status') || 'Active').toLowerCase();

            const matchesSearch = description.includes(term.toLowerCase()) ||
                                   buyer.includes(term.toLowerCase()) ||
                                   id.includes(term.toLowerCase());

            const matchesStatus = status === 'All' || vendorStatus === status.toLowerCase();

            return matchesSearch && matchesStatus;
        });
        
        filteredVendorsRef.current = filtered;
        setCurrentPage(1);
        setCurrentChunk(filtered.slice(0, ITEMS_PER_PAGE));
        setHasMore(filtered.length > ITEMS_PER_PAGE);
        setError(filtered.length === 0 && (term.trim() !== '' || status !== 'All') ? `No results found matching the current filters.` : '');
    }, [ITEMS_PER_PAGE]);


    const fetchData = useCallback(async (search = '', isRefresh = false) => {
        if (isDataInitiallyLoaded && !isRefresh) return;
        
        setLoading(true);
        setError('');
        setCurrentPage(1);
        
        try {
            const response = await fetch(GET_ALL_API, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
            });

            if (!response.ok) { throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`); }

            const data = await response.json();
            let vendorData = data?.matches || data?.vendors || data?.data || data?.products || data?.results || data;
            if (!Array.isArray(vendorData)) vendorData = [];

            // --- Cache Update Logic ---
            vendorsCache = vendorData; 
            setAllVendorsState(vendorsCache); 
            isDataInitiallyLoaded = true; 
            setTotalProductsCount(vendorsCache.length);

            const initialFiltered = vendorsCache.filter(vendor => {
                const searchMatch = (getFieldValue(vendor, 'Item_Description', 'itemDescription', 'item_description') || '').toLowerCase().includes(search.toLowerCase());
                const statusMatch = statusFilter === 'All' || (getFieldValue(vendor, 'Status', 'status') || 'Active').toLowerCase() === statusFilter.toLowerCase();
                return searchMatch && statusMatch;
            });

            filteredVendorsRef.current = initialFiltered;
            setCurrentChunk(initialFiltered.slice(0, ITEMS_PER_PAGE));
            setHasMore(initialFiltered.length > ITEMS_PER_PAGE);

            if (vendorsCache.length === 0) { setError('No data found in API response. Please upload a CSV file.'); }
            else if (initialFiltered.length === 0 && (search.trim() !== '' || statusFilter !== 'All')) { setError(`No results found matching the current filters.`); }
            else { setError(''); }
        } catch (err) {
            setError('❌ Error fetching data: ' + err.message + '. Make sure the Database API URL is correct.');
            setAllVendorsState([]); setCurrentChunk([]); setHasMore(false);
        } finally { setLoading(false); }
    }, [GET_ALL_API, ITEMS_PER_PAGE, setTotalProductsCount, statusFilter]);


    const loadMoreData = useCallback(() => {
        if (loading || !hasMore) return;
        
        const nextStartIndex = currentPage * ITEMS_PER_PAGE;
        const filteredVendors = filteredVendorsRef.current;

        if (nextStartIndex < filteredVendors.length) {
            const nextChunk = filteredVendors.slice(nextStartIndex, nextStartIndex + ITEMS_PER_PAGE);
            setCurrentChunk(prev => [...prev, ...nextChunk]);
            setCurrentPage(prev => prev + 1);
            setHasMore(nextStartIndex + ITEMS_PER_PAGE < filteredVendors.length);
        } else {
            setHasMore(false);
        }
    }, [hasMore, loading, currentPage, ITEMS_PER_PAGE]);


    // --- Handlers ---
    
    const toggleCellExpand = useCallback((key) => {
        setExpandedCell(prev => (prev === key ? null : key));
    }, []);

    const handleCSVUpload = async (event) => {
        const file = event.target.files[0]; if (!file) return; setLoading(true); setError('');
        try {
            const formData = new FormData(); formData.append('file', file);
            const response = await fetch(UPLOAD_API, { method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' }, body: formData });
            if (!response.ok) {
                const errorText = await response.text();
                let errorData = {};
                try { errorData = JSON.parse(errorText); } catch { errorData = { message: errorText }; }
                throw new Error(errorData?.message || `Upload failed: ${response.status} ${response.statusText}`);
            }
            alert('✅ CSV uploaded successfully! Refreshing data...');
            isDataInitiallyLoaded = false; 
            setTimeout(() => fetchData(searchTerm, true), 1000);
        } catch (err) {
            setError('❌ Error uploading CSV: ' + err.message);
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };

    const openDetailsModal = (vendor) => { setSelectedVendor(vendor); setShowDetailsModal(true); };
    const closeDetailsModal = () => { setShowDetailsModal(false); setSelectedVendor(null); };


    // --- Effects ---

    useEffect(() => {
        if (isVisible && !isDataInitiallyLoaded) {
            fetchData(searchTerm);
        } 
        else if (isVisible && isDataInitiallyLoaded && currentChunk.length === 0) {
            filterAndChunkData(searchTerm, statusFilter);
        }
    }, [isVisible, fetchData, searchTerm, currentChunk.length, filterAndChunkData, statusFilter]);
    
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (isVisible && vendorsCache.length > 0) {
                filterAndChunkData(searchTerm, statusFilter);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, statusFilter, filterAndChunkData, isVisible]);

    // --- FIX: Updated Scroll Listener Logic ---
    useEffect(() => {
        const scrollContainer = tableContainerRef.current;
        if (!scrollContainer || !isVisible) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            // Buffer of 50px to trigger before reaching absolute bottom
            if (scrollHeight - scrollTop <= clientHeight + 50) {
                loadMoreData();
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [loadMoreData, isVisible, currentChunk]); // Added currentChunk dependency for height changes


    // --- Render ---

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header / Search / Upload Area Area */}
            <div className="bg-white border-b border-gray-200 shadow-sm p-3 sm:p-4 md:p-6 flex-shrink-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search in Database (Client-side)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm font-bold"/>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => fetchData(searchTerm, true)} disabled={loading} className={`px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all font-bold ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                            <RefreshCw className={`w-4 h-4 ${loading && searchTerm.trim() === '' ? 'animate-spin' : ''}`} /><span>Refresh DB</span>
                        </button>
                        <label className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all font-bold">
                            <Upload className="w-4 h-4" /><span>Upload CSV</span><input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 sm:p-4 md:p-6 pb-0 flex-shrink-0">
                <div className="bg-white rounded-xl p-3 sm:p-4 border-l-4 border-indigo-500 shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-[10px] sm:text-xs mb-1 font-bold">Total Products (DB)</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{vendorsCache.length}</p>
                    </div>
                    <div className="bg-indigo-100 p-2 rounded-full"><Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" /></div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border-l-4 border-green-500 shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-[10px] sm:text-xs mb-1 font-bold">Filtered Results</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{filteredVendorsRef.current.length}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full"><Filter className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /></div>
                </div>
                <div className="bg-white rounded-xl p-3 sm:p-4 border-l-4 border-purple-500 shadow-md sm:col-span-2 lg:col-span-1 flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-[10px] sm:text-xs mb-1 font-bold">Displayed Items</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">{currentChunk.length}</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-full"><Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" /></div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-3 sm:p-4 md:p-6 pt-3 overflow-hidden">
                {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs sm:text-sm shadow-md"><p className="font-semibold">Error:</p><p>{error}</p></div>)}
                
                {loading && currentChunk.length === 0 && (<div className="text-center py-6 bg-white rounded-xl shadow-md"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600"></div><p className="mt-2 text-gray-600 text-xs sm:text-sm font-medium">Loading Database vendor data...</p></div>)}
                {!loading && currentChunk.length === 0 && !error && searchTerm.trim() === '' && statusFilter === 'All' && (<div className="text-center py-16 bg-white rounded-xl shadow-md"><Package className="w-20 h-20 text-indigo-200 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-400 mb-2">No Database Data</h3><p className="text-gray-500">Upload a CSV file or check API connection.</p></div>)}

                {currentChunk.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
                        {/* Table Container with Fixed Scroll Logic */}
                        <div ref={tableContainerRef} className="overflow-y-auto flex-1 relative"> 
                            <div className="overflow-x-auto"> 
                                <table className="w-full table-auto"> 
                                    <thead className="bg-indigo-600 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[25%]">Item Description</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Buyer 1</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[5%]">Qty</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[5%]">UQC</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Unit Price</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[12%]">Buyer 2</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[10%]">Contact</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[10%]">Email</th>
                                            <th className="px-2 py-2 text-left text-xs font-bold text-white uppercase tracking-wider w-[8%]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentChunk.map((vendor, index) => {
                                            const descriptionKey = `${index}-desc`;
                                            const buyer1Key = `${index}-buyer1`;
                                            const buyer2Key = `${index}-buyer2`;
                                            const contactKey = `${index}-contact`;
                                            const emailKey = `${index}-email`;

                                            const isDescExpanded = expandedCell === descriptionKey;
                                            const isBuyer1Expanded = expandedCell === buyer1Key;
                                            const isBuyer2Expanded = expandedCell === buyer2Key;
                                            const isContactExpanded = expandedCell === contactKey;
                                            const isEmailExpanded = expandedCell === emailKey;

                                            const description = getFieldValue(vendor, 'Item_Description', 'itemDescription', 'item_description');
                                            const contactDetail = getFieldValue(vendor, 'Potential_Buyer_1_Contact_Detail', 'potentialBuyer1ContactDetail');
                                            const emailDetail = getFieldValue(vendor, 'Potential_Buyer_1_Email', 'potentialBuyer1Email');
                                            const buyer1 = getFieldValue(vendor, 'Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1');
                                            const buyer2 = getFieldValue(vendor, 'Potential_Buyer_2', 'potentialBuyer2', 'potential_buyer_2');

                                            return (
                                            <tr key={index} className="hover:bg-indigo-50 transition-colors">
                                                <td className="px-2 py-2 text-[11px] text-gray-900 max-w-[200px] cursor-pointer" onClick={() => toggleCellExpand(descriptionKey)}>
                                                    <span className={isDescExpanded ? 'whitespace-normal' : 'truncate block'}>{description}</span>
                                                </td>
                                                <td className={`px-2 py-2 text-[11px] text-gray-700 max-w-[150px] cursor-pointer ${isBuyer1Expanded ? 'whitespace-normal' : 'truncate'}`} onClick={() => toggleCellExpand(buyer1Key)}>
                                                    {buyer1}
                                                </td>
                                                <td className="px-2 py-2 text-[11px] text-gray-700">{getFieldValue(vendor, 'Quantity')}</td>
                                                <td className="px-2 py-2 text-[11px] text-gray-700">{getFieldValue(vendor, 'UQC')}</td>
                                                <td className="px-2 py-2 text-[11px] text-indigo-600 font-bold">{getFieldValue(vendor, 'Unit_Price')}</td>
                                                <td className={`px-2 py-2 text-[11px] text-gray-700 max-w-[150px] cursor-pointer ${isBuyer2Expanded ? 'whitespace-normal' : 'truncate'}`} onClick={() => toggleCellExpand(buyer2Key)}>
                                                    {buyer2}
                                                </td>
                                                <td className="px-2 py-2 text-[10px] cursor-pointer" onClick={() => toggleCellExpand(contactKey)}>
                                                    <div className={`flex items-center gap-1 text-green-600 ${isContactExpanded ? '' : 'truncate max-w-[100px]'}`}>
                                                        <Phone className="w-3 h-3 flex-shrink-0" /><span className="text-xs">{contactDetail}</span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-[10px] cursor-pointer" onClick={() => toggleCellExpand(emailKey)}>
                                                    <div className={`flex items-center gap-1 text-gray-600 ${isEmailExpanded ? '' : 'truncate max-w-[100px]'}`}>
                                                        <Mail className="w-3 h-3 flex-shrink-0" /><span className="text-xs">{emailDetail}</span>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-2 text-[11px]"><button onClick={() => openDetailsModal(vendor)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-700 transition-colors font-bold">Details</button></td>
                                            </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {/* Loading Indicator */}
                            {hasMore && (
                                <div className="text-center py-4 bg-white">
                                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-indigo-600"></div>
                                    <p className="mt-1 text-gray-600 text-xs font-medium">Loading more products...</p>
                                </div>
                            )}
                            {!hasMore && currentChunk.length > 0 && (
                                <div className="text-center py-4 text-gray-500 text-sm border-t border-gray-200 bg-white">--- End of List ({currentChunk.length} total) ---</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <VendorCRMDetailsModal selectedVendor={selectedVendor} onClose={closeDetailsModal} />
        </div>
    );
};

export default AllProductsView;