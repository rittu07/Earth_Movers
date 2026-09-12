import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldAlert,
  PlusCircle,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Upload,
  Paperclip,
  Trash2,
  Edit3,
  X,
  Eye,
  FileText,
  ShieldCheck,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { formatJCBOverdueWhatsApp, openWhatsAppChat } from '../../utils/whatsapp';
import { loadSyncedCollection, saveSyncedCollection } from '../../db/syncedStorage';
import { isSafeDocumentUrl, validateAttachmentFile } from '../../utils/documentSecurity';

const initialJcbVehiclesData = [
  {
    id: 'jcb-1',
    code: 'JCB 1',
    regNo: '',
    model: 'JCB 3DX',
    serialNo: 'JCB3DX-2024-98421',
    totalHours: 4528,
    documents: [
      {
        id: 'doc-1-1',
        type: 'Insurance',
        docNo: 'INS-987654321',
        expiryDate: '2026-10-15',
        fileName: 'insurance_policy_jcb1.pdf'
      },
      {
        id: 'doc-1-2',
        type: 'Warranty',
        docNo: 'WAR-3DX-551',
        expiryDate: '2026-11-30',
        fileName: 'jcb_warranty_certificate.pdf'
      },
      {
        id: 'doc-1-3',
        type: 'Fitness/Permit',
        docNo: 'FIT-2026-99',
        expiryDate: '2026-09-20',
        fileName: 'fitness_permit_jcb1.pdf'
      },
      {
        id: 'doc-1-4',
        type: 'Registration Certificate',
        docNo: 'RC-JCB1',
        expiryDate: 'Lifetime',
        fileName: 'rc_jcb1.pdf'
      },
      {
        id: 'doc-1-5',
        type: 'Pollution Certificate',
        docNo: 'PUC-8821',
        expiryDate: '2026-12-10',
        fileName: 'puc_certificate_jcb1.pdf'
      }
    ]
  },
  {
    id: 'jcb-2',
    code: 'JCB 2',
    regNo: '',
    model: 'JCB 3DX Super',
    serialNo: 'JCB3DX-2024-98422',
    totalHours: 4400,
    documents: [
      {
        id: 'doc-2-1',
        type: 'Registration Certificate',
        docNo: 'RC-JCB2',
        expiryDate: 'Lifetime',
        fileName: 'rc_jcb2.pdf'
      },
      {
        id: 'doc-2-2',
        type: 'Insurance',
        docNo: 'INS-987654322',
        expiryDate: '2026-09-18',
        fileName: 'insurance_policy_jcb2.pdf'
      },
      {
        id: 'doc-2-3',
        type: 'Warranty',
        docNo: 'WAR-3DX-552',
        expiryDate: '2027-01-15',
        fileName: 'warranty_jcb2.pdf'
      },
      {
        id: 'doc-2-4',
        type: 'Fitness/Permit',
        docNo: 'FIT-2026-100',
        expiryDate: '2026-10-30',
        fileName: 'fitness_jcb2.pdf'
      },
      {
        id: 'doc-2-5',
        type: 'Pollution Certificate',
        docNo: 'PUC-8822',
        expiryDate: '2026-11-05',
        fileName: 'puc_jcb2.pdf'
      }
    ]
  },
  {
    id: 'jcb-3',
    code: 'JCB 3',
    regNo: '',
    model: 'JCB 3DX Eco',
    serialNo: 'JCB3DX-2023-77109',
    totalHours: 4200,
    documents: [
      {
        id: 'doc-3-1',
        type: 'Registration Certificate',
        docNo: 'RC-JCB3',
        expiryDate: 'Lifetime',
        fileName: 'rc_jcb3.pdf'
      },
      {
        id: 'doc-3-2',
        type: 'Insurance',
        docNo: 'INS-987654323',
        expiryDate: '2026-08-30',
        fileName: 'insurance_jcb3.pdf'
      },
      {
        id: 'doc-3-3',
        type: 'Warranty',
        docNo: 'WAR-3DX-553',
        expiryDate: '2026-12-20',
        fileName: 'warranty_jcb3.pdf'
      },
      {
        id: 'doc-3-4',
        type: 'Fitness/Permit',
        docNo: 'FIT-2026-101',
        expiryDate: '2026-09-12',
        fileName: 'fitness_jcb3.pdf'
      },
      {
        id: 'doc-3-5',
        type: 'Pollution Certificate',
        docNo: 'PUC-8823',
        expiryDate: '2026-10-10',
        fileName: 'puc_jcb3.pdf'
      }
    ]
  },
  {
    id: 'jcb-4',
    code: 'JCB 4',
    regNo: '',
    model: 'JCB 3DX Plus',
    serialNo: 'JCB3DX-2024-11029',
    totalHours: 3900,
    documents: [
      { id: 'doc-4-1', type: 'Insurance', docNo: 'INS-449102', expiryDate: '2026-11-12', fileName: 'ins_jcb4.pdf' },
      { id: 'doc-4-2', type: 'Warranty', docNo: 'WAR-449102', expiryDate: '2027-03-20', fileName: 'war_jcb4.pdf' },
      { id: 'doc-4-3', type: 'Fitness/Permit', docNo: 'FIT-449102', expiryDate: '2026-10-18', fileName: 'fit_jcb4.pdf' },
      { id: 'doc-4-4', type: 'Registration Certificate', docNo: 'RC-JCB4', expiryDate: 'Lifetime', fileName: 'rc_jcb4.pdf' },
      { id: 'doc-4-5', type: 'Pollution Certificate', docNo: 'PUC-449102', expiryDate: '2026-12-01', fileName: 'puc_jcb4.pdf' }
    ]
  },
  {
    id: 'jcb-5',
    code: 'JCB 5',
    regNo: '',
    model: 'JCB 3DX',
    serialNo: 'JCB3DX-2023-55912',
    totalHours: 3200,
    documents: [
      { id: 'doc-5-1', type: 'Insurance', docNo: 'INS-559102', expiryDate: '2026-10-05', fileName: 'ins_jcb5.pdf' },
      { id: 'doc-5-2', type: 'Warranty', docNo: 'WAR-559102', expiryDate: '2026-11-15', fileName: 'war_jcb5.pdf' },
      { id: 'doc-5-3', type: 'Fitness/Permit', docNo: 'FIT-559102', expiryDate: '2026-09-25', fileName: 'fit_jcb5.pdf' }
    ]
  },
  {
    id: 'jcb-6',
    code: 'JCB 6',
    regNo: '',
    model: 'JCB 3DX Xtra',
    serialNo: 'JCB3DX-2024-88410',
    totalHours: 2800,
    documents: [
      { id: 'doc-6-1', type: 'Insurance', docNo: 'INS-669102', expiryDate: '2026-12-15', fileName: 'ins_jcb6.pdf' },
      { id: 'doc-6-2', type: 'Fitness/Permit', docNo: 'FIT-669102', expiryDate: '2026-11-20', fileName: 'fit_jcb6.pdf' }
    ]
  }
];

