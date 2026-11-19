"use client";

import { createPortal } from "react-dom";
import { useEffect,useId,useRef,useState } from "react";
import { visualCategories,visualAssetIssues,type VisualAsset,type VisualKind,type VisualCategory } from "@/lib/cms-media";

const names:Record<VisualCategory,string>={
  exterior:"واجهة الفندق",pool:"المسبح",rooms:"الغرف",restaurant:"المطعم",
  facilities:"المرافق",location:"الموقع",events:"الفعاليات",garden:"الحدائق",other:"أخرى"
};
type Props={
  assets:VisualAsset[];label:string;kind?:VisualKind|"all";value?:string;
  selected?:string[];multiple?:boolean;max?:number;
  onChange?:(src:string)=>void;onAdd?:(src:string[])=>void;
};
function Thumb({asset,large=false}:{asset:VisualAsset;large?:boolean}){
  const image=asset.kind==="image"?asset.src:asset.poster;
  return <div className={large?"opal-picker-thumb is-large":"opal-picker-thumb"}>
    {image
      // eslint-disable-next-line @next/next/no-img-element
      ?<img src={image} alt="" loading="lazy" decoding="async"/>
      :<div className="opal-picker-video-placeholder" aria-hidden="true"><span>▶</span><small>VIDEO</small></div>}
    {asset.kind==="video"&&<span className="opal-picker-film-badge" aria-hidden="true">▶</span>}
  </div>;
}

