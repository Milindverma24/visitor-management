import React from "react";
import QRCode from "react-qr-code";
import { Card } from "./ui/Card";

interface EnterprisePassProps {
  visit: any;
  qrCodeUrl?: string;
  photoUrl?: string;
}

const getTheme = (category: string) => {
  const cat = (category || "VISITOR").toUpperCase();
  
  if (cat === "CANDIDATE" || cat.includes("INTERVIEW")) {
    return {
      headerBg: "#1E1B4B", // Dark Indigo
      headerText: "#FFFFFF",
      cardBg: "#FAF5FF", // Soft Purple
      accentColor: "#8B5CF6", // Purple-500
      badgeBg: "#8B5CF6",
      badgeText: "#FFFFFF",
      borderColor: "border-[#8B5CF6]",
      textColor: "text-slate-900",
      labelColor: "text-slate-500"
    };
  }

  if (cat === "MEETING" || cat.includes("MEETING")) {
    return {
      headerBg: "#083344", // Dark Cyan
      headerText: "#FFFFFF",
      cardBg: "#ECFEFF", // Soft Cyan
      accentColor: "#06B6D4", // Cyan-500
      badgeBg: "#06B6D4",
      badgeText: "#FFFFFF",
      borderColor: "border-[#06B6D4]",
      textColor: "text-slate-900",
      labelColor: "text-slate-500"
    };
  }
  

  
  if (cat.includes("EMPLOYEE") || cat.includes("STAFF")) {
    return {
      headerBg: "#0F172A", // Dark Navy
      headerText: "#FFFFFF",
      cardBg: "#F1F5F9", // Sleek Slate-100
      accentColor: "#2563EB", // Industrial Blue
      badgeBg: "#2563EB",
      badgeText: "#FFFFFF",
      borderColor: "border-[#2563EB]",
      textColor: "text-[#0F172A]",
      labelColor: "text-slate-500"
    };
  }
  if (cat.includes("SECURITY") || cat.includes("GUARD")) {
    return {
      headerBg: "#1E293B", // Dark Slate
      headerText: "#FFFFFF",
      cardBg: "#FEF2F2", // Soft Crimson Red
      accentColor: "#EF4444", // Crimson Red
      badgeBg: "#EF4444",
      badgeText: "#FFFFFF",
      borderColor: "border-[#EF4444]",
      textColor: "text-slate-900",
      labelColor: "text-slate-500"
    };
  }
  if (cat.includes("CONTRACTOR") || cat.includes("VENDOR")) {
    return {
      headerBg: "#0F172A", // Dark Navy
      headerText: "#FFFFFF",
      cardBg: "#FFFBEB", // Soft Amber
      accentColor: "#F59E0B", // Amber Orange
      badgeBg: "#F59E0B",
      badgeText: "#FFFFFF",
      borderColor: "border-[#F59E0B]",
      textColor: "text-slate-900",
      labelColor: "text-slate-500"
    };
  }
  // Default is VISITOR / GUEST
  return {
    headerBg: "#0F172A", // Dark Navy
    headerText: "#FFFFFF",
    cardBg: "#FEFCE8", // Soft Safety Yellow
    accentColor: "#FBBF24", // Safety Yellow
    badgeBg: "#FBBF24",
    badgeText: "#0F172A",
    borderColor: "border-[#FBBF24]",
    textColor: "text-slate-900",
    labelColor: "text-slate-500"
  };
};

