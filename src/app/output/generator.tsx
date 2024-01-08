"use client";

import { useEffect, useRef, useState } from "react";
import { useObjectURL } from "@/use_object_url";
import QRCode from "qrcode";
import { base32, base64 } from "rfc4648";

export function QrGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [playing, setPlaying] = useState<boolean>(false);
  const videoUrl = useObjectURL(file);

  const animationFrameHandle = useRef<number>(0);
  const qrCanvas = useRef<HTMLCanvasElement>(null);
  const videoElement = useRef<HTMLVideoElement>(null);
  const imgElement = useRef<HTMLImageElement>(null);
  const sizeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    cancelAnimationFrame(animationFrameHandle.current);
    if (!videoElement.current || !qrCanvas.current || !playing) {
      return;
    }

    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = 16 * 10;
    videoCanvas.height = 9 * 10;
    const videoCanvasContext = videoCanvas.getContext("2d")!;
    videoCanvasContext.imageSmoothingQuality = "medium";

    // https://www.qrcode.com/en/about/version.html
    const version = 32;
    const errorCorrectionLevel = "L";
    const characterTarget = 2840;
    const sizeTarget = Math.floor(characterTarget * (5 / 8));
    const maxFramerate = 20;

    let lastFrameTime = 0;
    let lastQuality = 50;

    async function drawImage(timestamp: number) {
      cancelAnimationFrame(animationFrameHandle.current);
      if (timestamp - lastFrameTime < 1000 / maxFramerate) {
        animationFrameHandle.current = requestAnimationFrame(drawImage);
        return;
      }

      if (videoElement.current!.paused) {
        return;
      }

      const lastAnimationFrameHandle = animationFrameHandle.current;
      try {
        videoCanvasContext.drawImage(
          videoElement.current!,
          0,
          0,
          videoCanvas.width,
          videoCanvas.height,
        );
        const { blob, quality } = await encodeCanvas(
          videoCanvas,
          sizeTarget,
          lastQuality,
        );
        const binary = new Uint8Array(await blob.arrayBuffer());
        const encodedImage = base32
          .stringify(binary)
          .toUpperCase()
          .replace(/=+$/, "");
        imgElement.current!.src =
          "data:image/webp;base64," +
          base64.stringify(base32.parse(encodedImage, { loose: true }));
        await QRCode.toCanvas(
          qrCanvas.current,
          [{ data: encodedImage, mode: "alphanumeric" }],
          { errorCorrectionLevel, version, margin: 2, scale: 2 },
        );
        lastFrameTime = timestamp;
        lastQuality = quality;
        sizeRef.current!.innerText = [
          `binary: ${binary.length} / ${sizeTarget} bytes`,
          `base32: ${encodedImage.length} bytes / ${characterTarget} characters`,
          `encoded: ${((encodedImage.length * 11) / 16).toFixed(0)} bytes`,
          `quality: ${quality} %`,
        ].join("\n");
      } finally {
        // ensure that no other frame has been queued in the meantime
        if (lastAnimationFrameHandle === animationFrameHandle.current) {
          animationFrameHandle.current = requestAnimationFrame(drawImage);
        }
      }
    }

    cancelAnimationFrame(animationFrameHandle.current);
    animationFrameHandle.current = requestAnimationFrame(drawImage);

    return () => {
      cancelAnimationFrame(animationFrameHandle.current);
    };
  }, [playing]);

  return (
    <div className="grid grid-cols-1 landscape:grid-cols-2 gap-3 m-3">
      <div className="flex flex-col gap-3">
        <canvas ref={qrCanvas} className="!w-full !h-auto" />
        <div>
          <pre ref={sizeRef}></pre>
        </div>
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
        <img ref={imgElement} className="w-full bg-neutral-500/50" />
      </div>
    </div>
  );
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  maxSize: number,
  lastQuality = 50,
): Promise<{ blob: Blob; quality: number }> {
  let quality = lastQuality;
  let step = 2;
  let blob: Blob;

  const encode = (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject()),
        "image/webp",
        quality / 100,
      );
    });
  };

  blob = await encode();
  if (blob.size > maxSize) {
    do {
      quality -= step;
      if (quality < 0) {
        throw new Error(`Image size of ${blob.size} bytes is too large`);
      }

      blob = await encode();
    } while (blob.size > maxSize);
    return { blob, quality };
  } else {
    while (blob.size < maxSize * 0.99 && quality <= 100) {
      quality += step;
      const nextBlob = await encode();
      if (nextBlob.size > maxSize) {
        break;
      } else {
        blob = nextBlob;
      }
    }
    return { blob, quality: quality - step };
  }
}
