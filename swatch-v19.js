/* v19: exact reader for the two-column "My color chart" template */
(()=>{
  const LEFT=['2','3','4','5','6','7','8','9','0','a','b','c','d','e','f'];
  const RIGHT=['g','h','j','k','m','n','p','q','r','s','t','u','w','x'];
  const CODES=[...LEFT,...RIGHT];
  const X=[0.0651595745,0.5378989362];
  const Y0=0.1372458410, STEP=0.0480591497;
  const BOX_W=0.0398936170, BOX_H=0.0277264325;

  function median(a){a.sort((x,y)=>x-y);const n=a.length;return n?a[Math.floor(n/2)]:245}
  function sampleBox(g,w,h,cx,cy){
    const rs=[],gs=[],bs=[];
    const bw=w*BOX_W,bh=h*BOX_H;
    for(const ox of [-.25,.25]) for(const oy of [-.25,.25]){
      const px=Math.round(cx+ox*bw),py=Math.round(cy+oy*bh);
      const rx=Math.max(2,Math.round(bw*.08)),ry=Math.max(2,Math.round(bh*.08));
      const sx=Math.max(0,px-rx),sy=Math.max(0,py-ry),sw=Math.max(1,Math.min(w-sx,rx*2+1)),sh=Math.max(1,Math.min(h-sy,ry*2+1));
      const d=g.getImageData(sx,sy,sw,sh).data;
      for(let p=0;p<d.length;p+=4){rs.push(d[p]);gs.push(d[p+1]);bs.push(d[p+2])}
    }
    return [median(rs),median(gs),median(bs)];
  }

  async function readMyColorChart(){
    if(!current?.swatchSource)return;
    const im=await img(current.swatchSource),c=document.createElement('canvas');
    c.width=im.naturalWidth;c.height=im.naturalHeight;
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
    const palette=[];
    [LEFT,RIGHT].forEach((codes,col)=>codes.forEach((code,row)=>{
      const cx=X[col]*c.width,cy=(Y0+STEP*row)*c.height;
      palette.push(sampleBox(g,c.width,c.height,cx,cy));
    }));
    current.palette=palette;
    current.codes=[...CODES];
    current.swatchCount=CODES.length;
    renderPalette();
    await save();
  }

  keyHTMLFor=function(d){
    if(!d?.palette?.length)return'';
    const codes=d.codes||CODES.slice(0,d.palette.length);
    const rows=d.palette.map((c,i)=>`<div class="keyRow"><span class="code">${esc(codes[i]||'')}</span><span class="swatchBlock" style="background:${hex(c)}"></span><span class="writeLine"></span></div>`);
    const cut=Math.ceil(rows.length/2);
    return `<div class="keyTitle">COLOUR KEY</div><div class="keySub">Design ${d.number}</div><div class="v19KeyCols"><div>${rows.slice(0,cut).join('')}</div><div>${rows.slice(cut).join('')}</div></div>`;
  };

  const style=document.createElement('style');
  style.textContent=`.v19KeyCols{display:grid;grid-template-columns:1fr 1fr;gap:22px}.v19KeyCols .keyRow{grid-template-columns:30px 34px 1fr;gap:7px;padding:5px 0}.v19KeyCols .swatchBlock{width:28px;height:28px}.bookPageMini .v19KeyCols{gap:5px}.bookPageMini .v19KeyCols .keyRow{grid-template-columns:14px 16px 1fr;gap:2px;padding:1px 0;font-size:6px}.bookPageMini .v19KeyCols .swatchBlock{width:14px;height:14px}@media(max-width:600px){#keyPage .v19KeyCols{gap:8px}.v19KeyCols .keyRow{grid-template-columns:24px 30px 1fr;gap:4px}}`;
  document.head.appendChild(style);

  const btn=document.getElementById('readPalette');
  if(btn){btn.textContent='Read My color chart';btn.onclick=readMyColorChart}
  const controls=document.querySelector('#paletteStage .swatchControls');if(controls)controls.style.display='none';
  const note=document.querySelector('#paletteStage .note');if(note)note.innerHTML='<strong>Built for your My color chart page.</strong> The app now reads the 29 coloured code boxes in their two columns and keeps the exact code order: 2–9, 0, a–f, then g, h, j, k, m, n, p, q, r, s, t, u, w, x. It samples the coloured corners of each box so the printed letter/number does not contaminate the colour.';
})();