import { ImageOff } from "lucide-react";
import { useState } from "react";

export default function MenuImage({ imageUrl, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) return <div className={`flex items-center justify-center bg-taste-teal-soft text-slate-500 ${className}`} role="img" aria-label={`${alt} image placeholder`}><ImageOff size={28} aria-hidden="true" /></div>;
  return <img src={imageUrl} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />;
}
