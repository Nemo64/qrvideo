import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto my-32 max-w-max flex flex-col gap-3">
      <Link
        href="/output"
        className="group block px-5 py-3 my-3 rounded-xl bg-red-800 hover:bg-red-600 text-white text-center"
      >
        <span className="group-hover:scale-125 transition inline-block text-6xl leading-4 align-middle">
          💻
        </span>{" "}
        QR Code Out / Video In
      </Link>
      <Link
        href="/input"
        className="group block px-5 py-3 my-3 rounded-xl bg-red-800 hover:bg-red-600 text-white text-center"
      >
        <span className="group-hover:scale-125 transition inline-block text-6xl leading-4 align-middle">
          📱
        </span>{" "}
        QR Code In / Video Out
      </Link>
    </div>
  );
}
