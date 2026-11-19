"use client";

import { useEffect,useMemo,useRef,useState,type ChangeEvent,type DragEvent } from "react";
import type { CmsSite } from "@/lib/cms-schema";
import { approvedAsset,unreadyVisualPlacements,visualAssetIssues,visualCategories,type VisualAsset,type CmsVisualLibrary } from "@/lib/cms-media";
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
  upload:(files:File[])=>Promise<void>;
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
  const [scrollToDetails,setScrollToDetails]=useState(false);
  const detailsRef=useRef<HTMLElement>(null);
  const visual=draft.media.visual;
  const assets=visual.assets;
  const photos=assets.filter(a=>a.kind==="image");
  const films=assets.filter(a=>a.kind==="video");
  const active=assets.find(a=>a.src===selected);
  const unready=unreadyVisualPlacements(visual);
  const uniqueUnready=Array.from(new Map(unready.map(item=>[item.src,item])).values());
  useEffect(()=>{
    if(!scrollToDetails||!active)return;
    detailsRef.current?.scrollIntoView({behavior:"smooth",block:"center"});
    setScrollToDetails(false);
  },[active,scrollToDetails]);
  const prepareAsset=(src:string)=>{
    setSelected(src);
    setScrollToDetails(true);
  };
  type SingleSlot="overviewMain"|"overviewInset"|"facilities"|"location";
  const renderReadiness=(src:string,slot:SingleSlot)=>{
    if(!src)return null;
    const issues=visualAssetIssues(visual,src);
    const current=published?.media.visual;
    const live=!!current&&current.placements[slot]===src&&!!approvedAsset(current,src);
    if(issues.length===0)return <p className="opal-media-ready" role="status">
      {live?"✓ الصورة دي معتمدة وموجودة في النسخة المنشورة":
        "✓ الصورة جاهزة، لكنها مش هتظهر للزوار إلا بعد «حفظ المسودة» و«نشر على الموقع»."}
    </p>;
    return <div className="opal-media-not-ready" role="status">
      <strong>الصورة المحددة مش هتظهر على الموقع — هيظهر البديل القديم.</strong>
      <span>المطلوب: {issues.join(" · ")}</span>
      <button type="button" onClick={()=>prepareAsset(src)}>
        استكمال بيانات الصورة واعتماد النشر
      </button>
    </div>;
  };
  const used=new Set<string>([
    ...visual.placements.hero,...visual.placements.gallery,
    visual.placements.overviewMain,visual.placements.overviewInset,
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
          {asset&&visualAssetIssues(visual,src).length>0&&
            <button type="button" className="opal-media-fix-link" onClick={()=>prepareAsset(src)}>
              غير جاهز للنشر — استكمال البيانات
            </button>}
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
        ارفع الصور والفيديوهات الحقيقية مرة واحدة، وبعدها وزعها على أقسام الموقع.
        الصور بتتضغط تلقائيًا لـWebP (حتى 2200px) علشان السرعة وحذف بيانات الكاميرا،
        والفيديو لازم يكون MP4 H.264 مُحسّن للويب. الملفات المسودة خاصة ومش بتظهر للزوار إلا بعد اعتماد الحقوق وربطها بالقسم ثم النشر.
      </p>
      {uniqueUnready.length>0&&<div className="opal-media-readiness-summary" role="status">
        <strong>{uniqueUnready.length} صورة/فيديو مرتبط بالأقسام لكنه غير جاهز للظهور.</strong>
        <p>مجرد اختيار الوسيط مش معناه نشره. افتح بياناته، اكتب وصف عربي وإنجليزي، وأكّد حق النشر، ثم احفظ المسودة وانشرها.</p>
        <button type="button" onClick={()=>prepareAsset(uniqueUnready[0].src)}>
          ابدأ بتجهيز أول وسيط غير معتمد
        </button>
      </div>}
      <div className="opal-media-stats">
        <strong>{photos.length}<small> صورة</small></strong>
        <strong>{films.length}<small> فيديو</small></strong>
        <strong>{assets.filter(a=>assetInfo(a)).length}<small> جاهز للنشر</small></strong>
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
          <span>{labels[a.category]} · {assetInfo(a)?"✓ جاهز":"○ غير جاهز للنشر"}</span>
          {used.has(a.src)&&<small>مرتبط بقسم</small>}
        </button>)}
        {assets.length===0&&<p className="opal-cms-note">المكتبة فاضية. ارفع الصور الحقيقية للفندق علشان تبدأ.</p>}
      </div>
    </section>
    {active&&<section ref={detailsRef} className="opal-cms-editor-card opal-media-approval-editor" aria-label="تفاصيل الوسيط المختار">
      <div className="opal-cms-editor-head"><span>ASSET DETAILS</span><h3>تعديل الوسيط المختار</h3></div>
      <div className="opal-media-details">
        {active.kind==="image"
          // eslint-disable-next-line @next/next/no-img-element
          ?<img src={active.src} alt={active.altAr||active.title}/>
          :<video src={active.src} controls preload="none" playsInline poster={active.poster||undefined}/>}
        <div className="opal-media-asset-fields">
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
          <label className="opal-cms-checkline"><input type="checkbox" checked={active.approved}
            onChange={e=>updateAsset(active.src,a=>{a.approved=e.target.checked;})}/>
            أؤكد أن الصورة/الفيديو حقيقي ومصرح بنشره على موقع الفندق
          </label>
          <small className={assetInfo(active)?"opal-media-ready":"opal-media-warning"}>
            {assetInfo(active)?"✓ بيانات الوسيط مكتملة. احفظ المسودة وانشر التغيير لو عايزه يظهر للزوار.":
              "لن يظهر هذا الوسيط للزوار حتى تستكمل: "+visualAssetIssues(visual,active.src).join(" · ")}
          </small>
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
      <div className="opal-cms-editor-head"><span>02 / SECTIONS</span><h3>الصور الرئيسية لكل سكشن</h3></div>
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
      <p className="opal-cms-help">اختار الوسائط المعتمدة ورتبها بالسحب أو الأسهم. الجاليري يقدر يعرض صور وفيديوهات معًا، والفيديو لا يتحمل قبل التشغيل.</p>
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
            {mapping.cover&&visualAssetIssues(visual,mapping.cover).length>0&&
              <button type="button" className="opal-media-fix-link" onClick={()=>prepareAsset(mapping.cover)}>
                الغلاف غير جاهز للنشر — استكمال الوصف والحقوق
              </button>}
          </div>
          <div className="opal-media-mapping">
            <span>فيديو اختياري</span>
            <MediaPicker assets={assets} label={"فيديو "+room.name.ar} kind="video"
              value={mapping.video} onChange={src=>edit(v=>{v.placements.rooms[room.slug].video=src;})}/>
            {mapping.video&&visualAssetIssues(visual,mapping.video).length>0&&
              <button type="button" className="opal-media-fix-link" onClick={()=>prepareAsset(mapping.video)}>
                الفيديو غير جاهز للنشر — استكمال الوصف والحقوق
              </button>}
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
              {visualAssetIssues(visual,src).length>0&&
                <button type="button" className="opal-media-fix-link" onClick={()=>prepareAsset(src)}>
                  غير جاهزة للنشر — تجهيز
                </button>}
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
    <div className="opal-cms-note">كل التغييرات دي مسودة فقط. اضغط «حفظ المسودة» ثم «معاينة» بالعربي والإنجليزي، وبعد مراجعة حقوق الصور اضغط «نشر على الموقع».</div>
  </div>;
}
