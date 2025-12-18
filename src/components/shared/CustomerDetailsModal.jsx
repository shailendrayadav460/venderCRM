// src/components/shared/CustomerDetailsModal.jsx

import React from 'react';
import { X, Mail, User, Phone } from 'lucide-react';
import { safeValue } from '../../utils/config.jsx';

export const CustomerDetailsModal = React.memo(({ selectedBuyer, onClose, onSendAllRFQ }) => {
    if (!selectedBuyer) return null;

    const {
        customerName, customerWhatsapp, customerEmail, product, totalQuantity, createdAt, matchingVendors
    } = selectedBuyer;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                    <div className="flex items-center"><div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3"><User className="w-5 h-5" /></div><h3 className="text-lg md:text-xl font-bold">Customer Request Details</h3></div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">{/* ... (Customer details) ... */}
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"><div className="text-xs text-indigo-700 font-bold mb-2">Date & Time</div><div className="text-sm font-semibold text-gray-900">{safeValue(createdAt)}</div></div>
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"><div className="text-xs text-indigo-700 font-bold mb-2">Customer Name</div><div className="text-sm font-semibold text-gray-900">{safeValue(customerName)}</div></div>
                        <div className="p-4 bg-green-50 rounded-xl border-2 border-green-300"><div className="text-xs text-green-700 font-bold mb-2 flex items-center"><Phone className="w-3 h-3 mr-1" />WhatsApp Number</div><div className="text-sm font-semibold text-gray-900">{safeValue(customerWhatsapp)}</div></div>
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"><div className="text-xs text-indigo-700 font-bold mb-2">Email</div><div className="text-sm font-semibold text-gray-900 break-all">{safeValue(customerEmail)}</div></div>
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 md:col-span-2"><div className="text-xs text-indigo-700 font-bold mb-2">Product Needed (Product_Req)</div><div className="text-sm font-semibold text-gray-900">{safeValue(product)}</div></div>
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"><div className="text-xs text-indigo-700 font-bold mb-2">Total Quantity Needed</div><div className="text-sm font-semibold text-gray-900">{safeValue(totalQuantity)}</div></div>
                    </div>
                    {matchingVendors && matchingVendors.length > 0 && (
                        <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                                <div><h4 className="text-sm font-bold text-orange-800">Send RFQ to All Vendors</h4><p className="text-xs text-orange-600 mt-1">{matchingVendors.length} product-vendor match(es) available</p></div>
                                <button onClick={() => { onSendAllRFQ(matchingVendors); onClose(); }} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-bold flex items-center gap-2 shadow-lg"><Mail className="w-4 h-4" />Send All RFQ</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="sticky bottom-0 p-4 bg-gray-50 border-t flex justify-end gap-3"><button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm">Close</button></div>
            </div>
        </div>
    );
});