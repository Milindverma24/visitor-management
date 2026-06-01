import React from "react";
import QRCode from "react-qr-code";
import { Card } from "./ui/Card";

interface EnterprisePassProps {
  visit: any;
  qrCodeUrl?: string;
  photoUrl?: string;
}

export const EnterprisePass: React.FC<EnterprisePassProps> = ({ visit, photoUrl }) => {
  if (!visit) return null;

  return (
    <Card 
      className="w-full max-w-3xl mx-auto overflow-hidden border-2 border-black shadow-xl text-black font-sans print:shadow-none print:border-none print:w-full print:max-w-none"
      style={{ backgroundColor: "#ffeb3b", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <div className="p-6 flex flex-col h-full min-h-[450px]">
        {/* Header */}
        <div className="flex items-center justify-center gap-4 border-b-2 border-black pb-3 mb-6">
          <img src="/uploads/company_logo.png" alt="IGL" className="h-12 w-auto object-contain print:h-10" />
          <div className="text-center font-bold text-xl sm:text-2xl tracking-wide uppercase">
            India Glycols Limited - Kashipur
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          {/* Left Details */}
          <div className="flex-1 text-sm sm:text-base space-y-3 font-medium">
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Card ID</span>
              <span>: {visit.cardId}</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Entry Date/Time</span>
              <span>: {visit.createdAt ? visit.createdAt.replace('T', ' ').substring(0, 16) : new Date().toLocaleString()}</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Name</span>
              <span className="uppercase">: {visit.title || ''} {visit.visitorName} ({visit.category || 'VISITOR'})</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Phone</span>
              <span>
                : {visit.phone} 
                <span className="ml-8 font-semibold">Mob Token:</span> {visit.mobileTokenNo || 'N/A'}
              </span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Address</span>
              <span>: {visit.address || 'N/A'}</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Accessories</span>
              <span>: {visit.accessories || 'None'}</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Purpose</span>
              <span>
                : {visit.purpose}
                <span className="ml-8 font-semibold">Destination:</span> {visit.upTo || visit.department || 'Plant'}
              </span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>To Meet</span>
              <span>: {visit.hostEmployee}</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Valid UpTo</span>
              <span>: {visit.validUpTo ? visit.validUpTo.replace('T', ' ').substring(0, 16) : 'N/A'}</span>
            </div>
            
            <div className="grid grid-cols-[140px_1fr] items-start">
              <span>Accmp by</span>
              <span>
                : {visit.accompaniedByCount || 0}
                <span className="ml-8 font-semibold">Approved:</span> YES
              </span>
            </div>
          </div>
          
          {/* Right Photo & QR Code */}
          <div className="flex flex-col gap-4 self-start shrink-0">
            {/* Photo Box */}
            <div className="w-40 h-40 border-2 border-black flex items-center justify-center bg-white shadow-sm overflow-hidden">
              {photoUrl ? (
                <img src={photoUrl} alt="Visitor" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 font-semibold tracking-widest text-sm">PHOTO</div>
              )}
            </div>
            
            {/* QR Code Box */}
            <div className="w-40 h-40 border-2 border-black bg-white p-2 flex items-center justify-center shadow-sm">
              <QRCode 
                value={visit.cardId || `VISITOR-${visit.id}`} 
                size={140}
                level="M"
                viewBox={`0 0 140 140`}
              />
            </div>
          </div>
        </div>

        {/* Notes & Signatures */}
        <div className="mt-auto pt-4 border-t-2 border-black">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {/* Notes */}
            <div className="text-xs max-w-[60%] leading-tight font-medium">
              <span className="font-bold underline">Note:</span>
              <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                <li>Please return the pass before leaving.</li>
                <li>In case of emergency please call reception at "8" extn.</li>
                <li>I am Entering in this plant at my own risk.</li>
                <li>It has been told where to use the mobile phone and where not to use it.</li>
              </ol>
            </div>

            {/* Signatures */}
            <div className="flex-1 flex items-end justify-between text-sm font-bold pb-2 gap-2">
              <div className="text-center w-full">Sign : Visitor</div>
              <div className="text-center w-full">Auth</div>
              <div className="text-center w-full">Host</div>
              <div className="text-center w-full flex flex-col items-center">
                <span>Security</span>
                <span className="text-xs font-normal mt-1 border-b border-black border-dashed min-w-[80px]">OutTime:</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
