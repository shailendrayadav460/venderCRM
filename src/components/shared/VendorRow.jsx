// src/components/shared/VendorRow.jsx

import React from 'react';
import { Mail, Eye, CheckCircle } from 'lucide-react';
import { safeValue } from '../../utils/config.jsx';

export const VendorRow = React.memo(({ vendor, onSendRFQ, rfqStatus, onViewResponse, isSelected, onToggleSelect }) => {
    const rfqKey = `${vendor.matchId}-${vendor.Id}`;
    const status = rfqStatus[rfqKey];
    const hasResponse = vendor.mockVendorResponse?.Product_Available === 'YES' || vendor.mockVendorResponse?.Vendor_Price;
    const vendorName = safeValue(vendor.Potential_Buyer_1);
    const itemDescription = safeValue(vendor.Item_Description);
    const availableQty = safeValue(vendor.Quantity);
    const uqc = safeValue(vendor.UQC);
    const price = safeValue(vendor.Unit_Price);
    const vendorItemId = safeValue(vendor.Id);

    return (
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between p-3 rounded-xl border-2 transition-all gap-3 ${hasResponse
            ? 'bg-green-50 border-green-400 hover:border-green-500 hover:shadow-xl'
            : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:shadow-md'
            }`}>
            <div className="flex items-center gap-3 flex-1">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelect}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                {hasResponse && (
                    <div className="flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600 animate-pulse" />
                    </div>
                )}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                    <div><span className="text-[10px] text-gray-500 block font-semibold mb-1">Vendor Item ID</span><span className="font-bold text-indigo-600 text-[11px]">{vendorItemId}</span></div>
                    <div><span className="text-[10px] text-gray-500 block font-semibold mb-1">Vendor</span><span className="font-bold text-gray-800">{vendorName}</span></div>
                    <div className="sm:col-span-2 lg:col-span-1"><span className="text-[10px] text-gray-500 block font-semibold mb-1">Item</span><span className="text-gray-700 line-clamp-2">{itemDescription}</span></div>
                    <div><span className="text-[10px] text-gray-500 block font-semibold mb-1">Available Qty</span><span className="text-gray-800 font-medium">{availableQty} {uqc}</span></div>
                    <div><span className="text-[10px] text-gray-500 block font-semibold mb-1">Price</span><span className="text-green-700 font-bold text-sm">₹{price}</span></div>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => onSendRFQ(vendor, rfqKey)}
                    disabled={status === 'sending' || status === 'sent'}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md whitespace-nowrap ${status === 'sent'
                        ? 'bg-green-100 text-green-700 border-2 border-green-400'
                        : status === 'sending'
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105'
                        }`}
                >
                    {status === 'sent' ? (<>✅ RFQ Sent</>) : status === 'sending' ? (<><div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />Sending...</>) : (<><Mail className="w-3 h-3" />Send RFQ</>)}
                </button>

                <button
                    onClick={() => onViewResponse(vendor)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap ${hasResponse
                        ? 'bg-green-600 text-white hover:bg-green-700 ring-2 ring-green-400'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                >
                    {hasResponse ? (<><CheckCircle className="w-4 h-4 animate-pulse" />✅ Response</>) : (<><Eye className="w-3 h-3" />Response</>)}
                </button>
            </div>
        </div>
    );
});