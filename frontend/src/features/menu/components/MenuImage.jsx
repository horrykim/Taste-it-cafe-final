import { ImageOff } from "lucide-react";
import { useState } from "react";

// Fallback "no image" well uses Icon Well — Light Cyan (#B6F9FF) with Ink
// — Icon Stroke (#062B56) glyph, per the design system.
export default function MenuImage({ imageUrl, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) return <div className={`flex items-center justify-center bg-[#B6F9FF] text-[#062B56] ${className}`} role="img" aria-label={`${alt} image placeholder`}><ImageOff size={28} aria-hidden="true" /></div>;
  return <img src={imageUrl} alt={alt} className={`object-cover ${className}`} onError={() => setFailed(true)} />;
}