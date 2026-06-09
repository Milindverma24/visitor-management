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
  
  if (cat.includes("DRIVER") || cat.includes("VEHICLE") || cat.includes("TRANSPORTER")) {
    return {
      headerBg: "#0F172A", // Dark Navy
      headerText: "#FFFFFF",
      cardBg: "#FFF7ED", // Soft Safety Orange / Amber-50
      accentColor: "#EA580C", // Orange-600 (Safety Orange)
      badgeBg: "#EA580C",
      badgeText: "#FFFFFF",
      borderColor: "border-[#EA580C]",
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

  const isInterviewPass = visit.passType === "INTERVIEW_PASS" || (visit.cardId && visit.cardId.startsWith("INT/")) || visit.category === "CANDIDATE";
  const isMeetingPass = visit.passType === "MEETING_PASS" || (visit.cardId && visit.cardId.startsWith("MTG/"));
  const isVehiclePass = visit.passType === "VENDOR_PASS" || visit.category === "DRIVER";
  
  // Resolve category name for theme lookup
  const categoryName = isInterviewPass ? "CANDIDATE" : isMeetingPass ? "MEETING" : visit.category || "VISITOR";
  const theme = getTheme(categoryName);

  // Extract Vehicle Number and Pure Purpose
  const vehicleMatch = visit.purpose?.match(/\[(.*?)\]/);
  const vehicleNumber = vehicleMatch ? vehicleMatch[1] : "N/A";
  const purePurpose = visit.purpose?.replace(/\[.*?\]\s*-\s*/, "") || "MATERIAL DELIVERY";

  // Photo resolution
  const displayPhoto = photoUrl || visit.photoPath || visit.visitorPhotoPath || visit.candidatePhotoPath || "";

  return (
    <Card 
      className={`w-full max-w-3xl mx-auto overflow-hidden border-2 shadow-xl text-black font-sans print:shadow-none print:border-none print:w-full print:max-w-none ${theme.borderColor}`}
      style={{ backgroundColor: theme.cardBg, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
    >
      <div className="p-5 flex flex-col h-full min-h-[450px]">
        {/* Header Banner */}
        <div 
          className="flex items-center justify-between gap-4 p-4 rounded-xl mb-6 shadow-sm border-b"
          style={{ backgroundColor: theme.headerBg, color: theme.headerText, borderColor: theme.accentColor }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg flex items-center justify-center shadow-md">
              <img src="/uploads/company_logo.png" alt="IGL" className="h-10 w-auto object-contain" />
            </div>
            <div className="text-left font-black text-sm sm:text-base tracking-wide uppercase">
              Indian Glycols Limited - Kashipur
            </div>
          </div>

          <div 
            className="px-3.5 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase font-mono shadow-sm"
            style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
          >
            {isInterviewPass ? 'INTERVIEW PASS' : isMeetingPass ? 'MEETING PASS' : isVehiclePass ? 'VEHICLE PASS' : categoryName}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 mb-6">
          {/* Left Details */}
          <div className="flex-1 text-sm sm:text-base space-y-3 font-medium text-left">
            {isInterviewPass ? (
              // Interview specific fields
              <>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Pass Number</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.cardId || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Approval Number</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.approvalNumber || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Candidate Name</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.visitorName || visit.candidate_name || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Position Applied</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.position || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Department</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.department || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Interview Date/Time</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.scheduledTime || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Interviewer Name</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.interviewerName || 'N/A'}</span>
                </div>
              </>
            ) : isMeetingPass ? (
              // Meeting specific fields
              <>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Pass Number</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.cardId || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Approval Number</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.approvalNumber || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Visitor Name</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.visitorName || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Company Name</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.company || visit.companyName || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Meeting Title</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.purpose || visit.title || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Host Employee</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.hostEmployee || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Meeting Room</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.location || 'N/A'}</span>
                </div>
              </>
            ) : (
              // Standard Visitor & Vehicle fields
              <>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Pass ID</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.cardId || 'N/A'}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Entry Date/Time</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.createdAt ? visit.createdAt.replace('T', ' ').substring(0, 16) : new Date().toLocaleString()}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">{isVehiclePass ? 'Driver Name' : 'Name'}</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.title || ''} {visit.visitorName}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">{isVehiclePass ? 'Driver Phone' : 'Phone'}</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    : {visit.phone} 
                    <span className="ml-6 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Mob Token:</span> {visit.mobileTokenNo || 'N/A'}
                  </span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">{isVehiclePass ? 'Transport Co.' : 'Company'}</span>
                  <span className="font-extrabold text-slate-900 uppercase">: {visit.company || 'N/A'}</span>
                </div>

                {isVehiclePass && (
                  <div className="grid grid-cols-[140px_1fr] items-start">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Vehicle Number</span>
                    <span className="font-black text-orange-700 font-mono text-lg">: {vehicleNumber}</span>
                  </div>
                )}
                
                {!isVehiclePass && (
                  <div className="grid grid-cols-[140px_1fr] items-start">
                    <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Address</span>
                    <span className="font-extrabold text-slate-900">: {visit.address || 'N/A'}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Accessories</span>
                  <span className="font-extrabold text-slate-900">: {visit.accessories || 'None'}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Purpose</span>
                  <span className="font-extrabold text-slate-900">
                    : {isVehiclePass ? purePurpose : visit.purpose}
                    <span className="ml-6 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Destination:</span> {visit.upTo || visit.department || 'Plant'}
                  </span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">To Meet</span>
                  <span className="font-extrabold text-slate-900">: {visit.hostEmployee}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Valid UpTo</span>
                  <span className="font-extrabold text-slate-900 font-mono">: {visit.validUpTo ? visit.validUpTo.replace('T', ' ').substring(0, 16) : 'N/A'}</span>
                </div>
                
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <span className="text-slate-500 font-semibold uppercase text-[11px] tracking-wider">Accmp by</span>
                  <span className="font-extrabold text-slate-900 font-mono">
                    : {visit.accompaniedByCount || 0}
                    <span className="ml-6 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Approved:</span> YES
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* Right Photo & QR Code */}
          <div className="flex flex-col gap-4 self-start shrink-0">
            {/* Photo Box */}
            <div 
              className="w-40 h-40 border-2 flex items-center justify-center bg-white shadow-md overflow-hidden rounded-xl"
              style={{ borderColor: theme.accentColor }}
            >
              {displayPhoto ? (
                <img src={displayPhoto} alt="Identity Photo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 font-extrabold tracking-widest text-xs font-mono">PHOTO</div>
              )}
            </div>
            
            {/* QR Code Box */}
            <div 
              className="w-40 h-40 border-2 bg-white p-2.5 flex items-center justify-center shadow-md rounded-xl"
              style={{ borderColor: theme.accentColor }}
            >
              <QRCode 
                value={visit.cardId || `PASS:${visit.id}`} 
                size={130}
                level="M"
                viewBox={`0 0 130 130`}
              />
            </div>
          </div>
        </div>

        {/* Notes & Signatures */}
        <div className="mt-auto pt-4 border-t border-slate-350">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            {/* Notes */}
            <div className="text-[10px] w-full sm:w-5/12 leading-tight font-medium text-slate-500 text-left">
              {isInterviewPass ? (
                <>
                  <span className="font-bold text-slate-700 underline uppercase tracking-wider block mb-1">Interview Guidelines:</span>
                  <ol className="list-decimal pl-4 space-y-0.5 font-semibold text-slate-600">
                    <li>Please report to reception 15 mins before scheduled time.</li>
                    <li>Carry original Aadhaar and educational certificates.</li>
                    <li>Mobile phones are restricted inside plant areas.</li>
                    <li>Follow safety guidelines and signs inside the premises.</li>
                  </ol>
                </>
              ) : isMeetingPass ? (
                <>
                  <span className="font-bold text-slate-700 underline uppercase tracking-wider block mb-1">Safety Directive:</span>
                  <ol className="list-decimal pl-4 space-y-0.5 font-semibold text-slate-600">
                    <li>Please keep this pass visible at all times.</li>
                    <li>Visitor must remain accompanied by the host employee.</li>
                    <li>Photography and recording are strictly prohibited inside.</li>
                    <li>Return the pass to security upon checkout.</li>
                  </ol>
                </>
              ) : isVehiclePass ? (
                <>
                  <span className="font-bold text-slate-700 underline uppercase tracking-wider block mb-1">Safety Directive:</span>
                  <ol className="list-decimal pl-4 space-y-0.5 font-semibold text-slate-600">
                    <li>Speed limit inside the plant is strictly 10 km/h.</li>
                    <li>Vehicle must be parked in designated areas only.</li>
                    <li>Drivers must wear safety shoes & helmets in loading zones.</li>
                    <li>Do not leave the engine idling while parked.</li>
                  </ol>
                </>
              ) : (
                <>
                  <span className="font-bold text-slate-700 underline uppercase tracking-wider block mb-1">Safety Directive:</span>
                  <ol className="list-decimal pl-4 space-y-0.5 font-semibold text-slate-600">
                    <li>Please return the pass before leaving.</li>
                    <li>In case of emergency please call reception at "8" extn.</li>
                    <li>Entering in this plant floor at own risk.</li>
                    <li>Strictly abide by hazardous zone mobile phone regulations.</li>
                  </ol>
                </>
              )}
            </div>

            {/* Signatures */}
            <div className="w-full sm:w-7/12 flex items-end justify-between text-xs font-bold pb-2 gap-4 text-slate-700">
              <div className="text-center w-full border-t border-slate-300 border-dashed pt-2">
                {isInterviewPass ? "Candidate" : isVehiclePass ? "Driver" : "Visitor"}
              </div>
              <div className="text-center w-full border-t border-slate-300 border-dashed pt-2">Authorized</div>
              <div className="text-center w-full border-t border-slate-300 border-dashed pt-2">Host Approval</div>
              <div className="text-center w-full flex flex-col items-center border-t border-slate-300 border-dashed pt-2">
                <span>Security Gate</span>
                <span className="text-[9px] font-mono font-normal mt-1 border-b border-slate-400 border-dashed min-w-[70px]">Out: ____</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
