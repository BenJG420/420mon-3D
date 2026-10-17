import type { Sym } from "./slot-rules";
const frame = (content: string) => `<svg viewBox="0 0 96 96" aria-hidden="true" focusable="false">${content}</svg>`;
const fruits: Partial<Record<Sym, string>> = {
  cherry: '<path d="M31 48Q42 16 65 38" fill="none" stroke="#6e9459" stroke-width="5"/><circle cx="31" cy="62" r="18" fill="#ca3c48"/><circle cx="65" cy="56" r="18" fill="#a52d45"/><path d="M22 53l5-4m29-2l5-3" stroke="#f4adb0" stroke-width="4"/>',
  lemon: '<ellipse cx="48" cy="51" rx="31" ry="20" transform="rotate(-25 48 51)" fill="#e8c457"/><path d="M24 48q13-15 31-14" fill="none" stroke="#fff0ab" stroke-width="4"/>',
  orange: '<circle cx="48" cy="54" r="27" fill="#d9843a"/><path d="M48 28q-5-17 20-12q-3 17-20 12" fill="#688b4d"/><path d="M28 46q4-9 14-11" fill="none" stroke="#f9c275" stroke-width="4"/>',
  plum: '<ellipse cx="48" cy="52" rx="25" ry="29" fill="#795278"/><path d="M47 24q8 29 0 56" fill="none" stroke="#4e374f" stroke-width="3"/><path d="M32 39l4-5" stroke="#bd95b1" stroke-width="5"/>',
  grape: '<path d="M45 25q-3-13 19-13" fill="none" stroke="#7b9153" stroke-width="4"/>'+[[33,39],[59,39],[27,60],[53,61],[42,78],[43,49]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="12" fill="#705077" stroke="#b18bb0" stroke-width="2"/>`).join(''),
  melon: '<ellipse cx="48" cy="52" rx="33" ry="25" fill="#71975a"/><path d="M22 51h52m-29-24q-23 25 0 50m8-50q23 25 0 50" fill="none" stroke="#315b40" stroke-width="4"/>',
  bell: '<path d="M22 69h52l-9-15q0-24-17-24T31 54Z" fill="#d9b468" stroke="#8f7144" stroke-width="3"/><circle cx="48" cy="77" r="7" fill="#b38b48"/><circle cx="48" cy="25" r="5" fill="#efd49b"/>',
  star: '<path d="m48 14 10 23 25 3-19 18 5 26-21-13-22 13 6-26-20-18 26-3Z" fill="#e4c477" stroke="#9f7945" stroke-width="3"/>',
};
const budColors: Record<string,string> = { joint:'#74915b',bud:'#648148',seed:'#9fa454',fish:'#869ba2',chip:'#83916c',neon:'#b7b1c0',kaiser:'#bd9663',wild:'#b28aab',scatter:'#8f9e62' };
const cache = new Map<Sym,string>();
/** Smooth local vector symbols; strain/symbol identities and labels follow the original deck. */
export function slotSymbol(sym: Sym): string {
  const cached=cache.get(sym);if(cached)return cached;
  const markup = fruits[sym] ?? (sym==='four'
    ? '<rect x="9" y="25" width="78" height="46" rx="10" fill="#452c2a" stroke="#d4b375" stroke-width="3"/><text x="48" y="57" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="28" fill="#f5d58a">420</text>'
    : `<path d="M46 87V61" stroke="#766d43" stroke-width="4"/><path d="M48 9 36 27 23 37l8 12-12 9 13 13-2 9 18-4 18 4-2-9 13-13-12-9 8-12-13-10Z" fill="${budColors[sym]??'#74915b'}" stroke="#d1c69b" stroke-width="2"/>${[[43,31],[53,41],[36,51],[55,59],[43,66]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="#ded9ad" opacity=".65"/>`).join('')}`);
  const value=frame(markup);cache.set(sym,value);return value;
}