export const EnterprisePass: React.FC<EnterprisePassProps> = ({ visit, photoUrl }) => {
  if (!visit) return null;

  // Resolve category name for theme lookup
  const categoryName = visit.category || "VISITOR";
  const theme = getTheme(categoryName);



  // Photo resolution
  const displayPhoto = photoUrl || visit.photoPath || visit.visitorPhotoPath || visit.candidatePhotoPath || "";

  return (
    <Card 
      className={`relative mx-auto overflow-hidden shadow-xl text-black font-sans print-only print:shadow-none print:border-none border-2 ${theme.borderColor}`}
      style={{ 
        backgroundColor: theme.cardBg, 
        WebkitPrintColorAdjust: "exact", 
        printColorAdjust: "exact",
        width: "9.1cm",
        height: "6.1cm",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }}
    >
      {/* Header Banner */}
      <div 
        className="flex items-center justify-between px-2 py-1 border-b"
        style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.accentColor }}
      >
        <div className="flex items-center gap-2">
          <div className="bg-white p-0.5 rounded flex items-center justify-center">
            <img src="/uploads/company_logo.png" alt="IGL" className="h-4 w-auto object-contain" />
          </div>
          <div className="text-left font-black text-[8px] tracking-tight uppercase leading-tight">
            Indian Glycols Limited - Kashipur
          </div>
        </div>
        <div 
          className="px-1.5 py-0.5 rounded text-[7px] font-black tracking-wider uppercase font-mono text-center shadow-sm"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
        >
          {categoryName}
        </div>
      </div>
      
      {/* Main Content Body */}
      <div className="flex-1 flex p-1.5 gap-2 items-stretch">
        
        {/* Left Side: Details Grid */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="text-[10px] font-extrabold text-slate-900 uppercase leading-tight truncate w-full mb-1">
            {visit.title || ''} {visit.visitorName}
          </div>
          
          <div className="w-full text-[5.5px] space-y-[1px] font-medium text-left leading-[1.05]">
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Pass ID:</span>
              <span className="font-extrabold text-slate-900 font-mono">{visit.cardId || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Phone:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.phone}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Company:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.company || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">To Meet:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.hostEmployee ? visit.hostEmployee.split('(')[0].trim() : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Destination:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.upTo || visit.department || 'Plant'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Purpose:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.purpose || 'Meeting'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Accessories:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.accessories || 'None'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Accmp by:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.accompaniedByCount ? `${visit.accompaniedByCount}` : '0'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Address:</span>
              <span className="font-extrabold text-slate-900 truncate max-w-[4cm] text-right">{visit.address || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-start border-b border-slate-200 pb-[1px]">
              <span className="text-slate-500 uppercase font-bold">Valid UpTo:</span>
              <span className="font-extrabold text-slate-900 font-mono">{visit.validUpTo ? visit.validUpTo.replace('T', ' ').substring(0, 16) : 'N/A'}</span>
            </div>
          </div>
          
          <div className="text-[5px] text-slate-500 text-left leading-tight mt-1">
             <span className="font-bold">Non-transferable.</span> Must be worn visibly.
          </div>
        </div>
        
        {/* Right Side: Photo and QR */}
        <div className="flex flex-col items-center justify-between w-[2.2cm] shrink-0 border-l pl-2 border-slate-200">
          {/* Photo Box */}
          <div 
            className="w-[2cm] h-[2cm] border-2 flex items-center justify-center bg-white overflow-hidden rounded-md shrink-0"
            style={{ borderColor: theme.accentColor }}
          >
            {displayPhoto ? (
              <img src={displayPhoto} alt="Photo" className="w-full h-full object-cover" />
            ) : (
              <div className="text-slate-400 font-extrabold text-[8px] font-mono">PHOTO</div>
            )}
          </div>
          
          {/* QR Code */}
          {visit.cardId && (
            <div className="p-0.5 bg-white border border-slate-200 rounded shrink-0 mb-0.5 mt-auto">
              <QRCode value={visit.cardId || `PASS:${visit.id}`} size={42} level="M" />
            </div>
          )}
        </div>

      </div>

      {/* Footer: Instructions, Signatures, Check IN/OUT */}
      <div className="flex flex-col border-t border-slate-300 mt-auto px-2 py-1 bg-slate-50 shrink-0">
        <div className="flex justify-between items-end gap-2">
          {/* Instructions */}
          <div className="text-[4.5px] leading-[1.3] text-slate-500 w-[35%]">
            <span className="font-bold underline text-slate-700">Safety Directive:</span><br/>
            1. Return pass at gate upon exit.<br/>
            2. Follow safety & mobile guidelines.<br/>
            3. Enter plant floor at own risk.
          </div>
          
          {/* Signatures */}
          <div className="flex-1 flex justify-between items-end text-[5px] font-bold text-slate-700 h-full pb-[2px] ml-1">
            <div className="border-t border-slate-400 border-dashed w-12 text-center pt-[1px]">Visitor</div>
            <div className="border-t border-slate-400 border-dashed w-12 text-center pt-[1px]">Host</div>
            <div className="border-t border-slate-400 border-dashed w-14 text-center pt-[1px]">Security Gate</div>
          </div>
        </div>
        
        {/* Check-in / Out Times */}
        <div className="flex justify-between mt-[4px] border-t border-slate-200 pt-[2px] text-[5px] font-mono font-semibold text-slate-600">
          <span>IN: {visit.createdAt ? visit.createdAt.replace('T', ' ').substring(0, 16) : '____-___-___ __:__'}</span>
          <span>OUT: {visit.checkOutAt ? visit.checkOutAt.replace('T', ' ').substring(0, 16) : '____-___-___ __:__'}</span>
        </div>
      </div>
    </Card>
  );
};
