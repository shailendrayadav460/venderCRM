import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Package, X, Mail, Eye, CheckCircle, Clock, AlertCircle, User, Phone, Send, DollarSign } from 'lucide-react';
import CONFIG from '../utils/config.jsx';
import { safeValue, getFieldValue } from '../utils/config.jsx';


const VendorRow = React.memo(({ vendor, onSendRFQ, rfqStatus, onViewResponse, isSelected, onToggleSelect }) => {
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
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold mb-1">Vendor Item ID</span>
              <span className="font-bold text-indigo-600 text-[11px]">{vendorItemId}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold mb-1">Vendor</span>
              <span className="font-bold text-gray-800">{vendorName}</span>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] text-gray-500 block font-semibold mb-1">Item</span>
              <span className="text-gray-700 line-clamp-2">{itemDescription}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold mb-1">Available Qty</span>
              <span className="text-gray-800 font-medium">{availableQty} {uqc}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 block font-semibold mb-1">Price</span>
              <span className="text-green-700 font-bold text-sm">₹{price}</span>
            </div>
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
            {status === 'sent' ? (
              <>✅ RFQ Sent</>
            ) : status === 'sending' ? (
              <>
                <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-3 h-3" />
                Send RFQ
              </>
            )}
          </button>

          <button
            onClick={() => onViewResponse(vendor)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap ${hasResponse
                ? 'bg-green-600 text-white hover:bg-green-700 ring-2 ring-green-400'
                : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
          >
            {hasResponse ? (
              <>
                <CheckCircle className="w-4 h-4 animate-pulse" />
                ✅ Response
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                Response
              </>
            )}
          </button>
        </div>
      </div>
  );
});