// Helper to calculate days remaining from current date (2026-09-05)
const calculateDaysRemaining = (expiryDateStr) => {
  if (!expiryDateStr || expiryDateStr === 'Lifetime' || expiryDateStr === '—') {
    return { daysLeft: null, text: '—', status: 'valid' };
  }

  const currentDate = new Date('2026-09-05T00:00:00');
  const expiryDate = new Date(expiryDateStr);

  if (isNaN(expiryDate.getTime())) {
    return { daysLeft: null, text: expiryDateStr, status: 'valid' };
  }

  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return { daysLeft, text: `Expired (${Math.abs(daysLeft)} days ago)`, status: 'expired' };
  } else if (daysLeft <= 30) {
    return { daysLeft, text: `${daysLeft} days left`, status: 'due' };
  } else {
    return { daysLeft, text: `${daysLeft} days left`, status: 'valid' };
  }
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr || dateStr === 'Lifetime') return 'Lifetime';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const JCBDocumentTracker = () => {
  const [vehicles, setVehicles] = useState(initialJcbVehiclesData);
  const [storageReady, setStorageReady] = useState(false);

  const [selectedJcbId, setSelectedJcbId] = useState('jcb-1');

  useEffect(() => {
    loadSyncedCollection('jcbDocuments', 'jcb_vehicle_documents_data').then((saved) => {
      if (saved.length) setVehicles(saved);
      setStorageReady(true);
    }).catch(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    if (storageReady) saveSyncedCollection('jcbDocuments', 'jcbDocument', vehicles).catch(() => {});
  }, [vehicles, storageReady]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedJcbId) || vehicles[0];

  // Modals
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);

  // Add Document Form State
  const [docType, setDocType] = useState('Insurance');
  const [docNo, setDocNo] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docFileData, setDocFileData] = useState('');

  // Edit Vehicle Info Form State
  const [editRegNo, setEditRegNo] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editSerialNo, setEditSerialNo] = useState('');

  const openAddDocModal = () => {
    setDocType('Insurance');
    setDocNo('');
    setDocExpiryDate('2026-10-15');
    setDocFileName('');
    setDocFileData('');
    setIsAddDocOpen(true);
  };

  const openEditVehicleModal = () => {
    setEditRegNo(selectedVehicle.regNo);
    setEditModel(selectedVehicle.model || 'JCB 3DX');
    setEditSerialNo(selectedVehicle.serialNo || 'JCB3DX-2024-98421');
    setIsEditVehicleOpen(true);
  };

  const handleAddDocSubmit = (e) => {
    e.preventDefault();
    const newDoc = {
      id: `doc-${Date.now()}`,
      type: docType,
      docNo: docNo.toUpperCase().trim() || 'XXXXXXX',
      expiryDate: docExpiryDate || 'Lifetime',
      fileName: docFileName || `${docType.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileData: docFileData || ''
    };

    setVehicles(
      vehicles.map((v) => {
        if (v.id !== selectedVehicle.id) return v;
        return {
          ...v,
          documents: [newDoc, ...(v.documents || [])]
        };
      })
    );

    setIsAddDocOpen(false);
  };

  const handleEditVehicleSubmit = (e) => {
    e.preventDefault();
    setVehicles(
      vehicles.map((v) => {
        if (v.id !== selectedVehicle.id) return v;
        return {
          ...v,
          regNo: editRegNo.toUpperCase().trim(),
          model: editModel.trim(),
          serialNo: editSerialNo.toUpperCase().trim()
        };
      })
    );
    setIsEditVehicleOpen(false);
  };

  const handleDeleteDoc = (docId) => {
    setVehicles(
      vehicles.map((v) => {
        if (v.id !== selectedVehicle.id) return v;
        return {
          ...v,
          documents: v.documents.filter((d) => d.id !== docId)
        };
      })
    );
  };

  // Check overall document status alerts for current machine
  const dueDocuments = (selectedVehicle.documents || []).map((doc) => ({
    ...doc,
    daysInfo: calculateDaysRemaining(doc.expiryDate)
  }));

  const urgentAlerts = dueDocuments.filter((d) => d.daysInfo.status === 'due' || d.daysInfo.status === 'expired');

  const renderStatusBadge = (statusObj) => {
    if (statusObj.status === 'expired') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 tracking-wider shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
          Expired
        </span>
      );
    }
    if (statusObj.status === 'due') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 tracking-wider shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          Due Soon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 tracking-wider shadow-xs">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
        🟢 Valid
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans text-slate-900">
      
      {/* SEPARATE PAGE TAB SELECTOR FOR EACH JCB MACHINE */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none flex-1">
          {vehicles.map((v) => {
            const isSelected = v.id === selectedJcbId;
            const hasUrgent = (v.documents || []).some(d => {
              const info = calculateDaysRemaining(d.expiryDate);
              return info.status === 'due' || info.status === 'expired';
            });

            return (
              <button
                key={v.id}
                onClick={() => setSelectedJcbId(v.id)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30 scale-102'
                    : 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Truck className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-amber-600'}`} />
                <span className="font-mono">{v.code} Page</span>
                {hasUrgent && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" title="Document Expiring Soon!" />
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => openAddDocModal()}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl text-sm flex items-center gap-1.5 shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0 font-mono"
        >
          <PlusCircle className="w-4.5 h-4.5" /> + Add Document
        </button>
      </div>

      {/* DEDICATED JCB VEHICLE PAGE CARD */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        
        {/* Machine Header Details (Registration No, Model, Serial No) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="bg-amber-600 text-white font-black text-sm px-4 py-1.5 rounded-full uppercase tracking-wider shadow-xs">
                {selectedVehicle.code}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 pt-1 font-mono">
              <div className="bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold">Model: </span>
                <span className="text-slate-900 font-black">{selectedVehicle.model || 'JCB 3DX'}</span>
              </div>

              <div className="bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-semibold">Serial No: </span>
                <span className="text-slate-900 font-black">{selectedVehicle.serialNo || 'JCB3DX-2024-98421'}</span>
              </div>

              <div className="bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 text-amber-800">
                <span className="text-amber-700 font-semibold">Hour Meter: </span>
                <span className="font-black">{selectedVehicle.totalHours?.toLocaleString()} hrs</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => openEditVehicleModal()}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-black text-sm rounded-2xl flex items-center gap-2 transition-all cursor-pointer font-mono"
            >
              <Edit3 className="w-4 h-4 text-amber-600" /> Edit Vehicle Info
            </button>

            <button
              onClick={() => {
                const phone = prompt('Enter WhatsApp Number for Document Reminder:', '9876543210');
                if (phone) {
                  const alertMsg = `📄 *JCB DOCUMENT EXPIRY NOTICE*\n\nVehicle: ${selectedVehicle.code} (${selectedVehicle.regNo})\nModel: ${selectedVehicle.model}\nSerial No: ${selectedVehicle.serialNo}\n\n${dueDocuments.map(d => `• ${d.type}: Expiry ${d.expiryDate} (${d.daysInfo.text})`).join('\n')}`;
                  openWhatsAppChat(phone, alertMsg);
                }
              }}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              💬 WhatsApp Alert 📲
            </button>
          </div>
        </div>

        {/* URGENT EXPIRY ALERT BANNER */}
        {urgentAlerts.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 animate-bounce" />
              <div>
                <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider font-mono">
                  ⚠️ Action Required for {selectedVehicle.code} Documents
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 font-bold mt-0.5">
                  {urgentAlerts.map(a => `${a.type} (${a.daysInfo.text})`).join(' • ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => openAddDocModal()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer shrink-0 font-mono"
            >
              Renew / Update
            </button>
          </div>
        )}

        {/* DOCUMENT EXPIRY TABLE (Matching requested format) */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-mono font-black text-slate-900 uppercase tracking-wider flex items-center gap-2.5">
              <FileCheck className="w-5 h-5 text-amber-600" />
              DOCUMENT EXPIRY
            </h3>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-600 bg-slate-100 px-3.5 py-1 rounded-full border border-slate-200">
              {selectedVehicle.code} Document Registry
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 uppercase font-black tracking-wider text-xs sm:text-sm border-b border-slate-200 font-mono">
                  <th className="py-4 px-6">Document</th>
                  <th className="py-4 px-6">Document / Policy No</th>
                  <th className="py-4 px-6">Expiry Date</th>
                  <th className="py-4 px-6">Days Remaining</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-xs sm:text-sm font-mono">
                {dueDocuments.length > 0 ? (
                  dueDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-slate-900 font-black flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{doc.type}</span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{doc.docNo || 'XXXXXXX'}</td>
                      <td className="py-4 px-6 text-slate-900 font-black">
                        {formatDisplayDate(doc.expiryDate)}
                      </td>
                      <td className="py-4 px-6">
                        {doc.daysInfo.status === 'expired' ? (
                          <span className="text-rose-700 font-black">{doc.daysInfo.text}</span>
                        ) : doc.daysInfo.status === 'due' ? (
                          <span className="text-amber-800 font-black">{doc.daysInfo.text}</span>
                        ) : (
                          <span className="text-slate-700 font-bold">{doc.daysInfo.text}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">{renderStatusBadge(doc.daysInfo)}</td>
                      <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewingDoc(doc)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-amber-800 font-black rounded-xl text-xs sm:text-sm transition-all cursor-pointer border border-slate-300"
                        >
                          [View File]
                        </button>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 text-sm">
                      No document records added for {selectedVehicle.code} yet. Click <span className="text-amber-700 font-black">[ + Add Document ]</span> to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ADD / RENEW DOCUMENT MODAL */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-6 h-6 text-amber-600" />
                  Add Document Expiry: {selectedVehicle.code}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-0.5">
                  Record vehicle insurance, warranty, fitness, permit & RC certificates
                </p>
              </div>
              <button
                onClick={() => setIsAddDocOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocSubmit} className="space-y-4 text-xs sm:text-sm font-black">
              <div>
                <label className="block text-slate-700 mb-1.5 font-mono">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-base focus:outline-hidden focus:border-amber-600 focus:bg-white cursor-pointer font-mono"
                >
                  <option value="Insurance">Insurance</option>
                  <option value="Warranty">Warranty</option>
                  <option value="Fitness/Permit">Fitness / Permit Certificate</option>
                  <option value="Registration Certificate">Registration Certificate (RC)</option>
                  <option value="Pollution Certificate">Pollution Certificate (PUC)</option>
                  <option value="Road Tax">Road Tax</option>
                  <option value="Permit">State Permit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-mono">Document / Policy Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INS-987654321"
                  value={docNo}
                  onChange={(e) => setDocNo(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-base focus:outline-hidden focus:border-amber-600 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-mono">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={docExpiryDate}
                  onChange={(e) => setDocExpiryDate(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-mono text-slate-900 text-base focus:outline-hidden focus:border-amber-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 font-mono">Upload Attachment / Scan</label>
                <label className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl font-black text-amber-700 text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all font-mono">
                  <Upload className="w-5 h-5" />
                  <span>{docFileName ? `[ File: ${docFileName} ]` : '[ Upload PDF / Photo ]'}</span>
                         <input
                           type="file"
                            accept="application/pdf,image/jpeg,image/png,image/webp"
                           className="hidden"
                           onChange={(e) => {
                             if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const validationError = validateAttachmentFile(file);
                                if (validationError) {
                                  setDocFileData('');
                                  window.alert(validationError);
                                  return;
                                }
                                setDocFileName(file.name);
                               const reader = new FileReader();
                               reader.onload = () => setDocFileData(String(reader.result || ''));
                               reader.readAsDataURL(file);
                             }
                           }}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200 font-mono">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm sm:text-base rounded-2xl cursor-pointer transition-all"
                >
                  [Cancel]
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                >
                  [Save Document]
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE INFO MODAL */}
      {isEditVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-600" />
                Edit {selectedVehicle.code} Profile
              </h3>
              <button
                onClick={() => setIsEditVehicleOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditVehicleSubmit} className="space-y-4 text-xs sm:text-sm font-black">
              <div>
                <label className="block text-slate-800 mb-1.5">Registration Number</label>
                <input
                  type="text"
                  required
                  value={editRegNo}
                  onChange={(e) => setEditRegNo(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-base font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-800 mb-1.5">Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JCB 3DX"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-base font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-800 mb-1.5">Serial Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JCB3DX-2024-98421"
                  value={editSerialNo}
                  onChange={(e) => setEditSerialNo(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-2xl font-black text-slate-900 text-base font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 font-mono">
                <button
                  type="button"
                  onClick={() => setIsEditVehicleOpen(false)}
                  className="px-5 py-3 bg-slate-100 text-slate-800 font-black rounded-2xl cursor-pointer hover:bg-slate-200 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-md shadow-amber-600/20 cursor-pointer text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DOCUMENT ATTACHMENT MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5 font-mono">
                <span className="px-3 py-1 bg-amber-600 text-white font-black text-xs sm:text-sm rounded-full">
                  {selectedVehicle.code}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {viewingDoc.type} Details
                </h3>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-bold">Status:</span>
                  <span>{renderStatusBadge(calculateDaysRemaining(viewingDoc.expiryDate))}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Document Number:</span>
                  <span className="text-slate-900 font-black">{viewingDoc.docNo || 'XXXXXXX'}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Expiry Date:</span>
                  <span className="text-slate-900 font-black">{formatDisplayDate(viewingDoc.expiryDate)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-600 font-bold">Days Remaining:</span>
                  <span className="text-amber-800 font-black">{calculateDaysRemaining(viewingDoc.expiryDate).text}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-2.5 border border-slate-200">
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-600 font-bold">Attached Scan File:</span>
                    {isSafeDocumentUrl(viewingDoc.fileData) ? (
                     <a
                       href={viewingDoc.fileData}
                       target="_blank"
                       rel="noreferrer"
                       className="text-xs sm:text-sm text-amber-700 font-black underline cursor-pointer flex items-center gap-1"
                     >
                       <Eye className="w-4 h-4" /> View Attachment
                     </a>
                   ) : (
                     <span className="text-xs sm:text-sm text-slate-500 font-black flex items-center gap-1">
                       <Paperclip className="w-4 h-4" /> {viewingDoc.fileName || 'No file data saved'}
                     </span>
                   )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs sm:text-sm rounded-xl cursor-pointer font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default JCBDocumentTracker;
