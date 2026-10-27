import type { WireKind } from "@/lib/engine/starterkit";

const B = ({ w = "100%", h = 8, accent = false, r = 3, className = "" }: { w?: string | number; h?: number | string; accent?: boolean; r?: number; className?: string }) => (
  <div className={className} style={{ width: w, height: h, borderRadius: r, background: accent ? "var(--accent)" : "var(--line-strong)" }} />
);
const Img = ({ h = 40 }: { h?: number | string }) => <div style={{ height: h, borderRadius: 4, background: "var(--hover)", border: "1px dashed var(--line-strong)" }} />;
const Bar = () => <div className="flex items-center justify-between"><B w={28} h={6} /><div className="flex gap-1.5"><B w={14} h={5} /><B w={14} h={5} /><B w={14} h={5} /></div></div>;

/** Simple structural wireframes built from the page's own elements. They show layout intent only; they are not designs. */
export function Wireframe({ kind, label }: { kind: WireKind; label: string }) {
  let body: React.ReactNode;
  switch (kind) {
    case "landing": body = <><Img h={46} /><div className="mt-2 grid gap-1.5"><B w="70%" h={9} /><B w="50%" h={6} /><B w={44} h={12} accent r={4} /></div><div className="mt-2 grid grid-cols-3 gap-1.5"><Img h={22} /><Img h={22} /><Img h={22} /></div></>; break;
    case "dashboard": body = <><div className="grid grid-cols-3 gap-1.5"><Img h={20} /><Img h={20} /><Img h={20} /></div><div className="mt-2 grid grid-cols-[2fr_1fr] gap-1.5"><Img h={52} /><Img h={52} /></div></>; break;
    case "list": body = <div className="grid grid-cols-[28%_1fr] gap-2"><div className="grid gap-1.5"><B h={6} /><B h={6} w="80%" /><B h={6} w="60%" /></div><div className="grid grid-cols-2 gap-1.5"><Img h={36} /><Img h={36} /><Img h={36} /><Img h={36} /></div></div>; break;
    case "form": body = <div className="mx-auto grid w-3/4 gap-2"><B w="50%" h={8} /><B h={14} r={4} /><B h={14} r={4} /><B h={14} r={4} /><B w={50} h={14} accent r={4} /></div>; break;
    case "product": body = <div className="grid grid-cols-2 gap-2"><Img h={78} /><div className="grid content-start gap-1.5"><B w="80%" h={8} /><B w="30%" h={8} /><B h={5} /><B h={5} w="85%" /><B w="100%" h={14} accent r={4} /></div></div>; break;
    case "detail": body = <><B w="60%" h={9} /><div className="mt-2 grid gap-1.5"><Img h={40} /><B h={5} /><B h={5} w="90%" /><B h={5} w="70%" /></div></>; break;
    case "feed": body = <div className="mx-auto grid w-3/5 gap-1.5"><Img h={30} /><Img h={30} /><Img h={30} /><div className="mt-1 grid grid-cols-4 gap-1">{[0, 1, 2, 3].map((i) => <B key={i} h={8} accent={i === 0} />)}</div></div>; break;
    case "settings": body = <div className="grid grid-cols-[26%_1fr] gap-2"><div className="grid gap-1.5"><B h={6} accent /><B h={6} /><B h={6} /><B h={6} /></div><div className="grid gap-2"><B w="50%" h={8} /><B h={12} r={4} /><B h={12} r={4} /></div></div>; break;
    case "checkout": body = <div className="grid grid-cols-[1.4fr_1fr] gap-2"><div className="grid gap-1.5"><B h={12} r={4} /><B h={12} r={4} /><B h={12} r={4} /></div><div className="grid content-start gap-1.5 rounded border border-line-strong p-1.5"><B h={5} /><B h={5} /><B h={9} w="60%" /><B h={14} accent r={4} /></div></div>; break;
    default: body = <div className="mx-auto grid w-3/5 justify-items-center gap-2"><Img h={48} /><B w="70%" h={8} /><B w="50%" h={5} /><div className="flex gap-1"><B w={6} h={6} r={9} accent /><B w={6} h={6} r={9} /><B w={6} h={6} r={9} /></div><B w={60} h={14} accent r={4} /></div>;
  }
  return <div role="img" aria-label={`Wireframe sketch: ${label}`} className="rounded-lg border border-line bg-elevated p-2.5"><Bar /><div className="mt-2">{body}</div></div>;
}
