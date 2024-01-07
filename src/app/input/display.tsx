"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { base32, base64 } from "rfc4648";

export function Display() {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!webcamRef.current) {
      return;
    }

    const scanner = new QrScanner(
      webcamRef.current,
      (result) => {
        const imageData = base32.parse(result.data.toLowerCase(), {
          loose: true,
        });
        imageRef.current!.src =
          "data:image/webp;base64," + base64.stringify(imageData);
      },
      {
        preferredCamera: "environment",
        maxScansPerSecond: 45,
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      },
    );

    scanner.setInversionMode("original");
    scanner.start();
    return () => scanner.destroy();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 m-3">
      <div className="aspect-video overflow-hidden">
        <img ref={imageRef} className="w-full aspect-video bg-slate-200" />
      </div>
      <div>
        <video
          className="w-full bg-slate-200"
          ref={webcamRef}
          muted={true}
          autoPlay={true}
          playsInline={true}
        />
      </div>
    </div>
  );
}