export function MediaPicker({assets,label,kind="image",value="",selected=[],multiple=false,max=100,onChange,onAdd}:Props){
  const titleId=useId();
  const trigger=useRef<HTMLButtonElement>(null);
  const searchInput=useRef<HTMLInputElement>(null);
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("all");
  const [kindFilter,setKindFilter]=useState<"all"|"image"|"video">("all");
  const [pending,setPending]=useState<string[]>([]);
  const [highlighted,setHighlighted]=useState("");
  const eligible=assets.filter(a=>kind==="all"||a.kind===kind);
  const currentAsset=eligible.find(a=>a.src===value);
  const selectedSet=new Set(selected);
  const remaining=Math.max(0,max-selected.length);
  const categories=visualCategories.filter(c=>eligible.some(a=>a.category===c));
  const filtered=eligible.filter(a=>
    (category==="all"||a.category===category)
    &&(kindFilter==="all"||a.kind===kindFilter)
    &&(!search.trim()||[a.title,a.altEn,a.altAr,a.category]
      .some(x=>x.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())))
  );
  const focusAsset=eligible.find(a=>a.src===highlighted);
  const isReady=(asset:VisualAsset)=>asset.approved&&Boolean(asset.altAr.trim())&&Boolean(asset.altEn.trim());

  const close=()=>{
    setOpen(false);
    requestAnimationFrame(()=>trigger.current?.focus({preventScroll:true}));
  };
  const openPicker=()=>{
    setSearch("");setCategory("all");setKindFilter("all");setPending([]);
    setHighlighted(multiple?"":value);
    setOpen(true);
  };
  const choose=(src:string)=>{
    setHighlighted(src);
    if(!multiple)return;
    if(selectedSet.has(src))return;
    setPending(old=>old.includes(src)?old.filter(x=>x!==src)
      :(old.length<remaining?[...old,src]:old));
  };
  const confirm=()=>{
    if(multiple){if(pending.length>0)onAdd?.(pending);}
    else if(highlighted)onChange?.(highlighted);
    close();
  };
  useEffect(()=>{
    if(!open)return;
    const oldOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const frame=requestAnimationFrame(()=>searchInput.current?.focus({preventScroll:true}));
    function keydown(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();close();}
      if(event.key!=="Tab")return;
      const dialog=document.getElementById(titleId+"-dialog");
      if(!dialog)return;
      const tabbable=Array.from(dialog.querySelectorAll<HTMLElement>(
        "button:not([disabled]),input:not([disabled]),select:not([disabled]),video[controls]"
      )).filter(x=>x.getClientRects().length>0);
      const first=tabbable[0],last=tabbable[tabbable.length-1];
      if(!first||!last)return;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    window.addEventListener("keydown",keydown);
    return ()=>{cancelAnimationFrame(frame);document.body.style.overflow=oldOverflow;window.removeEventListener("keydown",keydown);};
  // Intentionally keep the modal stable while selecting tiles.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[open,titleId]);

  return <>
    <div className="opal-picker-control">
      <button type="button" ref={trigger} className="opal-picker-trigger" aria-haspopup="dialog"
        aria-expanded={open} aria-label={label} onClick={openPicker}>
        {multiple?<span className="opal-picker-add-symbol" aria-hidden="true">＋</span>
          :currentAsset?<Thumb asset={currentAsset}/>
          :<span className="opal-picker-empty-symbol" aria-hidden="true">▧</span>}
        <span className="opal-picker-trigger-copy">
          <strong>{multiple?label:currentAsset?.title||"اختار من مكتبة الوسائط"}</strong>
          <small>{multiple?selected.length+" مستخدم · "+remaining+" متاح"
            :currentAsset?names[currentAsset.category]+" · "+(isReady(currentAsset)?"جاهز للنشر":"غير جاهز للنشر")
            :"اعرض الصور والفيديوهات كـThumbnails"}</small>
        </span>
        <span className="opal-picker-trigger-action" aria-hidden="true">{multiple?"＋ إضافة":"تغيير"}</span>
      </button>
      {!multiple&&value&&<button type="button" className="opal-picker-clear" onClick={()=>onChange?.("")}>
        إزالة الاختيار / استخدام الصورة الحالية
      </button>}
    </div>
    {open&&createPortal(
      <div className="opal-picker-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close();}}>
        <section id={titleId+"-dialog"} className="opal-picker-dialog" role="dialog"
          aria-modal="true" aria-labelledby={titleId} dir="rtl">
          <header className="opal-picker-header">
            <div>
              <small>OPAL LEGACY / MEDIA SELECTOR</small>
              <h2 id={titleId}>{label}</h2>
              <p>{multiple?"اختار صور أو فيديوهات، وبعدها أكد الإضافة":"اتفرج على الصورة قبل ما تختارها للسكشن"}</p>
            </div>
            <button type="button" className="opal-picker-close" onClick={close} aria-label="إغلاق اختيار الوسائط">×</button>
          </header>
          <div className="opal-picker-toolbar">
            <input ref={searchInput} type="search" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="بحث بالاسم أو وصف الصورة…" aria-label="بحث في الوسائط"/>
            <select value={category} onChange={e=>setCategory(e.target.value)} aria-label="تصنيف الوسائط">
              <option value="all">كل الأقسام</option>
              {categories.map(c=><option value={c} key={c}>{names[c]}</option>)}
            </select>
            {kind==="all"&&<div className="opal-picker-type-filter" role="group" aria-label="نوع الوسائط">
              {(["all","image","video"] as const).map(t=><button key={t} type="button"
                aria-pressed={kindFilter===t} onClick={()=>setKindFilter(t)}>
                {t==="all"?"الكل":t==="image"?"صور":"فيديو"}
              </button>)}
            </div>}
          </div>
          <div className="opal-picker-body">
            <div className="opal-picker-results">
              <p className="opal-picker-count">{filtered.length} نتيجة {multiple?"· "+pending.length+" متحدد":""}</p>
              <div className="opal-picker-grid" aria-label="اختيار الوسائط بالصور">
                {filtered.map(asset=>{
                  const picked=multiple?pending.includes(asset.src):highlighted===asset.src;
                  const used=multiple&&selectedSet.has(asset.src);
                  return <button type="button" key={asset.src}
                    disabled={used} onClick={()=>choose(asset.src)}
                    className={"opal-picker-tile"+(picked?" is-selected":"")+(used?" is-in-use":"")}
                    aria-pressed={picked}
                    aria-label={asset.title+"، "+names[asset.category]+(used?"، مضافة بالفعل":"")}>
                    <Thumb asset={asset}/>
                    <span className="opal-picker-tile-copy">
                      <strong title={asset.title}>{asset.title}</strong>
                      <small>{names[asset.category]} · {isReady(asset)?"جاهز للنشر":"غير جاهز للنشر"}</small>
                    </span>
                    <span className="opal-picker-tile-check" aria-hidden="true">{used||picked?"✓":"＋"}</span>
                  </button>;
                })}
              </div>
              {filtered.length===0&&<div className="opal-picker-no-results">
                <span aria-hidden="true">▧</span>
                <strong>{eligible.length?"مفيش صور مطابقة":"لسه مفيش وسائط مرفوعة"}</strong>
                <p>{eligible.length?"جرّب كلمة بحث تانية أو غيّر التصنيف":"ارفع الوسائط من المكتبة الأول."}</p>
              </div>}
            </div>
            <aside className="opal-picker-preview" aria-label="معاينة الوسيط المختار">
              {focusAsset?<>
                {focusAsset.kind==="image"?<Thumb asset={focusAsset} large/>
                  :<video key={focusAsset.src} src={focusAsset.src}
                    poster={focusAsset.poster||undefined} controls playsInline preload="none"
                    aria-label={focusAsset.altAr||focusAsset.title}/>}
                <strong>{focusAsset.title}</strong>
                <small>{names[focusAsset.category]} · {focusAsset.kind==="video"?"فيديو":"صورة"}</small>
                <p>{focusAsset.altAr||"مفيش وصف عربي مضاف"}</p>
                {!isReady(focusAsset)&&<p className="opal-picker-warning">
                  مش هيظهر على الموقع لحد ما تستكمل البيانات والحقوق من مكتبة الوسائط:
                  {(!focusAsset.altAr.trim()?" وصف عربي.":"")}
                  {(!focusAsset.altEn.trim()?" وصف إنجليزي.":"")}
                  {(!focusAsset.approved?" تأكيد حق النشر.":"")}
                </p>}
              </>:<div className="opal-picker-preview-empty">
                <span aria-hidden="true">▧</span>
                <p>اختار أي Thumbnail عشان تشوف معاينة أكبر هنا</p>
              </div>}
            </aside>
          </div>
          <footer className="opal-picker-footer">
            <span>{multiple?pending.length+" متحدد · الحد المتاح "+remaining
              :highlighted?"الوسيط جاهز للاختيار":"اختار صورة من الشبكة"}</span>
            <div>
              <button type="button" className="opal-picker-cancel" onClick={close}>إلغاء</button>
              <button type="button" className="opal-picker-confirm"
                disabled={multiple?pending.length===0:!highlighted} onClick={confirm}>
                {multiple?"إضافة "+pending.length+" للموقع":"استخدام الوسيط المختار"}
              </button>
            </div>
          </footer>
        </section>
      </div>,document.body
    )}
  </>;
}
