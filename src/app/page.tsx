import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto my-32 max-w-screen-sm">
      <Link href="/output" className="block px-1 py-3 rounded bg-red-800 hover:bg-red-600 text-white text-center">Video output</Link>
    </div>
  );
}
