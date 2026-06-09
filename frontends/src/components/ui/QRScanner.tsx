import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  isScanning: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, isScanning }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const successCallbackRef = useRef(onScanSuccess);

  // Keep success callback ref updated without restarting the camera
  useEffect(() => {
    successCallbackRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader");
    }

    const startScanner = async () => {
      try {
        await scannerRef.current?.start(
          { facingMode: "environment" }, // Default to back camera
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            successCallbackRef.current(decodedText);
          },
          (errorMessage) => {
            // Ignore parse errors, they are very noisy as it scans empty frames
          }
        );
      } catch (err) {
        console.error("Failed to start QR scanner:", err);
      }
    };

    const stopScanner = async () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (err) {
          console.error("Failed to stop QR scanner:", err);
        }
      }
    };

    if (isScanning) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isScanning]);

  return (
    <div className="w-full flex justify-center bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700">
      <div id="qr-reader" className="w-full max-w-md bg-black"></div>
    </div>
  );
};
