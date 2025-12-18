import React, { useState, useCallback, useMemo } from 'react';
import { Search, List, Download, Users, ArrowRight } from 'lucide-react'; 
import API_CONFIG, { getFieldValue } from '../../utils/config.jsx'; 

// सर्च के लिए API URL
const SEARCH_API = API_CONFIG.VENDOR_SEARCH_API_URL; 

// --- Component: Product Search View ---
const ProductSearchView = () => {
    
    // State Declarations
    const [searchTerm, setSearchTerm] = useState('');
    const [rawSearchResults, setRawSearchResults] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [totalVendorCount, setTotalVendorCount] = useState(0); 

    // --- UTILITY: Comma/Whitespace Separated Search Term Handling ---
    const getSearchTerms = useMemo(() => {
        if (!searchTerm.trim()) return [];
        
        // **--- FIX APPLIED HERE: Simple Split on comma followed by optional spaces ---**
        // यह रेगुलर एक्सप्रेशन कॉमा और उसके बाद आने वाले किसी भी व्हाइटस्पेस (स्पेस, टैब, न्यूलाइन) पर स्प्लिट करेगा।
        return searchTerm
            .split(/,\s*/) // कॉमा (,) और उसके बाद 0 या अधिक व्हाइटस्पेस पर स्प्लिट करें
            .map(term => term.trim())
            .filter(term => term.length >= 3);
        
    }, [searchTerm]);


    // --- CSV EXPORT LOGIC (No Change) ---
    const csvEscape = (value) => {
        if (value === null || value === undefined) return '';
        let str = String(value).trim();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const exportToCsv = useCallback(() => {
        if (rawSearchResults.length === 0) {
            alert('No results to export.');
            return;
        }

        const headers = [
            'Product Name', 
            'Vendor Name', 
            'Source Search Term'
        ];
        
        const keysMap = {
            'Product Name': ['Item_Description', 'itemDescription', 'item_description'],
            'Vendor Name': ['Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1'], 
        };

        let csvContent = headers.map(csvEscape).join(',') + '\n';

        rawSearchResults.forEach(item => { 
            const productName = getFieldValue(item, ...keysMap['Product Name']) || 'N/A';
            const vendorName = getFieldValue(item, ...keysMap['Vendor Name']) || 'N/A';
            const sourceTerm = csvEscape(item.sourceSearchTerm || 'N/A');
            
            const row = [
                csvEscape(productName),
                csvEscape(vendorName),
                sourceTerm
            ].join(',');
            
            csvContent += row + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const filename = `Multi_Product_Search_Results.csv`;
        link.setAttribute('download', filename);
        link.click();
        
        URL.revokeObjectURL(url); 
        
    }, [rawSearchResults]); 

    // --- SEARCH LOGIC (No Change) ---
    const performSearch = useCallback(async () => {
        const terms = getSearchTerms;
        if (terms.length === 0) {
            setError('Please enter at least one product search term (3+ characters).');
            setRawSearchResults([]);
            setTotalVendorCount(0);
            return;
        }

        setLoading(true); setError(''); setRawSearchResults([]);
        let allResults = [];
        let uniqueVendors = new Set(); 

        try {
            for (const term of terms) {
                const apiUrl = `${SEARCH_API}${encodeURIComponent(term)}`;

                const response = await fetch(apiUrl, { 
                    method: 'GET', 
                    headers: { 
                        'Content-Type': 'application/json', 
                        'ngrok-skip-browser-warning': 'true' 
                    } 
                });
                
                if (!response.ok) { 
                    console.error(`Search failed for term "${term}": ${response.status} ${response.statusText}`);
                    continue;
                }

                const data = await response.json();
                let results = data?.matches || data?.vendors || data?.data || data?.products || data?.results || [];
                if (!Array.isArray(results)) results = [];

                results = results.map(item => ({ 
                    ...item, 
                    sourceSearchTerm: term 
                }));

                allResults.push(...results);
                
                results.forEach(item => {
                    const vendor = getFieldValue(item, 'Potential_Buyer_1'); 
                    if (vendor) {
                        uniqueVendors.add(vendor);
                    }
                });
            }

            setRawSearchResults(allResults); 
            setTotalVendorCount(uniqueVendors.size); 

            if (allResults.length === 0) { 
                setError(`No API results found for the entered terms.`); 
            } else { 
                setError(''); 
            }

        } catch (err) { 
            setError('❌ API Search Error: ' + err.message + '. Check the Search API URL or network.'); 
        } finally { 
            setLoading(false); 
        }
    }, [getSearchTerms]); 

    
    // --- RENDER (No Change) ---
    return (
        <div className="flex-1 flex flex-col overflow-hidden p-6 bg-gray-50"> 
            
            {/* Header and Search Area */}
            <div className="bg-white border-b border-gray-200 shadow-lg rounded-xl p-6 mb-6 flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900 flex items-center mb-4">
                    <Search className="w-6 h-6 text-purple-600 mr-2" />
                    Multi-Product Vendor Search
                </h1>
                
                <div className="flex flex-col md:flex-row items-stretch gap-3">
                    
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <textarea 
                            placeholder="Enter product names separated by comma (e.g., dvr part, small frame, item code 123)" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            rows={3}
                            className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none"
                        />
                    </div>
                    
                    {/* Search Button */}
                    <button 
                        onClick={performSearch} 
                        disabled={loading || getSearchTerms.length === 0} 
                        className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all md:w-48 flex-shrink-0 ${loading || getSearchTerms.length === 0 ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'}`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-100 border-t-white mr-2"></span>
                                Searching...
                            </span>
                        ) : (
                            <>
                                <Search className="w-4 h-4" /> 
                                Search Products ({getSearchTerms.length})
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Stats and Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 flex-shrink-0">
                
                {/* Total Results Card */}
                <div className="bg-white rounded-xl p-4 border-l-4 border-purple-500 shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-xs mb-1 font-bold">Total API Matches</p>
                        <p className="text-2xl font-bold text-gray-900">{rawSearchResults.length}</p>
                    </div>
                    <List className="w-8 h-8 text-purple-600" />
                </div>
                
                {/* Searching Vendor Card */}
                <div className="bg-white rounded-xl p-4 border-l-4 border-indigo-500 shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-xs mb-1 font-bold">Unique Vendors Found</p>
                        <p className="text-2xl font-bold text-gray-900">{totalVendorCount}</p>
                    </div>
                    <Users className="w-8 h-8 text-indigo-600" />
                </div>
                
                {/* Export CSV Button */}
                <div className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-md flex items-center justify-between">
                    <div>
                        <p className="text-gray-600 text-xs mb-1 font-bold">Export Data</p>
                        <button
                            onClick={exportToCsv}
                            disabled={rawSearchResults.length === 0}
                            className={`px-4 py-2 text-sm rounded-lg shadow-md transition-colors flex items-center gap-2 ${rawSearchResults.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
                        >
                            <Download className="w-4 h-4" /> Export CSV ({rawSearchResults.length})
                        </button>
                    </div>
                    <Download className="w-8 h-8 text-green-600" />
                </div>
            </div>

            {/* Result Display Area */}
            <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-lg p-4"> 
                {error && (<div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-3 text-sm font-semibold">{error}</div>)}
                
                {rawSearchResults.length > 0 && (
                    <div className="text-gray-700 mb-4 font-medium">
                        Showing **{rawSearchResults.length}** matches from **{totalVendorCount}** unique vendors for **{getSearchTerms.length}** search terms.
                    </div>
                )}
                
                <div className="block overflow-x-auto"> 
                    {rawSearchResults.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Searching Vendor</th>
                                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Search Term</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rawSearchResults.slice(0, 100).map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-normal text-sm font-medium text-gray-900 max-w-sm truncate">
                                            {getFieldValue(item, 'Item_Description', 'itemDescription', 'item_description') || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-normal text-sm text-indigo-600 max-w-xs truncate">
                                            {getFieldValue(item, 'Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1') || 'N/A'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-normal text-xs text-gray-500">
                                            {item.sourceSearchTerm || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        !loading && !error && (
                            <div className="text-center py-10 text-gray-500">
                                <ArrowRight className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="font-semibold">Enter your products above and click 'Search Products' to begin.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductSearchView;