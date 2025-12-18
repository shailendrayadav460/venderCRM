import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Phone, Mail, ChevronDown, Download, Layers, Eye } from 'lucide-react'; 
import API_CONFIG, { getFieldValue } from '../../utils/config.jsx'; 
import { VendorCRMDetailsModal } from '../shared/VendorCRMDetailsModal.jsx'; 

// CONFIGURATION 
const SEARCH_API_URL = `${API_CONFIG.VENDOR_API_BASE_URL}${API_CONFIG.VENDOR_SEARCH_ENDPOINT}`;
const INITIAL_LIMIT = API_CONFIG.ITEMS_PER_PAGE; 
const LOAD_STEP = API_CONFIG.ITEMS_PER_PAGE; 


// Core Component: SearchProductsView
const SearchProductsView = ({ setTotalProductsCount, isVisible }) => {
    
    // --- STATE DECLARATIONS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [rawSearchResults, setRawSearchResults] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedProductTerm, setSelectedProductTerm] = useState(null); 
    
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT); 
    const listRef = useRef(null);
    
    // --- UTILITIES ---

    const getSearchTerms = useMemo(() => {
        if (!searchTerm.trim()) return [];
        return searchTerm.split(/,\s*|\n/).map(term => term.trim()).filter(term => term.length >= 3);
    }, [searchTerm]);

    const groupedResults = useMemo(() => {
        if (!rawSearchResults.length) return new Map();
        
        const groups = new Map();
        rawSearchResults.forEach(item => {
            const term = item.sourceSearchTerm || 'Unknown';
            if (!groups.has(term)) { groups.set(term, []); }
            groups.get(term).push(item);
        });
        return groups;
    }, [rawSearchResults]);

    const currentViewResults = useMemo(() => {
        if (!selectedProductTerm) return []; 
        return groupedResults.get(selectedProductTerm) || [];
    }, [selectedProductTerm, groupedResults]); 

    // --- VIEW HANDLERS ---
    const goToSummaryView = () => { setSelectedProductTerm(null); setDisplayLimit(INITIAL_LIMIT); };
    const openVendorDetailView = (term) => { setSelectedProductTerm(term); setDisplayLimit(INITIAL_LIMIT); };

    // --- SEARCH LOGIC (API Call - Progressive Loading) ---
    const performSearch = useCallback(async () => {
        const terms = getSearchTerms;
        if (terms.length === 0) {
            setError('Please enter at least one product search term (3+ characters) separated by commas.');
            setRawSearchResults([]);
            setTotalProductsCount(0);
            return;
        }

        setLoading(true); setError(''); setRawSearchResults([]); 
        setSelectedProductTerm(null); 
        
        let errorOccurred = false;
        let cumulativeResults = [];
        
        // Asynchronously process each search term sequentially for progressive display
        const searchPromises = terms.map(term => async () => {
            const apiUrl = `${SEARCH_API_URL}?itemDescription=${encodeURIComponent(term)}`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: { 
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true' 
                    }
                });

                if (!response.ok) {
                    throw new Error(`API returned status ${response.status} for term: ${term}`);
                }
                
                const data = await response.json();
                let results = data?.matches || data?.data || data; 
                if (!Array.isArray(results)) results = [];

                const taggedResults = results.map(item => ({ 
                    ...item, 
                    sourceSearchTerm: term 
                }));
                
                // --- PROGRESSIVE UPDATE: Update state with new results instantly ---
                cumulativeResults.push(...taggedResults);
                setRawSearchResults([...cumulativeResults]); 
                
            } catch (err) { 
                console.error(`Error searching for ${term}:`, err);
                setError((prev) => 
                   prev ? prev : `API Search failed for one or more terms (e.g., "${term}"). Check the URL or server.`
                ); 
                errorOccurred = true;
            }
        }); 

        // Execute the search promises sequentially (using 'await' in the loop)
        for (const searchFunc of searchPromises) {
            await searchFunc();
        }

        // Final cleanup
        const finalCount = cumulativeResults.length;
        setTotalProductsCount(finalCount);
        
        if (finalCount === 0 && !errorOccurred) { 
            setError(`No API results found for the entered terms.`); 
        } else if (!errorOccurred) {
            setError('');
        }
        setLoading(false); 
        
    }, [getSearchTerms, setTotalProductsCount]);


    // NEW: Key Down Handler 
    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault(); 
            if (!loading && getSearchTerms.length > 0) {
                performSearch();
            }
        }
    };
    // DATA PERSISTENCE
    useEffect(() => { 
        setTotalProductsCount(rawSearchResults.length);
    }, [rawSearchResults.length, setTotalProductsCount]);

    // CSV EXPORT LOGIC

    const csvEscape = (value) => {
        if (value === null || value === undefined) return '';
        let str = String(value).trim();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    
    const generateCsvContent = useCallback((results) => {
        const headers = [
            'Source Search Term', 'Item Description', 'Potential Buyer 1', 'Quantity', 'UQC', 
            'Unit Price', 'Potential Buyer 2', 'Buyer 1 Contact', 'Buyer 1 Email'
        ];
        const keysMap = [
            'sourceSearchTerm', 
            ['Item_Description', 'itemDescription', 'item_description', 'Item Description'],
            ['Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1', 'Buyer 1'],
            ['Quantity', 'quantity', 'Qty'],
            ['UQC', 'uqc', 'unit_of_quantity', 'UQC'],
            ['Unit_Price', 'unitPrice', 'price', 'Unit Price'],
            ['Potential_Buyer_2', 'potentialBuyer2', 'potential_buyer_2', 'Buyer 2'],
            ['Potential_Buyer_1_Contact_Detail', 'potentialBuyer1ContactDetail', 'Contact_Detail', 'contact', 'CONTACT'],
            ['Potential_Buyer_1_Email', 'potentialBuyer1Email', 'email_address', 'email', 'EMAIL'],
        ];

        let csvContent = headers.map(csvEscape).join(',') + '\n';
        
        results.forEach(item => { 
            const row = keysMap.map(possibleKeys => {
                if (possibleKeys === 'sourceSearchTerm') return csvEscape(item.sourceSearchTerm || 'N/A');
                
                const keys = Array.isArray(possibleKeys) ? possibleKeys : [possibleKeys];
                const value = getFieldValue(item, ...keys);
                return csvEscape(value || 'N/A');
            }).join(',');
            csvContent += row + '\n';
        });
        return csvContent;
    }, []);

    const exportTermToCsv = useCallback((term) => {
        const resultsToExport = groupedResults.get(term) || [];

        if (resultsToExport.length === 0) {
            console.warn(`No results found to export for product: ${term}`);
            return;
        }
        
        const csvContent = generateCsvContent(resultsToExport);
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const safeTerm = term.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30); 
        const filename = `Vendors_For_${safeTerm}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute('download', filename);
        
        document.body.appendChild(link); 
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }, [groupedResults, generateCsvContent]);
    
    const exportAllToCsv = () => {
        if (groupedResults.size === 0) {
            alert("No search results available to export.");
            return;
        }
        
        [...groupedResults.keys()].forEach((term, index) => {
              setTimeout(() => {
                  exportTermToCsv(term);
              }, index * 200); 
        });
        
        alert(`Exporting ${groupedResults.size} separate CSV files. Check your downloads.`);
    };
    
    // INFINITE SCROLL & MODAL LOGIC 
    
    const displayedDetailResults = useMemo(() => {
        return currentViewResults.slice(0, displayLimit);
    }, [currentViewResults, displayLimit]);

    const loadMore = useCallback(() => {
        if (displayLimit < currentViewResults.length) {
            setDisplayLimit(prevLimit => Math.min(prevLimit + LOAD_STEP, currentViewResults.length));
        }
    }, [displayLimit, currentViewResults.length]);

    useEffect(() => {
        const listElement = listRef.current;
        if (!listElement || displayedDetailResults.length === currentViewResults.length || !selectedProductTerm) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = listElement;
            if (scrollHeight - scrollTop - clientHeight < 200) {
                loadMore();
            }
        };

        listElement.addEventListener('scroll', handleScroll);
        return () => listElement.removeEventListener('scroll', handleScroll);
    }, [displayedDetailResults.length, currentViewResults.length, loadMore, selectedProductTerm]);
    
    const openDetailsModal = (vendor) => { setSelectedVendor(vendor); setShowDetailsModal(true); };
    const closeDetailsModal = () => { setShowDetailsModal(false); setSelectedVendor(null); };


    // RENDER FUNCTIONS 
    
    const renderSummaryView = () => (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-4">
            <div className="p-4 bg-gray-50 border-b">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    Product Search Summary ({groupedResults.size} Unique Products)
                </h3>
            </div>
            
            {groupedResults.size > 0 ? (
                <div className="block overflow-x-auto"> 
                    <table className="w-full table-auto">
                        <thead className="bg-indigo-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%]">Product Name (Search Term)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[20%]">Vendor Count</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-[40%]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {[...groupedResults.entries()].map(([term, vendors]) => (
                                <tr key={term} className="hover:bg-purple-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-semibold text-blue-700 max-w-[300px] truncate">{term}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 font-bold">{vendors.length} Vendors</td>
                                    <td className="px-4 py-3 text-sm flex gap-2">
                                        <button 
                                            onClick={() => openVendorDetailView(term)} 
                                            className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-700 transition-colors flex items-center gap-1"
                                        >
                                            <Eye className="w-3 h-3" /> View Vendors
                                        </button>
                                        <button 
                                            onClick={() => exportTermToCsv(term)} 
                                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600 transition-colors flex items-center gap-1"
                                        >
                                            <Download className="w-3 h-3" /> Export CSV
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-10 text-gray-500">
                     <p className="font-semibold">No results found for the entered terms.</p>
                </div>
            )}
        </div>
    );
    const renderDetailView = () => (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-4">
            <div className="p-4 bg-purple-50 border-b flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 truncate">
                    Vendors for: <span className="text-purple-700">{selectedProductTerm}</span>
                </h3>
                <button 
                    onClick={goToSummaryView} 
                    className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                >
                    &larr; Back to Summary
                </button>
            </div>

            <div className="p-4">
                <p className="text-gray-600 text-sm mb-3 font-medium">
                    Showing **{displayedDetailResults.length}** of **{currentViewResults.length}** vendors.
                </p>

                <div className="block overflow-x-auto"> 
                    <table className="w-full table-auto min-w-[1200px]"> 
                        <thead className="bg-indigo-600 sticky top-0">
                            <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[10%]">Source Term</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[15%]">Item Description</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[10%]">Buyer 1</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[5%]">Qty</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[5%]">UQC</th> 
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[8%]">Unit Price</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[10%]">Buyer 2</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[10%]">Contact (B1)</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[10%]">Email (B1)</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-white uppercase tracking-wider w-[7%]">Details</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayedDetailResults.map((vendor, index) => {
                                const contactDetail = getFieldValue(vendor, 'Potential_Buyer_1_Contact_Detail', 'potentialBuyer1ContactDetail');
                                const emailDetail = getFieldValue(vendor, 'Potential_Buyer_1_Email', 'potentialBuyer1Email'); 
                                
                                return (
                                <tr key={index} className="hover:bg-purple-50 transition-colors">
                                    <td className="px-2 py-2 text-[11px] text-gray-500 max-w-[150px] truncate">{vendor.sourceSearchTerm || 'N/A'}</td>
                                    
                                    <td className="px-2 py-2 text-[11px] text-gray-900 font-medium max-w-[200px] truncate">{getFieldValue(vendor, 'Item_Description', 'itemDescription', 'item_description')}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-700 max-w-[150px] truncate">{getFieldValue(vendor, 'Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1')}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-700 font-semibold">{getFieldValue(vendor, 'Quantity', 'quantity', 'Qty') || 'N/A'}</td>
                                    
                                    <td className="px-2 py-2 text-[11px] text-green-600 font-bold">{getFieldValue(vendor, 'UQC', 'uqc', 'unit_of_quantity') || 'N/A'}</td>
                                    
                                    <td className="px-2 py-2 text-[11px] text-purple-600 font-bold">{getFieldValue(vendor, 'Unit_Price', 'unitPrice', 'price') || 'N/A'}</td>
                                    
                                    <td className="px-2 py-2 text-[11px] text-gray-700 max-w-[150px] truncate">{getFieldValue(vendor, 'Potential_Buyer_2', 'potentialBuyer2', 'potential_buyer_2') || 'N/A'}</td>

                                    <td className="px-2 py-2 text-[10px]">
                                         <div className="flex items-center gap-1 text-green-600 truncate max-w-[100px]">
                                             <Phone className="w-3 h-3 flex-shrink-0" />
                                             <span className="text-xs">{ contactDetail || 'N/A'} </span>
                                         </div>
                                    </td>
                                    <td className="px-2 py-2 text-[10px]">
                                         <div className="flex items-center gap-1 text-gray-600 truncate max-w-[100px]">
                                             <Mail className="w-3 h-3 flex-shrink-0" />
                                             <span className="text-xs">{ emailDetail || 'N/A'}</span>
                                         </div>
                                    </td>
                                    <td className="px-2 py-2 text-[11px]"><button onClick={() => openDetailsModal(vendor)} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-purple-700 transition-colors">Details</button></td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {displayedDetailResults.length < currentViewResults.length && (
                     <div className="p-4 text-center border-t border-gray-200">
                          <button onClick={loadMore} className="bg-purple-100 text-purple-600 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-purple-200 transition-colors flex items-center justify-center mx-auto">
                              Load More ({Math.min(LOAD_STEP, currentViewResults.length - displayedDetailResults.length)}) <ChevronDown className="w-4 h-4 ml-2" />
                          </button>
                     </div>
                )}
                {currentViewResults.length > 0 && displayedDetailResults.length === currentViewResults.length && (
                     <div className="p-3 bg-gray-100 text-center text-xs text-gray-500 font-medium border-t">
                          All {currentViewResults.length} vendors displayed for {selectedProductTerm}.
                     </div>
                )}
            </div>
        </div>
    );

    // MAIN RENDER 
    return (
        <div className="flex-1 flex flex-col overflow-hidden relative"> 
            
            <div className="bg-white border-b border-gray-200 shadow-sm p-3 sm:p-4 md:p-6 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 mb-3">Multi-Product Vendor Search</h1>
                
                {/* Search Bar Area */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                    
                    <div className="relative flex-1 flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500"> 
                        <textarea 
                            placeholder="Enter product names separated by comma or new line (e.g., dvr part, small frame, item code 123)" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            className="p-2 w-full text-xs sm:text-sm resize-none flex-1 border-none focus:outline-none focus:ring-0" 
                            style={{ minHeight: '35px', maxHeight: '100px', paddingRight: '2px' }} 
                        />
                        
                        <div className="flex h-auto self-stretch"> 
                            {rawSearchResults.length > 0 && (
                                <button 
                                    onClick={exportAllToCsv} 
                                    className="px-2 py-0 bg-green-500 text-white hover:bg-green-600 font-bold text-xs flex items-center gap-1 transition-all rounded-none self-stretch"
                                >
                                    <Download className="w-3 h-3" /> Export All ({groupedResults.size})
                                </button>
                            )}
                            <button 
                                onClick={performSearch} 
                                disabled={loading || getSearchTerms.length === 0} 
                                className={`px-3 py-0 font-bold text-xs flex items-center gap-1 transition-all self-stretch ${loading || getSearchTerms.length === 0 ? 'bg-gray-300 text-gray-500 rounded-r-lg' : 'bg-purple-600 text-white hover:bg-purple-700 rounded-r-lg'}`}
                            >
                                <Search className="w-3 h-3" /> Search ({getSearchTerms.length})
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Stats Area */}
                {(rawSearchResults.length > 0 || loading) && (
                    <div className="flex items-center gap-6 border-t pt-3">
                        <div className="text-gray-600 text-sm font-medium flex items-center gap-1">
                             <div className="font-semibold">Total API Results:</div> 
                             <span className="font-bold text-lg text-gray-900">{rawSearchResults.length}</span>
                        </div>
                        <div className="text-gray-600 text-sm font-medium flex items-center gap-1">
                             <div className="font-semibold">Products with Results:</div> 
                             <span className="font-bold text-lg text-gray-900">{groupedResults.size}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pt-3" ref={listRef}> 
                
                {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs sm:text-sm shadow-md"><p className="font-semibold">Error:</p><p>{error}</p></div>)}
                
                {loading && (
                    <div className="text-center py-6 bg-white rounded-xl shadow-md">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-purple-600"></div>
                        <p className="mt-2 text-gray-600 text-xs sm:text-sm font-medium">
                            Searching API for {getSearchTerms.length} products... 
                            <span className="font-bold block text-purple-700">Results will appear dynamically.</span>
                        </p>
                    </div>
                )}
                
                {!loading && rawSearchResults.length === 0 && !error && (
                    <div className="text-center py-16 bg-white rounded-xl shadow-md">
                        <Search className="w-20 h-20 text-purple-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Perform an API Search</h3>
                        <p className="text-gray-500">Enter comma-separated product names above and click search to view results.</p>
                    </div>
                )}

                {/* Show results even if still loading */}
                {rawSearchResults.length > 0 && (
                    selectedProductTerm ? renderDetailView() : renderSummaryView()
                )}
            </div>
            <VendorCRMDetailsModal selectedVendor={selectedVendor} onClose={closeDetailsModal} />
        </div>
    );
};

export default SearchProductsView;