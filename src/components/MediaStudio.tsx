"use client";

import { useMemo,useState,type ChangeEvent,type DragEvent } from "react";
import type { CmsSite } from "@/lib/cms-schema";
import { approvedAsset,visualCategories,type VisualAsset,type CmsVisualLibrary } from "@/lib/cms-media";
import { roomConcepts } from "@/lib/room-concepts";
import { MediaPicker } from "@/components/MediaPicker";

const labels:Record<string,string>={
  exterior:"واجهة الفندق",pool:"المسبح",rooms:"الغرف",restaurant:"المطعم",
  facilities:"المرافق",location:"الموقع",events:"الفعاليات",garden:"الحدائق",other:"أخرى"
};
type Props={
  draft:CmsSite;
  published:CmsSite|null;
  change:(updater:(previous:CmsSite|null)=>CmsSite|null)=>void;
  upload:(files:File[])=>Promise<string[]>;
  uploading:string;
};
const move=(items:string[],index:number,delta:number)=>{
  const next=[...items],other=index+delta;
  if(other<0||other>=next.length)return next;
  [next[index],next[other]]=[next[other],next[index]];
  return next;
};
const removeRefs=(visual:CmsVisualLibrary,src:string)=>{
  const p=visual.placements;
  const clean=(value:string)=>value===src?"":value;
  p.hero=p.hero.filter(x=>x!==src);
  p.gallery=p.gallery.filter(x=>x!==src);
  p.overviewMain=clean(p.overviewMain);p.overviewInset=clean(p.overviewInset);
  p.overviewVideo=clean(p.overviewVideo);
  p.facilities=clean(p.facilities);p.location=clean(p.location);
  for(const room of Object.values(p.rooms)){
    room.cover=clean(room.cover);room.video=clean(room.video);
    room.gallery=room.gallery.filter(x=>x!==src);
  }
  visual.assets=visual.assets.filter(x=>x.src!==src).map(a=>({...a,poster:clean(a.poster)}));
};
export async function optimizeMediaPhoto(file:File):Promise<File>{
  if(file.type==="image/svg+xml")throw new Error("SVG غير مدعوم.");
  if(!("createImageBitmap" in window)){
    if(file.size<=4*1024*1024)return file;
    throw new Error("المتصفح لا يدعم ضغط الصور؛ استخدم WebP أقل من 4 MB.");
  }
  const bitmap=await createImageBitmap(file);
  try{
    const ratio=Math.min(1,2200/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(bitmap.width*ratio));
    canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
    const ctx=canvas.getContext("2d");
    if(!ctx)throw new Error("تعذر معالجة الصورة.");
    ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/webp",0.82));
    if(!blob||blob.type!=="image/webp")blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",0.83));
    if(!blob||blob.size>4*1024*1024)throw new Error("الصورة أكبر من حد الرفع بعد الضغط.");
    return new File([blob],file.name.replace(/\.[^.]+$/,"")+(blob.type==="image/webp"?".webp":".jpg"),{type:blob.type});
  }finally{bitmap.close();}
}
export function MediaStudio({draft,published,change,upload,uploading}:Props){
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("all");
  const [selected,setSelected]=useState("");
  const visual=draft.media.visual;
  const assets=visual.assets;
  const photos=assets.filter(a=>a.kind==="image");
  const films=assets.filter(a=>a.kind==="video");
  const active=assets.find(a=>a.src===selected);
  type SingleSlot="overviewMain"|"overviewInset"|"facilities"|"location";
  const renderReadiness=(src:string,slot:SingleSlot)=>{
    if(!src)return null;
    const current=published?.media.visual;
    const live=!!current&&current.placements[slot]===src&&!!approvedAsset(current,src);
    return <p className="opal-media-ready" role="status">
      {live?"✓ الصورة ظاهرة حاليًا على الموقع":
        "✓ الصورة متحددة. اضغط «حفظ ونشر الآن» فوق، ووافق مرة واحدة على حقوق الصور."}
    </p>;
  };
  const used=new Set<string>([
    ...visual.placements.hero,...visual.placements.gallery,
    visual.placements.overviewMain,visual.placements.overviewInset,visual.placements.overviewVideo,
    visual.placements.facilities,visual.placements.location,
    ...Object.values(visual.placements.rooms).flatMap(x=>[x.cover,...x.gallery,x.video])
  ]);
  const filtered=useMemo(()=>assets.filter(a=>
    (category==="all"||a.category===category)&&(
      !query.trim()||[a.title,a.altEn,a.altAr,a.category].some(value=>value.toLowerCase().includes(query.toLowerCase()))
    )),[assets,query,category]);
  const edit=(fn:(v:CmsVisualLibrary)=>void)=>change(old=>{
    if(!old)return old;
    const next=structuredClone(old);
    fn(next.media.visual);
    return next;
  });
  const updateAsset=(src:string,fn:(a:VisualAsset)=>void)=>edit(v=>{
    const target=v.assets.find(a=>a.src===src);
    if(target)fn(target);
  });
  const append=(target:"hero"|"gallery",sources:string[])=>{
    edit(v=>{
      const list=v.placements[target];
      for(const src of sources){
        if(!list.includes(src)&&list.length<(target==="hero"?6:100))list.push(src);
      }
    });
  };
  const renderOrder=(target:"hero"|"gallery")=>{
    const selectedList=visual.placements[target];
    return <div className="opal-media-order">
      {selectedList.map((src,i)=>{
        const asset=assets.find(a=>a.src===src);
        return <div className="opal-media-order-row" key={src}
          draggable
          onDragStart={e=>e.dataTransfer.setData("text/plain",String(i))}
          onDragOver={e=>e.preventDefault()}
          onDrop={(e:DragEvent<HTMLDivElement>)=>{
            e.preventDefault();
            const from=Number(e.dataTransfer.getData("text/plain"));
            if(!Number.isSafeInteger(from)||from<0||from>=selectedList.length)return;
            edit(v=>{
              const list=v.placements[target];
              const [picked]=list.splice(from,1);
              list.splice(i,0,picked);
            });
          }}>
          <span>{String(i+1).padStart(2,"0")}</span>
          <span className="opal-media-order-thumb">
            {asset?.kind==="image"
              // eslint-disable-next-line @next/next/no-img-element
              ?<img src={asset.src} alt="" loading="lazy"/>
              :asset?.kind==="video"&&asset.poster
                // eslint-disable-next-line @next/next/no-img-element
                ?<img src={asset.poster} alt="" loading="lazy"/>
                :<span aria-hidden="true">▶</span>}
          </span>
          <strong>{asset?.title||"Media"}</strong>
          {asset&&!asset.approved&&<small className="opal-media-ready">جاهز للاستخدام عند النشر</small>}
          <span className="opal-media-order-buttons">
            <button type="button" disabled={i===0} onClick={()=>edit(v=>{v.placements[target]=move(v.placements[target],i,-1);})} aria-label="رفع الترتيب">↑</button>
            <button type="button" disabled={i===selectedList.length-1} onClick={()=>edit(v=>{v.placements[target]=move(v.placements[target],i,1);})} aria-label="خفض الترتيب">↓</button>
            <button type="button" onClick={()=>edit(v=>{v.placements[target].splice(i,1);})} aria-label="إزالة من القسم">×</button>
          </span>
        </div>;
      })}
      {selectedList.length===0&&<p className="opal-cms-help">مفيش وسائط مخصصة للقسم. الموقع هيستخدم الصور الحالية لحين النشر.</p>}
    </div>;
  };
  const assetInfo=(asset:VisualAsset)=>approvedAsset(visual,asset.src);
  return <div className="opal-cms-stack">
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>MEDIA-FIRST / V2</span><h3>مكتبة صور وفيديوهات الفندق</h3></div>
      <p className="opal-cms-note">
        ارفع الصور والفيديوهات، واختار صورتك لكل قسم، ثم اضغط «حفظ ونشر الآن».
        مش مطلوب كتابة وصف عربي أو إنجليزي لكل صورة. هتأكد حقوق النشر مرة واحدة قبل النشر.
        الصور بتتضغط تلقائيًا لتحسين سرعة الموقع.
      </p>
      <div className="opal-media-stats">
        <strong>{photos.length}<small> صورة</small></strong>
        <strong>{films.length}<small> فيديو</small></strong>
        <strong>{assets.filter(a=>assetInfo(a)).length}<small> منشور سابقًا</small></strong>
        <strong>{used.size-(used.has("")?1:0)}<small> مرتبط بالموقع</small></strong>
      </div>
      <label className="opal-media-upload">
        <span>+ رفع صور وفيديوهات متعددة</span>
        <small>صور JPG/PNG/WebP أو فيديو MP4. صور حتى 4 MB بعد التحسين، فيديو حتى 50 MB.</small>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,.mp4" multiple
          disabled={Boolean(uploading)}
          onChange={(e:ChangeEvent<HTMLInputElement>)=>{
            const files=Array.from(e.currentTarget.files||[]);
            if(files.length)void upload(files);
            e.currentTarget.value="";
          }}/>
      </label>
      {uploading&&<p role="status" className="opal-cms-message">{uploading}</p>}
      <div className="opal-media-filters">
        <input type="search" placeholder="ابحث باسم الملف أو الوصف" value={query} onChange={e=>setQuery(e.currentTarget.value)}
          aria-label="بحث في مكتبة الوسائط"/>
        <select value={category} onChange={e=>setCategory(e.currentTarget.value)} aria-label="فلترة حسب نوع المكان">
          <option value="all">كل التصنيفات</option>
          {visualCategories.map(x=><option key={x} value={x}>{labels[x]}</option>)}
        </select>
      </div>
      <div className="opal-media-cards">
        {filtered.map(a=><button key={a.src} type="button"
          className={`opal-media-card${selected===a.src?" is-selected":""}`}
          onClick={()=>setSelected(a.src)}>
          {a.kind==="image"
            // eslint-disable-next-line @next/next/no-img-element
            ?<img src={a.src} alt={a.altAr||a.title} loading="lazy"/>
            :a.poster
              // eslint-disable-next-line @next/next/no-img-element
              ?<div className="opal-media-video-cover"><img src={a.poster} alt="" loading="lazy"/><span>▶ VIDEO</span></div>
              :<div className="opal-media-video-icon">▶<small>VIDEO</small></div>}
          <strong title={a.title}>{a.title}</strong>
          <span>{labels[a.category]} · {assetInfo(a)?"✓ معتمد سابقًا":"جاهز عند النشر"}</span>
          {used.has(a.src)&&<small>مرتبط بقسم</small>}
        </button>)}
        {assets.length===0&&<p className="opal-cms-note">المكتبة فاضية. ارفع الصور الحقيقية للفندق علشان تبدأ.</p>}
      </div>
    </section>
    {active&&<section className="opal-cms-editor-card opal-media-approval-editor" aria-label="تفاصيل الوسيط المختار">
      <div className="opal-cms-editor-head"><span>ASSET DETAILS</span><h3>معاينة الوسيط</h3></div>
      <div className="opal-media-details">
        {active.kind==="image"
          // eslint-disable-next-line @next/next/no-img-element
          ?<img src={active.src} alt={active.altAr||active.title}/>
          :<video src={active.src} controls preload="none" playsInline poster={active.poster||undefined}/>}
        <div className="opal-media-asset-fields">
          <p className="opal-media-ready">الوسيط جاهز للاختيار. الوصف والتصنيف اختياريين؛ هيتضاف وصف مناسب تلقائيًا عند العرض.</p>
          <details className="opal-media-optional-details"><summary>تعديل الاسم والتصنيف والوصف (اختياري)</summary>
          <label>اسم داخلي <input value={active.title} maxLength={100}
            onChange={e=>updateAsset(active.src,a=>{a.title=e.target.value;})}/></label>
          <label>التصنيف <select value={active.category}
            onChange={e=>updateAsset(active.src,a=>{a.category=e.target.value as VisualAsset["category"];})}>
            {visualCategories.map(x=><option key={x} value={x}>{labels[x]}</option>)}
          </select></label>
          <label>وصف عربي <input value={active.altAr} maxLength={160}
            onChange={e=>updateAsset(active.src,a=>{a.altAr=e.target.value;})}/></label>
          <label>English alt / description <input value={active.altEn} maxLength={160} dir="ltr"
            onChange={e=>updateAsset(active.src,a=>{a.altEn=e.target.value;})}/></label>
          {active.kind==="video"&&<div className="opal-media-mapping">
            <span>Poster للفيديو</span>
            <MediaPicker assets={assets} label="صورة بوستر للفيديو" kind="image"
              value={active.poster} onChange={src=>updateAsset(active.src,a=>{a.poster=src;})}/>
          </div>}
          </details>
          <button className="opal-cms-outline" type="button" onClick={()=>{
            if(!window.confirm("إزالة الوسيط من المكتبة وكل الأقسام؟ الملف القديم يظل محفوظًا لتاريخ النسخ."))return;
            edit(v=>removeRefs(v,active.src));setSelected("");
          }}>إزالة من المكتبة</button>
        </div>
      </div>
    </section>}
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>01 / HERO</span><h3>اختار صور الـHero بالترتيب</h3></div>
      <div className="opal-media-add">
        <MediaPicker assets={assets} label="إضافة صور للـHero" kind="image" multiple max={6}
          selected={visual.placements.hero} onAdd={sources=>append("hero",sources)}/>
      </div>
      {renderOrder("hero")}
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>02 / SECTIONS</span><h3>وسائط أقسام الموقع</h3></div>
      <div className="opal-overview-video-editor">
        <div className="opal-overview-video-editor-heading">
          <div>
            <strong>فيديو Overview — جنب الكلام</strong>
            <p>اختار فيديو MP4، وهيظهر مكان الصورتين في السكشن. صورة الـOverview الكبيرة هتكون Poster قبل التشغيل تلقائيًا. الفيديو مش هيشتغل أو يتحمل إلا لما الزائر يضغط Play.</p>
          </div>
          {visual.placements.overviewVideo&&<span className="opal-overview-video-selected">فيديو متحدد ✓</span>}
        </div>
        <div className="opal-overview-video-actions">
          <label className="opal-overview-video-upload">
            <span>{uploading?"جاري رفع الفيديو…":"＋ ارفع فيديو للـOverview"}</span>
            <small>MP4 · حتى 50MB</small>
            <input type="file" accept="video/mp4,.mp4" disabled={Boolean(uploading)}
              onChange={event=>{
                const file=event.currentTarget.files?.[0];
                if(file)void (async()=>{
                  const paths=await upload([file]);
                  if(paths[0])edit(v=>{v.placements.overviewVideo=paths[0];});
                })();
                event.currentTarget.value="";
              }}/>
          </label>
          <div className="opal-overview-video-existing">
            <MediaPicker assets={assets} label="أو اختار فيديو مرفوع قبل كده" kind="video"
              value={visual.placements.overviewVideo}
              onChange={src=>edit(v=>{v.placements.overviewVideo=src;})}/>
          </div>
        </div>
        {visual.placements.overviewVideo&&<>
          <video className="opal-overview-video-admin-preview" controls playsInline preload="none"
            poster={assets.find(a=>a.src===visual.placements.overviewVideo)?.poster||visual.placements.overviewMain||undefined}
            src={visual.placements.overviewVideo}
            aria-label="معاينة فيديو Overview"/>
          <p className="opal-media-ready">✓ الفيديو متحدد. اضغط «حفظ ونشر الآن» مرة واحدة عشان يظهر في السكشن بالعربي والإنجليزي.</p>
        </>}
        <p className="opal-cms-help">من غير فيديو: هيفضل عرض الصورتين الحالي. لإلغاء الفيديو اختار «إزالة الاختيار» من زر اختيار الفيديو. للمعاينة قبل النشر احفظ المسودة الأول؛ أو اضغط «حفظ ونشر الآن» مباشرة.</p>
      </div>
      <h4 className="opal-overview-photo-fallback-heading">صور الـOverview (Poster وبديل الفيديو)</h4>
      {([
        ["overviewMain","Overview — الصورة الكبيرة"],
        ["overviewInset","Overview — الصورة الصغيرة"],
        ["facilities","Facilities — صورة المرافق"],
        ["location","Location — صورة الموقع"]
      ] as const).map(([slot,label])=><div key={slot} className="opal-media-mapping">
        <span>{label}</span>
        <MediaPicker assets={assets} label={label} kind="image"
          value={visual.placements[slot]} onChange={src=>edit(v=>{v.placements[slot]=src;})}/>
        {renderReadiness(visual.placements[slot],slot)}
      </div>)}
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>03 / GALLERY</span><h3>معرض صور وفيديوهات الفندق</h3></div>
      <p className="opal-cms-help">اختار الصور أو الفيديوهات ورتبها. مش مطلوب توثيق لكل صورة؛ تأكيد النشر مرة واحدة. الفيديو ما بيتحمّلش إلا عند التشغيل.</p>
      <div className="opal-media-add">
        <MediaPicker assets={assets} label="إضافة صور وفيديوهات للجاليري"
          kind="all" multiple max={100} selected={visual.placements.gallery}
          onAdd={sources=>append("gallery",sources)}/>
      </div>
      {renderOrder("gallery")}
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>04 / ROOMS</span><h3>صور وفيديو مستقل لكل غرفة</h3></div>
      <p className="opal-cms-note">أسماء الغرف الحالية تصورات تصميمية حتى يتم اعتماد بيانات الفندق؛ ربط الصور لا يفعّل حجوزات أو أسعار.</p>
      {roomConcepts.map(room=>{
        const mapping=visual.placements.rooms[room.slug];
        return <div key={room.slug} className="opal-media-room-map">
          <h4>{room.name.ar} <small>{room.name.en}</small></h4>
          <div className="opal-media-mapping">
            <span>صورة الغرفة الأساسية</span>
            <MediaPicker assets={assets} label={"غلاف "+room.name.ar} kind="image"
              value={mapping.cover} onChange={src=>edit(v=>{v.placements.rooms[room.slug].cover=src;})}/>

          </div>
          <div className="opal-media-mapping">
            <span>فيديو اختياري</span>
            <MediaPicker assets={assets} label={"فيديو "+room.name.ar} kind="video"
              value={mapping.video} onChange={src=>edit(v=>{v.placements.rooms[room.slug].video=src;})}/>

          </div>
          <div className="opal-media-add">
            <MediaPicker assets={assets} label={"إضافة صور لمعرض "+room.name.ar} kind="image"
              multiple max={16} selected={mapping.gallery} onAdd={sources=>edit(v=>{
                const list=v.placements.rooms[room.slug].gallery;
                for(const src of sources){if(!list.includes(src)&&list.length<16)list.push(src);}
              })}/>
          </div>
          <div className="opal-media-order">
            {mapping.gallery.map((src,i)=><div key={src} className="opal-media-order-row">
              <span>{i+1}</span>
              <span className="opal-media-order-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy"/>
              </span>
              <strong>{assets.find(a=>a.src===src)?.title}</strong>

              <span className="opal-media-order-buttons">
                <button type="button" disabled={i===0} onClick={()=>edit(v=>{
                  const list=v.placements.rooms[room.slug].gallery;
                  v.placements.rooms[room.slug].gallery=move(list,i,-1);
                })}>↑</button>
                <button type="button" disabled={i===mapping.gallery.length-1} onClick={()=>edit(v=>{
                  const list=v.placements.rooms[room.slug].gallery;
                  v.placements.rooms[room.slug].gallery=move(list,i,1);
                })}>↓</button>
                <button type="button" onClick={()=>edit(v=>{v.placements.rooms[room.slug].gallery.splice(i,1);})}>×</button>
              </span>
            </div>)}
          </div>
        </div>;
      })}
    </section>
    <div className="opal-cms-note">بعد اختيار الصور، اضغط «حفظ ونشر الآن» من أعلى الصفحة. لو عاوز تراجع الأول، استخدم «معاينة المسودة».</div>
  </div>;
}
