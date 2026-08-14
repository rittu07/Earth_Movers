import React, { useState } from 'react';
import { X, MessageSquare, ExternalLink, Check, Copy, Phone } from 'lucide-react';
import { openWhatsAppChat } from '../../utils/whatsapp';

const WhatsAppModal = ({ isOpen, onClose, phone, customerName, messageText }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleOpenWhatsApp = () => {
    openWhatsAppChat(phone, messageText);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-emerald-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">WhatsApp Notification 💬</h2>
              <p className="text-xs text-emerald-100 font-semibold">
                Customer: {customerName || 'Valued Customer'} ({phone || 'No Phone'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Preview */}
        <div className="p-6 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Message Preview</span>
            <span className="flex items-center gap-1 text-emerald-600">
              <Phone className="w-3.5 h-3.5" /> +91 {phone}
            </span>
          </div>

          {/* WhatsApp Chat Bubble */}
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-slate-900 font-sans text-xs leading-relaxed whitespace-pre-wrap shadow-xs relative">
            {messageText}
            <div className="mt-3 pt-2 border-t border-emerald-200/60 flex justify-end text-[10px] font-bold text-emerald-700">
              Loganathan Earth Movers • Just now
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-white transition-colors flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            <button
              onClick={handleOpenWhatsApp}
              className="flex-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" /> Send via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;
