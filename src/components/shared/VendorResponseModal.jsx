import React, { useState } from 'react';
import { 
    Package, X, Clock, DollarSign, Send, CheckCircle, 
    AlertCircle, Hash, User, ShoppingBag, Layers, 
    Truck, MapPin, Calendar, Activity
} from 'lucide-react';
import API_CONFIG, { safeValue } from '../../utils/config.jsx';

export const VendorResponseModal = React.memo(({ isOpen, onClose, vendorData, matchData }) => {
    const [offerPrice, setOfferPrice] = useState('');
    const [sendingOffer, setSendingOffer] = useState(false);

    if (!isOpen) return null;

    // --- API Data Mapping (Based on your JSON structure) ---
    // vendorData yahan aapka "data" object hai jo API se aa raha hai
    const responseData = vendorData?.data || vendorData; 
    
    // Status logic: Agar status '1' hai (Available) ya statusText "Available" hai
    const isAvailable = responseData?.status === "1" || responseData?.statusText === "Available";
    const hasResponse = responseData?.status !== "pending" && responseData?.status !== null;

    const info = {
        rfqId: safeValue(responseData?.rfqId),
        matchId: safeValue(responseData?.matchId),
        vendorName: safeValue(responseData?.vendorName),
        productReq: safeValue(responseData?.ProductReq),
        statusText: safeValue(responseData?.statusText) || 'Pending',
        availability: safeValue(responseData?.currentAvailability),
        location: safeValue(responseData?.location),
        quantity: safeValue(responseData?.quantity),
        bestPrice: safeValue(responseData?.bestPrice),
        rfqSentAt: responseData?.rfqSentAt ? new Date(responseData.rfqSentAt).toLocaleString() : '—',
        responseReceivedAt: responseData?.responseReceivedAt ? new Date(responseData.responseReceivedAt).toLocaleString() : '—'
    };

    const InfoRow = ({ label, value, icon: Icon, color = "text-gray-800" }) => (
        <div className="flex flex-col space-y-1">
            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1">
                {Icon && <Icon className="w-3 h-3" />} {label}
            </p>
            <p className={`text-sm font-bold ${color} truncate`}>{value || '—'}</p>
        </div>
    );

    const handleSendOffer = async () => {
        if (!offerPrice || offerPrice <= 0) { alert('⚠️ Enter valid price'); return; }
        setSendingOffer(true);
        try {
            // Aapka fetch logic yahan aayega
            setTimeout(() => { 
                alert(`✅ Offer of ₹${offerPrice} sent!`);
                setSendingOffer(false); 
                onClose(); 
            }, 1000);
        } catch (error) { setSendingOffer(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden flex flex-col max-h-[95vh]">
                
                {/* Header */}
                <div className="p-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg"><Truck className="w-6 h-6" /></div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">Vendor Submission</h3>
                            <p className="text-[10px] uppercase tracking-widest opacity-70 truncate max-w-[300px]">
                                {info.vendorName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-all"><X /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* RFQ Request Details */}
                    <section>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Hash className="w-3 h-3" /> Basic Request Info
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <InfoRow label="RFQ ID" value={info.rfqId} icon={Hash} />
                            <InfoRow label="Match ID" value={info.matchId} icon={Activity} />
                            <InfoRow label="Product Req" value={info.productReq} icon={ShoppingBag} />
                        </div>
                    </section>

                    {/* Vendor Database Fields (Image 2 Columns) */}
                    <section>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Database Response Fields
                        </h4>
                        
                        {info.statusText !== 'Pending' ? (
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12 px-2">
                                <InfoRow 
                                    label="Status" 
                                    value={info.statusText} 
                                    icon={CheckCircle} 
                                    color={isAvailable ? "text-green-600" : "text-red-500"} 
                                />
                                <InfoRow label="Location" value={info.location} icon={MapPin} />
                                <InfoRow label="Availability" value={info.availability} icon={Activity} />
                                <InfoRow label="Available Qty" value={info.quantity} icon={Layers} />
                                <InfoRow label="Best Price" value={`₹${info.bestPrice}`} icon={DollarSign} color="text-indigo-700" />
                                <InfoRow label="Sent At" value={info.rfqSentAt} icon={Calendar} />
                                <InfoRow label="Received At" value={info.responseReceivedAt} icon={Clock} />
                            </div>
                        ) : (
                            <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-2xl p-10 text-center">
                                <Clock className="w-12 h-12 text-indigo-300 mx-auto mb-4 animate-pulse" />
                                <h5 className="font-bold text-indigo-900">Awaiting Response</h5>
                                <p className="text-xs text-indigo-500 mt-2">Waiting for {info.vendorName} to reply via WhatsApp.</p>
                            </div>
                        )}
                    </section>

                    {/* Final Offer Section */}
                    {info.statusText !== 'Pending' && isAvailable && (
                        <div className="bg-indigo-600 rounded-2xl p-6 shadow-lg text-white">
                            <div className="flex items-center gap-2 mb-4">
                                <Send className="w-4 h-4" />
                                <h4 className="text-sm font-bold uppercase tracking-wide">Send Final Offer to Customer</h4>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1 text-gray-900">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="Enter your markup price..."
                                        className="w-full bg-white rounded-xl py-3 pl-10 pr-4 outline-none font-bold shadow-inner"
                                        value={offerPrice}
                                        onChange={(e) => setOfferPrice(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleSendOffer}
                                    disabled={!offerPrice || sendingOffer}
                                    className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 px-8 py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                                >
                                    {sendingOffer ? "SENDING..." : "SEND OFFER"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 font-bold text-gray-500 hover:text-gray-700 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
});