const MatchingTable = React.memo(({
  filteredMatching,
  matchingPrimaryCols,
  getRFQStatusForGroup,
  expandedRow,
  setExpandedRow,
  setSelectedBuyer,
  selectedVendors,
  setSelectedVendors,
  sendRFQ,
  sendAllRFQ,
  sendSelectedRFQ,
  rfqStatus,
  handleViewVendorResponse,
  newEntries
}) => {
  const getCellValue = (row, key) => safeValue(row[key]);

  return (
    <div className="overflow-auto flex-1">
      <table className="w-full">
        <thead className="bg-indigo-50 border-b-2 border-indigo-200 sticky top-0">
          <tr>
            {matchingPrimaryCols.map(col => (
              <th key={col} className="px-2 py-2 text-left font-bold text-indigo-700 uppercase tracking-wide text-[10px] whitespace-nowrap">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
            <th className="px-2 py-2 text-left font-bold text-indigo-700 uppercase tracking-wide text-[10px] whitespace-nowrap">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredMatching.map((group, idx) => {
            const row = group.mainRow;
            const matchingVendors = group.vendors;
            const isExpanded = expandedRow === idx;
            const rowKey = `row-${idx}`;
            const selectedVendorsForRow = selectedVendors[rowKey] || [];
            const rfqStats = getRFQStatusForGroup(matchingVendors);
            
            const rfqStatusStyles = rfqStats.total === 0
              ? 'bg-gray-100 text-gray-600'
              : rfqStats.responded === rfqStats.total
                ? 'bg-green-100 text-green-700 ring-2 ring-green-400'
                : rfqStats.responded > 0
                  ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400'
                  : 'bg-gray-100 text-gray-600';
                  
            const rfqIcon = rfqStats.total === 0 
              ? <AlertCircle className="w-3 h-3" /> 
              : rfqStats.responded === rfqStats.total
                ? <CheckCircle className="w-3 h-3" />
                : rfqStats.responded > 0
                  ? <Clock className="w-3 h-3 animate-pulse" />
                  : <AlertCircle className="w-3 h-3" />;
            return (
              <React.Fragment key={idx}>
                <tr className={`hover:bg-indigo-50 transition-colors ${newEntries.has(idx) ? 'bg-green-100 animate-pulse' : ''
                  }`}>
                  {matchingPrimaryCols.map(col => (
                    <td key={col} className="px-2 py-2 text-[11px] text-gray-800 whitespace-nowrap">
                      <div className="max-w-[120px] truncate" title={getCellValue(row, col)}>
                        {col === 'RFQ Status' ? (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${rfqStatusStyles}`}>
                            {rfqIcon}
                            {rfqStats.responded}/{rfqStats.total}
                          </div>
                        ) : col === 'Whatsapp_Number' ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-green-600" />
                            <span>{getCellValue(row, col) || '—'}</span>
                          </div>
                        ) : (
                          getCellValue(row, col) || '—'
                        )}
                      </div>
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => setExpandedRow(isExpanded ? null : idx)}
                        className={`min-w-[100px] px-2 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${matchingVendors.length > 0
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        disabled={matchingVendors.length === 0}
                      >
                        {isExpanded ? 'Hide' : 'Vendors'} ({matchingVendors.length})
                      </button>
                      <button
                        onClick={() => setSelectedBuyer({
                          customerName: group.customerName,
                          customerEmail: group.customerEmail,
                          customerAddress: group.customerAddress,
                          customerWhatsapp: group.customerWhatsapp,
                          product: group.productNeeded,
                          totalQuantity: group.totalQuantity,
                          createdAt: group.createdAt,
                          matchingVendors: matchingVendors
                        })}
                        className="min-w-[100px] px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-[10px] font-bold flex items-center justify-center gap-1 whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" />
                        Details
                      </button>
                    </div>
                  </td>
                </tr>

                {isExpanded && matchingVendors.length > 0 && (
                  <tr className="bg-gradient-to-r from-indigo-50 to-blue-50">
                    <td colSpan={matchingPrimaryCols.length + 1} className="px-2 py-3">
                      <div className="bg-white rounded-xl border-2 border-indigo-200 p-3 shadow-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-bold text-indigo-800 flex items-center">
                            <Package className="w-3 h-3 mr-2" />
                            Matched Product-Vendor Items ({matchingVendors.length}) -
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${rfqStatusStyles}`}>
                              {rfqIcon} Responses: {rfqStats.responded}/{rfqStats.total}
                            </span>
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const selectedList = matchingVendors.filter((_, vIdx) =>
                                  selectedVendorsForRow.includes(vIdx)
                                );
                                sendSelectedRFQ(selectedList);
                              }}
                              disabled={selectedVendorsForRow.length === 0}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md ${selectedVendorsForRow.length === 0
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                              <Mail className="w-3 h-3" />
                              Send Selected ({selectedVendorsForRow.length})
                            </button>
                            <button
                              onClick={() => sendAllRFQ(matchingVendors)}
                              className="px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-[10px] font-bold flex items-center gap-1 shadow-md"
                            >
                              <Mail className="w-3 h-3" />
                              Send All RFQ
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                          {matchingVendors.map((vendor, vIdx) => {
                            const isSelected = selectedVendorsForRow.includes(vIdx);

                            return (
                              <VendorRow
                                key={`${vendor.matchId}-${vendor.Id}-${vIdx}`}
                                vendor={vendor}
                                onSendRFQ={sendRFQ}
                                rfqStatus={rfqStatus}
                                onViewResponse={handleViewVendorResponse}
                                isSelected={isSelected}
                                onToggleSelect={() => {
                                  setSelectedVendors(prev => {
                                    const current = prev[rowKey] || [];
                                    const updated = isSelected
                                      ? current.filter(i => i !== vIdx)
                                      : [...current, vIdx];
                                    return { ...prev, [rowKey]: updated };
                                  });
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {filteredMatching.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-20 h-20 text-indigo-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">No Data Found</h3>
          <p className="text-gray-500">Try clearing filters or check the API connection.</p>
        </div>
      )}
    </div>
  );
});


const VendorResponseModal = React.memo(({ isOpen, onClose, vendorData, matchData }) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [sendingOffer, setSendingOffer] = useState(false);

  if (!isOpen) return null;

  const hasResponse = vendorData?.Product_Available || vendorData?.Vendor_Price;
  const Product_Available = safeValue(vendorData?.Product_Available);
  const Vendor_Price = safeValue(vendorData?.Vendor_Price);
  const Available_Qty = safeValue(vendorData?.Available_Qty);
  const Can_Deliver = safeValue(vendorData?.Can_Deliver);
  const Photo_Received = safeValue(vendorData?.Photo_Received);
  const Final_Status = safeValue(vendorData?.Final_Status);
  const RFQ_Status = safeValue(vendorData?.RFQ_Status);
  const Response_Date = safeValue(vendorData?.Response_Date);
  const Vendor_Phone = safeValue(vendorData?.Vendor_Phone);
  const RFQ_ID = safeValue(vendorData?.RFQ_ID);

  const handleSendOffer = async () => {
    if (!offerPrice || offerPrice <= 0) {
      alert('⚠️ Please enter a valid price!');
      return;
    }

    if (!matchData?.customerWhatsapp || matchData.customerWhatsapp === '—') {
      alert('⚠️ Customer WhatsApp number not available!');
      return;
    }

    const confirmMsg = `Send offer to customer?\n\nCustomer: ${matchData.customerName}\nProduct: ${matchData.product_req}\nOffer Price: ₹${offerPrice}\nVendor Price: ₹${Vendor_Price}`;

    if (!window.confirm(confirmMsg)) return;

    setSendingOffer(true);

    try {
      const response = await fetch(CONFIG.N8N_CUSTOMER_OFFER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchID: matchData.matchID,
          customerName: matchData.customerName,
          customerWhatsapp: matchData.customerWhatsapp,
          customerEmail: matchData.customerEmail,
          product: matchData.product_req,
          quantity: matchData.quantity,
          vendorName: matchData.vendorName,
          vendorPrice: Vendor_Price,
          offerPrice: offerPrice,
          availableQty: Available_Qty,
          canDeliver: Can_Deliver
        })
      });

      if (response.ok) {
        alert(`✅ Offer Sent Successfully!\n\nCustomer: ${matchData.customerName}\nOffer Price: ₹${offerPrice}\nSent to: ${matchData.customerWhatsapp}`);
        setOfferPrice('');
        onClose();
      } else {
        throw new Error('Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('❌ Failed to send offer. Please try again.');
    } finally {
      setSendingOffer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold">Vendor Response</h3>
              <p className="text-xs text-indigo-100">{matchData?.vendorName || 'Vendor Information'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
            <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              RFQ Request Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-600 block mb-1">Match ID</span>
                <span className="font-semibold text-gray-900">{safeValue(matchData?.matchID)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Customer</span>
                <span className="font-semibold text-gray-900">{safeValue(matchData?.customerName)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Product</span>
                <span className="font-semibold text-gray-900">{safeValue(matchData?.product_req)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Quantity Needed</span>
                <span className="font-semibold text-gray-900">{safeValue(matchData?.quantity)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Vendor</span>
                <span className="font-semibold text-gray-900">{safeValue(matchData?.vendorName)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block mb-1">Vendor Contact</span>
                <span className="font-semibold text-gray-900">{safeValue(matchData?.vendorContact)}</span>
              </div>
            </div>
          </div>


          {hasResponse ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border-2 ${Product_Available === 'YES'
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
                }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {Product_Available === 'YES' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-bold text-sm ${Product_Available === 'YES' ? 'text-green-700' : 'text-red-700'
                      }`}>
                      Product {Product_Available === 'YES' ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">{Response_Date}</span>
                </div>

                {Product_Available === 'YES' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Vendor Price</div>
                      <div className="text-xl font-bold text-green-600">
                        ₹{Vendor_Price}
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Available Qty</div>
                      <div className="text-xl font-bold text-indigo-600">
                        {Available_Qty}
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Can Deliver</div>
                      <div className={`text-base font-bold ${Can_Deliver === 'YES' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {Can_Deliver}
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Photo</div>
                      <div className={`text-base font-bold ${Photo_Received === 'YES' ? 'text-green-600' : 'text-gray-400'
                        }`}>
                        {Photo_Received === 'YES' ? '📸 Received' : 'Not Received'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Response Status</h4>
                <div className="space-y-2 text-sm">
                  {RFQ_ID !== '—' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">RFQ ID:</span>
                      <span className="font-semibold text-gray-900">{RFQ_ID}</span>
                    </div>
                  )}
                  {RFQ_Status !== '—' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">RFQ Status:</span>
                      <span className="font-semibold text-indigo-600">{RFQ_Status}</span>
                    </div>
                  )}
                  {Final_Status !== '—' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Product Status:</span>
                      <span className="font-semibold text-gray-900">{Final_Status}</span>
                    </div>
                  )}
                  {Vendor_Phone !== '—' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendor Phone:</span>
                      <span className="font-semibold text-gray-900">{Vendor_Phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {Product_Available === 'YES' && Vendor_Price !== '—' && (
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-indigo-200">
                  <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Send Offer to Customer
                  </h4>
                  <div className="bg-white p-4 rounded-lg border border-orange-200 mb-3">
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-gray-600">Vendor Price:</span>
                        <span className="ml-2 font-bold text-green-600">₹{Vendor_Price}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Customer:</span>
                        <span className="ml-2 font-bold text-gray-900">{safeValue(matchData?.customerName)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700">
                        Enter Your Offer Price (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                        <input
                          type="number"
                          value={offerPrice}
                          onChange={(e) => setOfferPrice(e.target.value)}
                          placeholder="Enter price..."
                          className="w-full pl-8 pr-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none text-sm font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendOffer}
                    disabled={sendingOffer || !offerPrice}
                    className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${sendingOffer || !offerPrice
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                      }`}
                  >
                    {sendingOffer ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending Offer...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Offer to Customer via WhatsApp
                      </>
                    )}
                  </button>
                  <p className="text-xs text-indigo-800 mt-2 text-center">
                    Offer will be sent to: {safeValue(matchData?.customerWhatsapp)}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-gray-700 mb-2">Awaiting Vendor Response</h4>
              <p className="text-sm text-gray-600">
                The vendor has been notified via WhatsApp. Response will appear here once received.
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

const CustomerDetailsModal = React.memo(({ selectedBuyer, onClose, onSendAllRFQ }) => {
  if (!selectedBuyer) return null;

  const {
    customerName,
    customerWhatsapp,
    customerEmail,
    product,
    totalQuantity,
    createdAt,
    matchingVendors
  } = selectedBuyer;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl border-2 border-indigo-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="sticky top-0 flex items-center justify-between p-4 md:p-6 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-lg md:text-xl font-bold">Customer Request Details</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="text-xs text-indigo-700 font-bold mb-2">Date & Time</div>
              <div className="text-sm font-semibold text-gray-900">{safeValue(createdAt)}</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="text-xs text-indigo-700 font-bold mb-2">Customer Name</div>
              <div className="text-sm font-semibold text-gray-900">{safeValue(customerName)}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border-2 border-green-300">
              <div className="text-xs text-green-700 font-bold mb-2 flex items-center">
                <Phone className="w-3 h-3 mr-1" />
                WhatsApp Number
              </div>
              <div className="text-sm font-semibold text-gray-900">{safeValue(customerWhatsapp)}</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="text-xs text-indigo-700 font-bold mb-2">Email</div>
              <div className="text-sm font-semibold text-gray-900 break-all">{safeValue(customerEmail)}</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 md:col-span-2">
              <div className="text-xs text-indigo-700 font-bold mb-2">Product Needed (Product_Req)</div>
              <div className="text-sm font-semibold text-gray-900">{safeValue(product)}</div>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="text-xs text-indigo-700 font-bold mb-2">Total Quantity Needed</div>
              <div className="text-sm font-semibold text-gray-900">{safeValue(totalQuantity)}</div>
            </div>
          </div>

          {matchingVendors && matchingVendors.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-orange-800">Send RFQ to All Vendors</h4>
                  <p className="text-xs text-orange-600 mt-1">
                    {matchingVendors.length} product-vendor match(es) available
                  </p>
                </div>
                <button
                  onClick={() => {
                    onSendAllRFQ(matchingVendors);
                    onClose();
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-bold flex items-center gap-2 shadow-lg"
                >
                  <Mail className="w-4 h-4" />
                  Send All RFQ
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});


// --- Main Component ---

export const MatchingSheet = () => {
  const [matchingData, setMatchingData] = useState([]);
  const [loadingMatching, setLoadingMatching] = useState(true);
  const [matchingError, setMatchingError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [rfqStatus, setRfqStatus] = useState({});
  const [newEntries, setNewEntries] = useState(new Set());
  const [vendorResponseModal, setVendorResponseModal] = useState({ isOpen: false, data: null, matchData: null });
  const [selectedVendors, setSelectedVendors] = useState({});

  // Data Fetching
  const fetchMatchingData = useCallback(async () => {
    if (!CONFIG.MATCHING_API_URL) {
      setMatchingError('Configuration Error: MATCHING_API_URL not set');
      setLoadingMatching(false);
      return;
    }

    setLoadingMatching(true);
    setMatchingError('');

    try {
      const response = await fetch(CONFIG.MATCHING_API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const data = await response.json();
      // FIXEnsure correct data extraction based on API response structure
      const newMatchingData = data?.data || data || []; 

      // ✅ FIX 1: Reverse data to show latest entry on top (descending order)
      const reversedData = newMatchingData.reverse();

      if (matchingData.length > 0 && reversedData.length > matchingData.length) {
        const newCount = reversedData.length - matchingData.length;
        const newIds = new Set();
        for (let i = 0; i < newCount; i++) {
          newIds.add(i); 
        }
        setNewEntries(newIds);
        setTimeout(() => setNewEntries(new Set()), 5000);
      }

      setMatchingData(reversedData);
      setLoadingMatching(false);
    } catch (err) {
      console.error(err);
      setMatchingError('Failed to load data. Ensure API is running and URL is correct. Error: ' + err.message);
      setLoadingMatching(false);
    }
  }, [matchingData.length]);

  useEffect(() => {
    fetchMatchingData();
    const interval = setInterval(fetchMatchingData, 30000);
    return () => clearInterval(interval);
  }, [fetchMatchingData]);


  // --- RFQ Logic ---
  const sendRFQ = async (vendor, rfqKey) => {
    if (!CONFIG.N8N_WEBHOOK_URL) {
      alert('⚠️ Configuration Error: Webhook URL not configured!');
      return;
    }

    const vendorContact = safeValue(vendor.Potential_Buyer_1_Contact_Detail);
    if (vendorContact === '—' || vendorContact === 'Null') {
      alert('⚠️ Vendor contact number not available!');
      return;
    }

    // FIX: Extract Vendor Item ID
    const vendorItemId = safeValue(vendor.Id);
    if (vendorItemId === '—' || vendorItemId === 'Null') {
      alert('⚠️ Vendor Item ID not available!');
      return;
    }


    setRfqStatus(prev => ({ ...prev, [rfqKey]: 'sending' }));

    try {
      const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchID: vendor.matchId,
          customerId: vendor.customerId,
          customerName: vendor.customerName,
          customerEmail: vendor.customerEmail,
          customerWhatsapp: vendor.customerWhatsapp,
          productType: vendor.productNeeded,
          quantity: vendor.totalQuantity,

          // ✅ NEW: Vendor Item ID added here
          vendorItemId: vendorItemId, 

          vendorContact: vendorContact,
          vendorEmail: safeValue(vendor.Potential_Buyer_1_Email),
          vendorName: safeValue(vendor.Potential_Buyer_1),
          itemDescription: safeValue(vendor.Item_Description),
          availableQty: safeValue(vendor.Quantity),
          price: safeValue(vendor.Unit_Price)
        })
      });

      if (response.ok) {
        setRfqStatus(prev => ({ ...prev, [rfqKey]: 'sent' }));
        alert(`✅ RFQ Sent Successfully!\n\nMatch ID: ${vendor.matchId}\nVendor Item ID: ${vendorItemId}\nTo: ${vendor.Potential_Buyer_1}\nContact: ${vendorContact}\n\nProduct: ${vendor.Item_Description}\nQuantity: ${vendor.Quantity}`);

        setTimeout(() => {
          setRfqStatus(prev => ({ ...prev, [rfqKey]: null }));
        }, 3000);
      } else {
        throw new Error('Failed to send RFQ');
      }
    } catch (error) {
      console.error('Error sending RFQ:', error);
      alert('❌ Failed to send RFQ. Please try again.');
      setRfqStatus(prev => ({ ...prev, [rfqKey]: null }));
    }
  };

  const sendAllRFQ = async (vendors) => {
    if (!CONFIG.N8N_WEBHOOK_URL) {
      alert('⚠️ Configuration Error: Webhook URL not configured!');
      return;
    }

    if (vendors.length === 0) {
      alert('⚠️ No vendors found!');
      return;
    }

    const firstVendor = vendors[0];
    const confirmMsg = `Send RFQ to ${vendors.length} vendor(s)?\n\nCustomer: ${firstVendor.customerName}\nProduct: ${firstVendor.productNeeded}\nTotal Qty: ${firstVendor.totalQuantity}`;
    if (!window.confirm(confirmMsg)) return;

    let successCount = 0;
    let failCount = 0;

    for (const vendor of vendors) {
      const vendorContact = safeValue(vendor.Potential_Buyer_1_Contact_Detail);
      const vendorItemId = safeValue(vendor.Id); // FIX: Extract Vendor Item ID here too
      
      if (vendorContact === '—' || vendorContact === 'Null' || vendorItemId === '—' || vendorItemId === 'Null') {
        failCount++;
        continue;
      }

      const rfqKey = `${vendor.matchId}-${vendor.Id}`;
      setRfqStatus(prev => ({ ...prev, [rfqKey]: 'sending' }));

      try {
        const response = await fetch(CONFIG.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchID: vendor.matchId,
            customerId: vendor.customerId,
            customerName: vendor.customerName,
            customerEmail: vendor.customerEmail,
            customerWhatsapp: vendor.customerWhatsapp,
            productType: vendor.productNeeded,
            quantity: vendor.totalQuantity,

            // ✅ NEW: Vendor Item ID added here
            vendorItemId: vendorItemId, 

            vendorContact: vendorContact,
            vendorEmail: safeValue(vendor.Potential_Buyer_1_Email),
            vendorName: safeValue(vendor.Potential_Buyer_1),
            itemDescription: safeValue(vendor.Item_Description),
            availableQty: safeValue(vendor.Quantity),
            price: safeValue(vendor.Unit_Price)
          })
        });

        if (response.ok) {
          successCount++;
          setRfqStatus(prev => ({ ...prev, [rfqKey]: 'sent' }));
        } else {
          failCount++;
          setRfqStatus(prev => ({ ...prev, [rfqKey]: null }));
        }
      } catch (error) {
        console.error('Error sending RFQ to:', vendor.Potential_Buyer_1, error);
        failCount++;
        setRfqStatus(prev => ({ ...prev, [rfqKey]: null }));
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    alert(`✅ RFQ Sending Complete!\n\n👍 Success: ${successCount}\n👎 Failed: ${failCount}`);
    setTimeout(() => setRfqStatus({}), 3000);
  };

  const sendSelectedRFQ = async (vendors) => {
    await sendAllRFQ(vendors);
    setSelectedVendors({});
  };

  const handleViewVendorResponse = useCallback((vendor) => {
    // Mock response data as the new API may not return live responses in the match payload
    const mockVendorResponse = {
      Product_Available: vendor.Vendor_Price ? 'YES' : null,
      Vendor_Price: vendor.Vendor_Price || null,
      Available_Qty: vendor.Quantity || null,
      Can_Deliver: vendor.Quantity > 0 ? 'YES' : null,
      Final_Status: vendor.Vendor_Price ? 'Matched' : 'Awaiting',
      Vendor_Phone: safeValue(vendor.Potential_Buyer_1_Contact_Detail),
    };

    const matchData = {
      vendorName: safeValue(vendor.Potential_Buyer_1),
      product_req: safeValue(vendor.productNeeded),
      model: safeValue(vendor.Item_Description),
      quantity: safeValue(vendor.totalQuantity),
      vendorContact: safeValue(vendor.Potential_Buyer_1_Contact_Detail),
      matchID: safeValue(vendor.matchId),
      customerName: safeValue(vendor.customerName),
      customerEmail: safeValue(vendor.customerEmail),
      customerWhatsapp: safeValue(vendor.customerWhatsapp)
    };

    setVendorResponseModal({
      isOpen: true,
      data: mockVendorResponse,
      matchData: matchData
    });
  }, []);


  // Grouping and Filtering (Unchanged) 
  const groupedMatchingData = useMemo(() => {
    return matchingData.map(request => {
      const customerName = safeValue(request.customerName);
      const customerWhatsapp = safeValue(request.customerNumber);
      const productNeeded = safeValue(request.product_req) || 'N/A';
      const totalQuantity = safeValue(request.qty);

      const vendors = (request.products || []).map(productMatch => ({
        ...productMatch,
        matchId: request.matchId,
        customerId: request.customerId,
        customerName: customerName,
        customerEmail: safeValue(request.customerEmail),
        customerWhatsapp: customerWhatsapp,
        productNeeded: productNeeded,
        totalQuantity: totalQuantity,
        mockVendorResponse: {
          Product_Available: productMatch.Vendor_Price ? 'YES' : null,
          Vendor_Price: productMatch.Vendor_Price || null,
          Available_Qty: productMatch.Quantity || null,
          Can_Deliver: productMatch.Quantity > 0 ? 'YES' : null,
          Final_Status: productMatch.Vendor_Price ? 'Matched' : 'Awaiting',
          Vendor_Phone: safeValue(productMatch.Potential_Buyer_1_Contact_Detail),
        }
      }));

      return {
        mainRow: {
          Match_ID: safeValue(request.matchId),
          Customer_Name: customerName,
          Whatsapp_Number: customerWhatsapp,
          Product_Needed: productNeeded,
          Qty_Needed: totalQuantity,
          'RFQ Status': '0/0',
        },
        vendors: vendors,
        customerName: customerName,
        customerEmail: safeValue(request.customerEmail),
        customerWhatsapp: customerWhatsapp,
        productNeeded: productNeeded,
        totalQuantity: totalQuantity,
        createdAt: safeValue(request.createdAt)
      };
    });
  }, [matchingData]);

  const filteredMatching = useMemo(() =>
    groupedMatchingData.filter(item =>
      (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.productNeeded || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.mainRow.Match_ID || '').toString().includes(searchTerm.toLowerCase()) ||
      item.vendors.some(v => (v.Potential_Buyer_1 || '').toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [groupedMatchingData, searchTerm]
  );

  const getRFQStatusForGroup = useCallback((vendors) => {
    const totalVendors = vendors.length;
    const respondedVendors = vendors.filter(v =>
      v.mockVendorResponse?.Product_Available === 'YES' || v.mockVendorResponse?.Vendor_Price
    ).length;
    return { total: totalVendors, responded: respondedVendors };
  }, []);

  const matchingPrimaryCols = [
    'Match_ID',
    'Customer_Name',
    'Whatsapp_Number',
    'Product_Needed',
    'Qty_Needed',
    'RFQ Status'
  ];


  // --- Render Logic ---
  if (loadingMatching && matchingData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-indigo-700 text-lg font-medium">Loading Matching Data...</p>
        </div>
      </div>
    );
  }

  if (matchingError) {
    return (
      <div className="flex-1 p-4 flex items-start justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg border-2 border-red-200 w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-red-600 text-xl font-bold mb-3">Error Loading Matching Data</h2>
            <p className="text-gray-600 mb-4">{matchingError}</p>
            <button
              onClick={fetchMatchingData}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-3 bg-white border-b border-indigo-100">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer name, product, or Match ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white rounded-xl shadow-xl border border-indigo-100 h-full flex flex-col">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-3 text-white rounded-t-xl">
            <h2 className="text-base font-bold">Matching Requests Data</h2>
            <p className="text-indigo-100 text-xs mt-1">
              {filteredMatching.length} request(s) | View vendors and send RFQ via WhatsApp
            </p>
          </div>

          <MatchingTable
            filteredMatching={filteredMatching}
            matchingPrimaryCols={matchingPrimaryCols}
            getRFQStatusForGroup={getRFQStatusForGroup}
            expandedRow={expandedRow}
            setExpandedRow={setExpandedRow}
            setSelectedBuyer={setSelectedBuyer}
            selectedVendors={selectedVendors}
            setSelectedVendors={setSelectedVendors}
            sendRFQ={sendRFQ}
            sendAllRFQ={sendAllRFQ}
            sendSelectedRFQ={sendSelectedRFQ}
            rfqStatus={rfqStatus}
            handleViewVendorResponse={handleViewVendorResponse}
            newEntries={newEntries}
          />
        </div>
      </div>

      <CustomerDetailsModal
        selectedBuyer={selectedBuyer}
        onClose={() => setSelectedBuyer(null)}
        onSendAllRFQ={sendAllRFQ}
      />

      <VendorResponseModal
        isOpen={vendorResponseModal.isOpen}
        onClose={() => setVendorResponseModal({ isOpen: false, data: null, matchData: null })}
        vendorData={vendorResponseModal.data}
        matchData={vendorResponseModal.matchData}
      />
    </>
  );
};

export default MatchingSheet;
