"use client";

import { useEffect, useRef, useState } from "react";
import { useObjectURL } from "@/use_object_url";
import QRCode from "qrcode";

export function QrGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const videoUrl = useObjectURL(file);
  const qrCanvas = useRef<HTMLCanvasElement>(null);
  const videoElement = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoElement.current || !qrCanvas.current || !playing) {
      return;
    }

    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = 160;
    videoCanvas.height = 120;
    const videoCanvasContext = videoCanvas.getContext("2d")!;

    let animationFrameHandle: number | null = null;
    async function drawImage() {
      if (videoElement.current && qrCanvas.current) {
        videoCanvasContext.drawImage(
          videoElement.current,
          0,
          0,
          videoCanvas.width,
          videoCanvas.height,
        );
        const frameBlob: Blob = await new Promise((resolve, reject) => {
          videoCanvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject()),
            "image/jpeg",
            0.1,
          );
        });
        const uint8Array = new Uint8Array(await frameBlob.arrayBuffer());
        await QRCode.toCanvas(qrCanvas.current, [
          { data: uint8Array, mode: "byte" },
        ]);
      }

      animationFrameHandle = requestAnimationFrame(drawImage);
    }

    animationFrameHandle = requestAnimationFrame(drawImage);

    return () => {
      if (animationFrameHandle) {
        cancelAnimationFrame(animationFrameHandle);
      }
    };
  }, [playing]);

  return (
    <div className="grid grid-cols-2 gap-3 m-3">
      <div>
        <canvas ref={qrCanvas} />
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="file" className="block">
            Video file
          </label>
          <input
            type="file"
            id="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            accept="video/*"
          />
        </div>
        {videoUrl && (
          <video
            src={videoUrl}
            ref={videoElement}
            className="w-full"
            autoPlay={true}
            muted={true}
            loop={true}
            controls={true}
            playsInline={true}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        )}
      </div>
    </div>
  );
}
