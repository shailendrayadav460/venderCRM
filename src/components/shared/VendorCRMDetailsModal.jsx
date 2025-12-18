// src/components/shared/VendorCRMDetailsModal.jsx

import React from 'react';
import { X, Phone, Mail } from 'lucide-react';
import { safeValue, getFieldValue } from '../../utils/config.jsx';

const VendorCRMDetailsModal = React.memo(({ selectedVendor, onClose }) => {
    if (!selectedVendor) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-indigo-600 text-white px-4 sm:px-6 py-3 flex items-center justify-between">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold">Vendor Details</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-indigo-700 rounded-full p-1 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Left Column - Contact Information */}
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                                Contact Information
                            </h3>

                            <div className="space-y-3">
                                {/* WhatsApp Number */}
                                <div className="flex items-start gap-2">
                                    <div className="bg-indigo-100 p-2 rounded-lg">
                                        <Phone className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs sm:text-sm font-semibold text-gray-900">WhatsApp Number</p>
                                        <p className="text-[10px] sm:text-xs text-gray-600 mb-1 ">
                                            {getFieldValue(selectedVendor, 'Potential_Buyer_1_Contact_Detail', 'contactDetails', 'contact_details', 'contact')}
                                        </p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-2">
                                    <div className="bg-indigo-100 p-2 rounded-lg">
                                        <Mail className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className=" text-xs sm:text-sm font-semibold text-gray-900 break-all">Email</p>
                                        <p className=" text-[10px] sm:text-xs text-gray-600 mb-1 ">
                                            {getFieldValue(selectedVendor, 'Potential_Buyer_1_Email', 'emailId', 'email_id', 'email')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Product Details */}
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 pb-2 border-b-2 border-gray-200">
                                Product Details
                            </h3>

                            <div className="space-y-3">
                                {/* Product */}
                                <div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 break-all">Product</p>
                                    <p className="text-[10px] sm:text-xs text-gray-600 mb-1 ">
                                        {getFieldValue(selectedVendor, 'Item_Description', 'itemDescription', 'item_description')}
                                    </p>
                                </div>

                                {/* Quantity, UQC, Unit Price */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-gray-600 mb-1">Quantity</p>
                                        <p className="text-base sm:text-lg font-bold text-blue-600">
                                            {getFieldValue(selectedVendor, 'Quantity', 'quantity')}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-gray-600 mb-1">UQC</p>
                                        <p className="text-base sm:text-lg font-bold text-green-600">
                                            {getFieldValue(selectedVendor, 'UQC', 'uqc')}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                                        <p className="text-[10px] text-gray-600 mb-1">Unit Price</p>
                                        <p className="text-base sm:text-lg font-bold text-purple-600">
                                            {getFieldValue(selectedVendor, 'Unit_Price', 'unitPrice', 'unit_price')}
                                        </p>
                                    </div>
                                </div>

                                {/* Potential Buyer 1 */}
                                <div className="bg-orange-50 rounded-lg p-3">
                                    <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Potential Buyer 1</p>
                                    <p className="text-xs sm:text-sm font-bold text-orange-900">
                                        {getFieldValue(selectedVendor, 'Potential_Buyer_1', 'potentialBuyer1', 'potential_buyer_1')}
                                    </p>
                                </div>

                                {/* Potential Buyer 2 */}
                                <div className="bg-orange-50 rounded-lg p-3">
                                    <p className="text-[10px] sm:text-xs text-gray-600 mb-1">Potential Buyer 2</p>
                                    <p className="text-xs sm:text-sm font-bold text-orange-900">
                                        {getFieldValue(selectedVendor, 'Potential_Buyer_2', 'potentialBuyer2', 'potential_buyer_2')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={() => {
                            const phone = getFieldValue(selectedVendor, 'Potential_Buyer_1_Contact_Detail', 'contactDetails', 'contact_details', 'contact');
                            if (phone !== 'N/A') {
                                window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
                            } else {
                                alert('WhatsApp number not available');
                            }
                        }}
                        className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 font-semibold transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                        <Phone className="w-4 h-4" />
                        Send RFQ via WhatsApp
                    </button>
                    <button
                        onClick={() => {
                            const email = getFieldValue(selectedVendor, 'Potential_Buyer_1_Email', 'emailId', 'email_id', 'email');
                            if (email !== 'N/A') {
                                window.location.href = `mailto:${email}`;
                            } else {
                                alert('Email address not available');
                            }
                        }}
                        className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                        <Mail className="w-4 h-4" />
                        Send Email
                    </button>
                </div>
            </div>
        </div>
    );
});

export { VendorCRMDetailsModal };