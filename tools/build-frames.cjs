// Cuts frame artwork to transparent + builds opening masks + prints geometry for css/gallery-wall.css.
// Run from repo root: node tools/build-frames.cjs
const sharp=require('sharp'),fs=require('fs');
// Source frames live in assets/source/frames (gitignored): 2=pink-gilt 3=verdigris-oval 4=lapis-gilt 5=mint-oval 6=teal-gilt 7=pink-carved
const d='assets/source/frames/';
const FR={2:'pink-gilt',3:'verdigris-oval',4:'lapis-gilt',5:'mint-oval',6:'teal-gilt',7:'pink-carved'};
const out='assets/images/frames/';const meta={};
(async()=>{for(const [n,name] of Object.entries(FR)){
 const {data,info}=await sharp(d+n+'.jpg').removeAlpha().raw().toBuffer({resolveWithObject:true});
 const W=info.width,H=info.height,N=W*H;
 const bgLike=new Uint8Array(N);
 for(let i=0;i<N;i++){const r=data[i*3],g=data[i*3+1],b=data[i*3+2];const mx=Math.max(r,g,b),mn=Math.min(r,g,b);bgLike[i]=(mn>=222&&mx-mn<=(name==='pink-carved'?22:16))?1:0;}
 const flood=(seeds)=>{const m=new Uint8Array(N);const q=[];for(const s of seeds)if(bgLike[s]&&!m[s]){m[s]=1;q.push(s)}
  while(q.length){const p=q.pop();const x=p%W,y=(p/W)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const k=ny*W+nx;if(!m[k]&&bgLike[k]){m[k]=1;q.push(k)}}}return m;};
 const border=[];for(let x=0;x<W;x++){border.push(x,(H-1)*W+x)}for(let y=0;y<H;y++){border.push(y*W,y*W+W-1)}
 const outside=flood(border);
 const cx=W>>1,cy=H>>1;const cs=[];for(let dy=-20;dy<=20;dy+=5)for(let dx=-20;dx<=20;dx+=5)cs.push((cy+dy)*W+cx+dx);
 const opening=flood(cs);
 // alpha for frame
 const alpha=Buffer.alloc(N);for(let i=0;i<N;i++)alpha[i]=(outside[i]||opening[i])?0:255;
 // enclosed white pockets (e.g. pierced scrollwork) on frames that have no white paint
 if(name==='lapis-gilt'||name==='mint-oval'||name==='pink-gilt')for(let i=0;i<N;i++){const r=data[i*3],g=data[i*3+1],b=data[i*3+2];if(Math.min(r,g,b)>=236&&Math.max(r,g,b)-Math.min(r,g,b)<=10)alpha[i]=0;}
 // 1px erosion to drop the white JPEG halo
 {const e=Buffer.from(alpha);for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(alpha[i]&&(!alpha[i-1]||!alpha[i+1]||!alpha[i-W]||!alpha[i+W]))e[i]=0;}alpha.set(e);}
 const a2=await sharp(alpha,{raw:{width:W,height:H,channels:1}}).blur(0.7).extractChannel(0).raw().toBuffer();
 await sharp(data,{raw:{width:W,height:H,channels:3}}).joinChannel(a2,{raw:{width:W,height:H,channels:1}}).webp({quality:88,alphaQuality:90}).toFile(out+name+'.webp');
 // opening mask, dilated 5px, cropped to bbox
 const R=5;const dil=Buffer.alloc(N);
 let x0=W,y0=H,x1=0,y1=0;
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){if(!opening[y*W+x])continue;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let on=0;for(let dy=-R;dy<=R&&!on;dy++)for(let dx=-R;dx<=R;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<W&&ny<H&&opening[ny*W+nx]){on=1;break}}dil[y*W+x]=on?255:0;}
 x0=Math.max(0,x0-R);y0=Math.max(0,y0-R);x1=Math.min(W-1,x1+R);y1=Math.min(H-1,y1+R);
 const bw=x1-x0+1,bh=y1-y0+1;
 const white=Buffer.alloc(N*3,255);
 const full=await sharp(white,{raw:{width:W,height:H,channels:3}}).joinChannel(dil,{raw:{width:W,height:H,channels:1}}).png().toBuffer();
 await sharp(full).extract({left:x0,top:y0,width:bw,height:bh}).png({compressionLevel:9}).toFile(out+name+'-mask.png');
 const openPct=(opening.reduce((a,b)=>a+b,0)/N*100).toFixed(1),outPct=(outside.reduce((a,b)=>a+b,0)/N*100).toFixed(1);
 meta[name]={w:W,h:H,left:+(x0/W*100).toFixed(2),top:+(y0/H*100).toFixed(2),width:+(bw/W*100).toFixed(2),height:+(bh/H*100).toFixed(2)};
 console.log(name,W+'x'+H,'outside%',outPct,'opening%',openPct,JSON.stringify(meta[name]));
}
fs.writeFileSync('tools/frames-meta.json',JSON.stringify(meta,null,1));})();
