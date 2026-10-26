import Link from "next/link";
export default function NotFound() {
  return <div className="mx-auto max-w-md px-6 py-28 text-center"><h1 className="text-xl font-semibold">This link isn&rsquo;t available</h1><p className="mt-2 text-sm text-muted">It may have been turned off by its owner, or never existed.</p><Link href="/" className="mt-6 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-[#0b0a14]">Go to DesignPilot</Link></div>;
}
