"use client";

import { useCallback,useEffect,useState,type ChangeEvent,type ReactNode } from "react";
import type { CmsLocale,CmsMediaRole,CmsSectionId,CmsSite } from "@/lib/cms-schema";
import { cmsSectionIds,hasApprovedCmsLogo,hasApprovedCmsHeroVideo,hasApprovedCmsFullFilm,hasCompleteCmsMedia,mediaRoles } from "@/lib/cms-schema";
import type { Locale } from "@/lib/hotel-content";
import { MediaStudio,optimizeMediaPhoto } from "@/components/MediaStudio";
import { unreadyVisualPlacements } from "@/lib/cms-media";

type Tab="content"|"sections"|"media"|"visual"|"history";
type HistoryRow={revision:number;updatedAt:string};
const sectionNames:Record<CmsSectionId,{en:string;ar:string}>={
  overview:{en:"Story",ar:"القصة"},facilities:{en:"Facilities",ar:"المرافق"},
  location:{en:"Location",ar:"الموقع"},rooms:{en:"Rooms",ar:"الغرف"},
  gallery:{en:"Gallery",ar:"الصور"},reviews:{en:"Reviews",ar:"التقييمات"},
  contact:{en:"Contact",ar:"التواصل"}
};
const imageNames:Record<CmsMediaRole,{en:string;ar:string}>={
  exterior:{en:"Hotel exterior / Hero 1",ar:"واجهة الفندق / البانر ١"},
  garden:{en:"Property garden / Hero 2",ar:"حديقة أو ساحة الفندق / البانر ٢"},
  roomMain:{en:"Main room / Hero 3",ar:"الغرفة الرئيسية / البانر ٣"},
  roomSecondary:{en:"Second room angle",ar:"صورة غرفة إضافية"},
  architecture:{en:"Architecture / Story",ar:"التفاصيل المعمارية / القصة"},
  roomDetail:{en:"Room detail",ar:"تفاصيل الغرفة"}
};
function CopyLabel({children,small}:{children:ReactNode;small?:string}){
  return <span className="opal-cms-label">{children}{small&&<small>{small}</small>}</span>;
}
function TextField({label,value,onChange,multiline=false,hint}:{label:string;value:string;onChange:(value:string)=>void;multiline?:boolean;hint?:string}){
  return <label className="opal-cms-field">
    <CopyLabel small={hint}>{label}</CopyLabel>
    {multiline?<textarea value={value} onChange={event=>onChange(event.target.value)} rows={4} spellCheck/>:
      <input type="text" value={value} onChange={event=>onChange(event.target.value)} spellCheck/>}
  </label>;
}
function deepCopy<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
function mergeLines(value:string):string[]{return value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function SectionEditor({draft,locale,change}:{draft:CmsSite;locale:Locale;change:(next:CmsSite)=>void}){
  const edit=(id:CmsSectionId,key:"kicker"|"title"|"accent"|"description",value:string)=>{
    const next=deepCopy(draft);next.locales[locale].headings[id][key]=value;change(next);
  };
  const move=(id:CmsSectionId,dir:-1|1)=>{
    const index=draft.sections.findIndex(item=>item.id===id);
    const target=index+dir;
    if(target<0||target>=draft.sections.length)return;
    const next=deepCopy(draft);
    [next.sections[index],next.sections[target]]=[next.sections[target],next.sections[index]];
    change(next);
  };
  return <div className="opal-cms-stack">
    <div className="opal-cms-note">اختار الأقسام اللي تظهر للزائر، وغيّر ترتيبها وعناوينها. حقل الوصف بيظهر أسفل العنوان عند توفر مساحة مناسبة.</div>
    {draft.sections.map((section,i)=>{
      const h=draft.locales[locale].headings[section.id];
      return <section className="opal-cms-editor-card" key={section.id}>
        <div className="opal-cms-editor-card-top">
          <div className="opal-cms-editor-number">{String(i+1).padStart(2,"0")}</div>
          <div className="opal-cms-editor-card-title"><h3>{sectionNames[section.id][locale]}</h3><small>#{section.id}</small></div>
          <label className="opal-cms-toggle"><input type="checkbox" checked={section.visible}
            onChange={e=>{const next=deepCopy(draft);next.sections[i].visible=e.target.checked;change(next);}}/>
            <span>{section.visible?"ظاهر":"مخفي"}</span></label>
          <div className="opal-cms-sort-controls">
            <button type="button" onClick={()=>move(section.id,-1)} disabled={i===0} aria-label="تحريك لأعلى">↑</button>
            <button type="button" onClick={()=>move(section.id,1)} disabled={i===draft.sections.length-1} aria-label="تحريك لأسفل">↓</button>
          </div>
        </div>
        <div className="opal-cms-grid-two">
          <TextField label="النص التمهيدي" value={h.kicker} onChange={x=>edit(section.id,"kicker",x)}/>
          <TextField label="العنوان الرئيسي" value={h.title} onChange={x=>edit(section.id,"title",x)}/>
          <TextField label="الجزء المميز من العنوان" value={h.accent} onChange={x=>edit(section.id,"accent",x)}/>
          <TextField label="وصف القسم" value={h.description} onChange={x=>edit(section.id,"description",x)} multiline/>
        </div>
      </section>;
    })}
  </div>;
}
function ContentEditor({draft,locale,change}:{draft:CmsSite;locale:Locale;change:(doc:CmsSite)=>void}){
  const data=draft.locales[locale];
  const edit=(fn:(localeData:CmsLocale)=>void)=>{
    const next=deepCopy(draft);
    fn(next.locales[locale]);change(next);
  };
  return <div className="opal-cms-stack">
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>01 / المعلومات الأساسية</span><h3>هوية الفندق ومعلومات البحث</h3></div>
      <div className="opal-cms-grid-two">
        <TextField label="اسم الفندق" value={data.hotelName} onChange={x=>edit(d=>{d.hotelName=x;})}/>
        <TextField label="عنوان الفندق" value={data.address} onChange={x=>edit(d=>{d.address=x;})}/>
      </div>
      <TextField label="وصف نتائج البحث (SEO)" multiline value={data.metaDescription} onChange={x=>edit(d=>{d.metaDescription=x;})}/>
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>02 / الواجهة الرئيسية</span><h3>Hero / أول انطباع</h3></div>
      <div className="opal-cms-grid-two">
        <TextField label="النص العلوي" value={data.hero.kicker} onChange={x=>edit(d=>{d.hero.kicker=x;})}/>
        <TextField label="عنوان البانر" value={data.hero.title} onChange={x=>edit(d=>{d.hero.title=x;})}/>
        <TextField label="تكملة العنوان" value={data.hero.accent} onChange={x=>edit(d=>{d.hero.accent=x;})}/>
        <TextField label="الوصف المختصر" multiline value={data.hero.description} onChange={x=>edit(d=>{d.hero.description=x;})}/>
      </div>
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>03 / وصف المكان</span><h3>الفندق والمزايا</h3></div>
      <TextField label="الفقرات التعريفية" hint="كل سطر فقرة مستقلة" multiline
        value={data.overview.join("\n")} onChange={x=>edit(d=>{d.overview=mergeLines(x);})}/>
      <TextField label="المزايا المختصرة" hint="ميزة في كل سطر" multiline
        value={data.quick.join("\n")} onChange={x=>edit(d=>{d.quick=mergeLines(x);})}/>
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>04 / المرافق</span><h3>المرافق والخدمات</h3></div>
      {data.facilities.map((facility,i)=><div className="opal-cms-list-row" key={i}>
        <div className="opal-cms-list-row-header"><strong>مجموعة {i+1}</strong>
          <button type="button" className="opal-cms-text-action" onClick={()=>edit(d=>{d.facilities.splice(i,1);})}>حذف</button></div>
        <div className="opal-cms-grid-two">
          <TextField label="اسم المجموعة" value={facility.title} onChange={x=>edit(d=>{d.facilities[i].title=x;})}/>
          <TextField label="الخدمات" hint="خدمة في كل سطر" value={facility.items.join("\n")} multiline onChange={x=>edit(d=>{d.facilities[i].items=mergeLines(x);})}/>
        </div>
      </div>)}
      <button className="opal-cms-outline" type="button" onClick={()=>edit(d=>{d.facilities.push({title:locale==="ar"?"مجموعة جديدة":"New category",items:["New amenity"]});})}>
        + إضافة مجموعة مرافق
      </button>
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>05 / الموقع</span><h3>المعالم والمسافات</h3></div>
      {data.attractions.map((attraction,i)=><div className="opal-cms-attraction" key={i}>
        <TextField label="المكان" value={attraction.name} onChange={x=>edit(d=>{d.attractions[i].name=x;})}/>
        <TextField label="المسافة" value={attraction.distance} onChange={x=>edit(d=>{d.attractions[i].distance=x;})}/>
        <button type="button" aria-label="حذف المكان" onClick={()=>edit(d=>{d.attractions.splice(i,1);})}>×</button>
      </div>)}
      <button type="button" className="opal-cms-outline" onClick={()=>edit(d=>{d.attractions.push({name:"New place",distance:"—"});})}>+ إضافة مكان</button>
    </section>
  </div>;
}
function MediaEditor({draft,change,onUpload,onVideoUpload,uploading}:{
  draft:CmsSite;change:(doc:CmsSite)=>void;
  onUpload:(file:File,role:CmsMediaRole|"logo"|"poster")=>Promise<void>;
  onVideoUpload:(file:File,role:"desktop"|"mobile"|"film")=>Promise<void>;uploading:string
}){
  const edit=(fn:(doc:CmsSite)=>void)=>{const next=deepCopy(draft);fn(next);change(next);};
  const imagePicker=(role:CmsMediaRole|"logo"|"poster")=><input type="file" accept="image/png,image/jpeg,image/webp"
    disabled={Boolean(uploading)} aria-label={`رفع ${role}`}
    onChange={(event:ChangeEvent<HTMLInputElement>)=>{
      const file=event.currentTarget.files?.[0];if(file)void onUpload(file,role);
      event.currentTarget.value="";
    }}/>;
  return <div className="opal-cms-stack">
    <div className="opal-cms-note">ارفع الصور الحقيقية المصرح باستخدامها فقط (JPEG / WebP / PNG، بحد أقصى 4MB). الصور بتتحفظ بشكل دائم على السيرفر. اللوجو بيتنشر بشكل مستقل بعد اعتماد حقوقه وحفظ المسودة والضغط على «نشر على الموقع». الصور الست هنا هي النظام القديم؛ لو عاوز تتحكم في كل صورة وفيديو بشكل مستقل استخدم «مكتبة الوسائط V2» من القائمة.</div>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>01 / الهوية</span><h3>اللوجو الرسمي — الهيدر والموبايل</h3></div>
      <div className="opal-cms-media-line">
        <div className="opal-cms-upload-preview">{draft.media.logo?
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.media.logo} alt="اللوجو المحفوظ"/>:<span>LOGO</span>}</div>
        <div><CopyLabel>تغيير اللوجو</CopyLabel>{imagePicker("logo")}
          <label className="opal-cms-checkline"><input type="checkbox" checked={draft.media.logoApproved}
            onChange={e=>edit(d=>{d.media.logoApproved=e.target.checked;})}/> أؤكد امتلاك حق استخدام هذا اللوجو</label>
        </div>
      </div>
      <p className="opal-cms-note">{hasApprovedCmsLogo(draft)
        ?"✓ اللوجو معتمد وجاهز للظهور في الهيدر بعد حفظ المسودة والنشر."
        :"ارفع اللوجو وفعّل موافقة الحقوق، ثم احفظ المسودة واضغط نشر. لا يلزم رفع باقي الصور."}</p>
    </section>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>02 / الصور</span><h3>مكتبة الصور الست الأساسية</h3></div>
      <div className="opal-cms-photo-grid">
        {mediaRoles.map(role=>{
          const photo=draft.media.photos[role];
          return <div className="opal-cms-photo-card" key={role}>
            <div className="opal-cms-photo-visual">{photo.src?
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.src} alt={photo.altAr||role}/>:
              <span>NO IMAGE</span>}</div>
            <h4>{imageNames[role].ar} <small>{imageNames[role].en}</small></h4>
            {imagePicker(role)}
            <TextField label="وصف الصورة بالعربي" value={photo.altAr} onChange={x=>edit(d=>{d.media.photos[role].altAr=x;})}/>
            <TextField label="Image description (EN)" value={photo.altEn} onChange={x=>edit(d=>{d.media.photos[role].altEn=x;})}/>
            <label className="opal-cms-checkline"><input type="checkbox" checked={photo.rightsConfirmed}
              onChange={e=>edit(d=>{d.media.photos[role].rightsConfirmed=e.target.checked;})}/> الصورة حقيقية ومعتمدة ولدي حق استخدامها</label>
          </div>;
        })}
      </div>
    </section>
    <div className="opal-cms-photo-status"><strong>{hasCompleteCmsMedia(draft)?"✓ مكتبة الصور جاهزة للنشر":"الصور غير مكتملة بعد"}</strong>
      <p>النظام القديم بيشترط اكتمال الصور الست معًا. أما مكتبة الوسائط V2 فتسمح بتغيير كل قسم أو غرفة أو جاليري بشكل مستقل بعد الاعتماد والنشر.</p></div>
    <section className="opal-cms-editor-card">
      <div className="opal-cms-editor-head"><span>03 / HERO VIDEO</span><h3>فيديو خلفية الموقع والفيلم الكامل</h3></div>
      <p className="opal-cms-note">فيديو الـHero يكون MP4 / H.264 بصيغة Web Optimized (faststart)، صامت ويفضل 10–15 ثانية.
        حد الكمبيوتر 6 MB والموبايل 4 MB. الفيلم الكامل اختياري وبحد أقصى 50 MB.
        الفيديو بيشتغل تلقائيًا بصمت عند توفر اتصال مناسب؛ صورة الـPoster بتظهر أولًا.</p>
      <label className="opal-cms-checkline">
        <input type="checkbox" checked={draft.media.video.enabled}
          onChange={e=>edit(d=>{d.media.video.enabled=e.target.checked;})}/>
        تفعيل فيديو الخلفية بدل صور الـHero بعد الاعتماد والنشر
      </label>
      <div className="opal-cms-video-grid">
        {([["desktop","فيديو الكمبيوتر (MP4) — حتى 6 MB"],
           ["mobile","نسخة موبايل اختيارية (MP4) — حتى 4 MB"],
           ["film","الفيلم الكامل (MP4) — حتى 50 MB"]] as const).map(([role,label])=>{
          const src=role==="desktop"?draft.media.video.desktopSrc
            :role==="mobile"?draft.media.video.mobileSrc:draft.media.video.fullFilmSrc;
          return <div className="opal-cms-video-card" key={role}>
            <CopyLabel>{label}</CopyLabel>
            <input type="file" accept="video/mp4,.mp4" disabled={Boolean(uploading)}
              aria-label={`رفع فيديو ${role}`}
              onChange={(event:ChangeEvent<HTMLInputElement>)=>{
                const file=event.currentTarget.files?.[0];if(file)void onVideoUpload(file,role);
                event.currentTarget.value="";
              }}/>
            {src&&<>
              <video src={src} controls preload="none" playsInline
                aria-label={label} poster={draft.media.video.posterSrc||undefined}/>
              <small>تم رفع الملف · المعاينة لا تعني النشر</small>
            </>}
          </div>;
        })}
      </div>
      <div className="opal-cms-video-poster">
        <div className="opal-cms-photo-visual">
          {draft.media.video.posterSrc
            // eslint-disable-next-line @next/next/no-img-element
            ?<img src={draft.media.video.posterSrc} alt="صورة خلفية الفيديو قبل التشغيل"/>
            :<span>HERO POSTER</span>}
        </div>
        <div><CopyLabel>Poster — صورة تظهر فور فتح الموقع (WebP / JPG / PNG، حتى 4 MB)</CopyLabel>
          {imagePicker("poster")}
          <p className="opal-cms-help">يفضل مقاس 16:9، وحجم أقل من 250 KB. بدون Poster معتمد، الموقع يحتفظ بالخلفية المصورة الحالية.</p>
        </div>
      </div>
      <label className="opal-cms-checkline">
        <input type="checkbox" checked={draft.media.video.heroApproved}
          onChange={e=>edit(d=>{d.media.video.heroApproved=e.target.checked;})}/>
        أؤكد إن فيديو الـHero وصورة الـPoster حقيقيين ومصرح باستخدامهما
      </label>
      <label className="opal-cms-checkline">
        <input type="checkbox" checked={draft.media.video.filmApproved}
          onChange={e=>edit(d=>{d.media.video.filmApproved=e.target.checked;})}/>
        أؤكد حقوق استخدام الفيلم الكامل (زر Watch Our Film)
      </label>
      <div className="opal-cms-photo-status" role="status">
        <strong>{hasApprovedCmsHeroVideo(draft)?"✓ فيديو الـHero جاهز للنشر":"الـHero هيفضل صورة لحد اكتمال الفيديو والـPoster واعتمادهم"}</strong>
        <p>{hasApprovedCmsFullFilm(draft)?"الفيلم الكامل معتمد وجاهز للظهور بزر المشاهدة.":"الفيلم الكامل لن يظهر إلا بعد رفعه واعتماده."}</p>
      </div>
    </section>
    {uploading&&<div role="status" className="opal-cms-note">جاري رفع {uploading}…</div>}
  </div>;
}

export function AdminCms(){
  const [loading,setLoading]=useState(true);
  const [configured,setConfigured]=useState(true);
  const [logged,setLogged]=useState(false);
  const [password,setPassword]=useState("");
  const [draft,setDraft]=useState<CmsSite|null>(null);
  const [saved,setSaved]=useState<CmsSite|null>(null);
  const [published,setPublished]=useState<CmsSite|null>(null);
  const [tab,setTab]=useState<Tab>("content");
  const [locale,setLocale]=useState<Locale>("ar");
  const [busy,setBusy]=useState("");
  const [uploading,setUploading]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [history,setHistory]=useState<HistoryRow[]>([]);
  const dirty=Boolean(draft&&saved&&JSON.stringify(draft)!==JSON.stringify(saved));
  const unpublished=Boolean(saved&&published&&saved.revision!==published.revision);
  const pendingVisual=draft?unreadyVisualPlacements(draft.media.visual):[];

  const fetchContent=useCallback(async()=>{
    const response=await fetch("/api/admin/cms",{cache:"no-store"});
    if(!response.ok)throw new Error("تعذر تحميل المحتوى");
    const data=await response.json() as {draft:CmsSite;published:CmsSite};
    setDraft(data.draft);setSaved(data.draft);setPublished(data.published);
  },[]);
  const fetchHistory=useCallback(async()=>{
    const r=await fetch("/api/admin/cms/history",{cache:"no-store"});
    if(r.ok){const data=await r.json() as {history:HistoryRow[]};setHistory(data.history);}
  },[]);
  useEffect(()=>{
    void (async()=>{
      try{
        const r=await fetch("/api/admin/cms/session",{cache:"no-store"});
        const data=await r.json() as {authenticated:boolean;configured:boolean};
        setConfigured(data.configured);setLogged(data.authenticated);
        if(data.authenticated){await fetchContent();await fetchHistory();}
      }catch{setError("تعذر الاتصال بلوحة الإدارة.");}
      finally{setLoading(false);}
    })();
  },[fetchContent,fetchHistory]);
  async function login(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy("login");setError("");
    try{
      const r=await fetch("/api/admin/cms/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
      if(!r.ok)throw new Error(r.status===429?"محاولات كتير، حاول بعد 15 دقيقة.":"كلمة المرور غير صحيحة.");
      setPassword("");setLogged(true);
      await fetchContent();await fetchHistory();
    }catch(e){setError(e instanceof Error?e.message:"تعذر تسجيل الدخول");}
    finally{setBusy("");}
  }
  async function logout(){
    await fetch("/api/admin/cms/logout",{method:"POST"});
    setLogged(false);setDraft(null);setSaved(null);setPublished(null);setPassword("");
  }
  async function save(){
    if(!draft||!saved)return;
    setBusy("saving");setError("");setMessage("");
    try{
      const r=await fetch("/api/admin/cms",{method:"PUT",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({document:draft,expectedRevision:saved.revision})});
      const data=await r.json() as {draft?:CmsSite;error?:string};
      if(!r.ok||!data.draft)throw new Error(data.error||"لم يتم حفظ المسودة");
      setDraft(data.draft);setSaved(data.draft);setMessage("تم حفظ المسودة ✅ التعديل لسه مش ظاهر للزوار. راجع معاينة الموقع ثم اضغط «نشر على الموقع».");
    }catch(e){setError(e instanceof Error?e.message:"فشل الحفظ");}
    finally{setBusy("");}
  }
  async function publish(){
    if(!saved||dirty)return;
    const blocked=unreadyVisualPlacements(saved.media.visual);
    const warning=blocked.length>0
      ? "تنبيه: عندك "+blocked.length+" اختيار وسائط غير جاهز للنشر (وصف بالعربي/الإنجليزي أو تأكيد الحقوق ناقص). الصور دي مش هتتغير للزوار وهتفضل الصور القديمة مكانها.\n\n"
        +"أول أماكن محتاجة مراجعة: "+blocked.slice(0,3).map(x=>x.label).join("، ")+"\n\n"
        +"اختار «إلغاء» وكمّل اعتماد الصور من مكتبة الوسائط. أو «موافق» لو عاوز تنشر النصوص وباقي الصور الجاهزة فقط."
      : "تأكيد نشر المحتوى المحفوظ على الموقع العام؟ التغييرات المعتمدة هتظهر للزوار.";
    if(!window.confirm(warning))return;
    setBusy("publishing");setError("");setMessage("");
    try{
      const r=await fetch("/api/admin/cms/publish",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({expectedRevision:saved.revision})});
      const data=await r.json() as {published?:CmsSite;mediaReady?:boolean;error?:string};
      if(!r.ok||!data.published)throw new Error(data.error||"فشل النشر");
      setDraft(data.published);setSaved(data.published);setPublished(data.published);
      await fetchHistory();
      const skipped=unreadyVisualPlacements(data.published.media.visual);
      const v2InUse=data.published.media.visual.assets.length>0;
      setMessage("تم نشر النسخة الجديدة ✅"
        +(skipped.length>0
          ?" لكن "+skipped.length+" صورة/فيديو مرتبط غير جاهز ومش هيظهر للزوار؛ هيستمر ظهور الصور القديمة في مكانه. استكمل الوصف بالعربي والإنجليزي وتأكيد الحقوق، وبعدها احفظ وانشر من جديد."
          :v2InUse?" صور V2 المعتمدة والمرتبطة بالأقسام أصبحت ضمن النسخة المنشورة."
          :data.mediaReady?" الصور الأساسية المعتمدة اتفعلت.":" الصور التجريبية هتفضل لحد ما ترفع وتعتمد الصور الحقيقية.")
        +(hasApprovedCmsLogo(data.published)?" اللوجو المعتمد ظاهر في الهيدر.":"")
        +(hasApprovedCmsHeroVideo(data.published)?" فيديو الـHero اتفعل.":"")
        +(hasApprovedCmsFullFilm(data.published)?" الفيلم الكامل متاح للمشاهدة.":""));
    }catch(e){setError(e instanceof Error?e.message:"تعذر النشر");}
    finally{setBusy("");}
  }
  async function upload(file:File,role:CmsMediaRole|"logo"|"poster"){
    if(!draft)return;
    setUploading(role);setError("");setMessage("");
    try{
      const form=new FormData();form.append("image",file);
      const r=await fetch("/api/admin/cms/upload",{method:"POST",body:form});
      const data=await r.json() as {src?:string;error?:string};
      if(!r.ok||!data.src)throw new Error(data.error||"فشل رفع الصورة");
      const src=data.src;
      setDraft(old=>{
        if(!old)return old;
        const next=deepCopy(old);
        if(role==="logo"){next.media.logo=src;next.media.logoApproved=false;}
        else if(role==="poster"){next.media.video.posterSrc=src;next.media.video.heroApproved=false;}
        else{next.media.photos[role].src=src;next.media.photos[role].rightsConfirmed=false;}
        return next;
      });
      setMessage("تم رفع الصورة للسيرفر. احفظ المسودة ثم راجعها قبل النشر.");
    }catch(e){setError(e instanceof Error?e.message:"خطأ الرفع");}
    finally{setUploading("");}
  }
  async function uploadVideo(file:File,role:"desktop"|"mobile"|"film"){
    if(!draft)return;
    const limit=role==="desktop"?6*1024*1024:role==="mobile"?4*1024*1024:50*1024*1024;
    if(!file.name.toLowerCase().endsWith(".mp4")||file.size>limit||file.size===0){
      setError("اختار ملف MP4 ضمن الحجم المسموح به للدور المختار.");return;
    }
    setUploading("video:"+role);setError("");setMessage("");
    try{
      const form=new FormData();form.append("video",file);form.append("role",role);
      const response=await fetch("/api/admin/cms/upload-video",{method:"POST",body:form});
      const data=await response.json() as {src?:string;error?:string};
      if(!response.ok||!data.src)throw new Error(data.error||"تعذر رفع الفيديو");
      setDraft(old=>{
        if(!old)return old;
        const next=deepCopy(old);
        if(role==="desktop"){next.media.video.desktopSrc=data.src!;next.media.video.heroApproved=false;}
        else if(role==="mobile"){next.media.video.mobileSrc=data.src!;next.media.video.heroApproved=false;}
        else{next.media.video.fullFilmSrc=data.src!;next.media.video.filmApproved=false;}
        return next;
      });
      setMessage("تم رفع الفيديو للسيرفر. اعتمده واحفظ المسودة وعاينه قبل النشر.");
    }catch(e){setError(e instanceof Error?e.message:"خطأ رفع الفيديو");}
    finally{setUploading("");}
  }
  async function uploadLibrary(files:File[]){
    if(!draft||uploading)return;
    setError("");setMessage("");
    let count=0;
    try{
      for(const input of files){
        if(count>=160)throw new Error("الحد الأقصى للوسائط في المكتبة هو 160 ملف.");
        const video=input.type==="video/mp4"||input.name.toLowerCase().endsWith(".mp4");
        const image=input.type==="image/jpeg"||input.type==="image/png"||input.type==="image/webp";
        if(!video&&!image)throw new Error("الصيغ المسموحة: JPG, PNG, WebP وMP4 فقط.");
        if(video&&input.size>50*1024*1024)throw new Error("الفيديو "+input.name+" أكبر من 50MB. اضغطه قبل الرفع.");
        setUploading(`رفع ${count+1} من ${files.length}: ${input.name}`);
        const file=video?input:await optimizeMediaPhoto(input);
        const form=new FormData();
        form.append(video?"video":"image",file);
        if(video)form.append("role","gallery");
        const response=await fetch(video?"/api/admin/cms/upload-video":"/api/admin/cms/upload",{
          method:"POST",body:form
        });
        const data=await response.json() as {src?:string;error?:string};
        if(!response.ok||!data.src)throw new Error(data.error||"فشل رفع "+file.name);
        const src=data.src;
        const name=input.name.replace(/\\.[^.]+$/,"").slice(0,95)||"New media";
        setDraft(old=>{
          if(!old)return old;
          const next=deepCopy(old);
          if(next.media.visual.assets.some(item=>item.src===src))return next;
          if(next.media.visual.assets.length>=160)return next;
          next.media.visual.assets.push({
            src,kind:video?"video":"image",title:name,category:"other",
            altEn:name,altAr:"",approved:false,poster:""
          });
          return next;
        });
        count++;
      }
      setMessage(`تم رفع ${count} ملف للمكتبة كمسودة. اختار كل ملف واكتب وصفه واعتمد الحقوق وحدد مكانه.`);
    }catch(e){
      setError((e instanceof Error?e.message:"تعذر رفع الوسائط")
        +(count?` — تم رفع ${count} ملف بالفعل، احفظ المسودة للاحتفاظ بهم.`:""));
    }finally{setUploading("");}
  }
  async function restore(revision:number){
    if(!saved)return;
    if(!window.confirm("استرجاع النسخة "+revision+" كمسودة فقط؟ النشر العام لن يتغير."))return;
    setBusy("restore");setError("");
    try{
      const r=await fetch("/api/admin/cms/restore",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({revision,expectedRevision:saved.revision})});
      const data=await r.json() as {draft?:CmsSite;error?:string};
      if(!r.ok||!data.draft)throw new Error(data.error||"تعذر الاسترجاع");
      setDraft(data.draft);setSaved(data.draft);setMessage("تم استرجاع النسخة كمسودة، راجعها قبل النشر.");
      setTab("content");
    }catch(e){setError(e instanceof Error?e.message:"فشل الاسترجاع");}
    finally{setBusy("");}
  }
  if(loading)return <main className="opal-cms-loading" role="status">OPAL LEGACY — جاري فتح لوحة الإدارة…</main>;
  if(!logged)return <main className="opal-cms-login">
    <div className="opal-cms-login-card">
      <span className="opal-cms-monogram">O</span>
      <p className="opal-cms-eyebrow">OPAL LEGACY / OWNER PORTAL</p>
      <h1>إدارة محتوى الفندق</h1>
      <p>مكان واحد للتحكم في النصوص والصور والأقسام من غير تعديل الكود.</p>
      {!configured?<div role="alert" className="opal-cms-alert">لازم يتم تفعيل بيانات دخول المالك على الـVPS أولًا. راجع خطوات الإعداد في ملف CMS_SETUP.md.</div>:
        <form onSubmit={login}>
          <label><CopyLabel>كلمة مرور المالك</CopyLabel>
            <input value={password} onChange={e=>setPassword(e.target.value)} required type="password" autoComplete="current-password"/></label>
          <button type="submit" disabled={!password||Boolean(busy)}>{busy?"جاري الدخول…":"دخول لوحة الإدارة"} <span>↗</span></button>
        </form>}
      {error&&<div role="alert" className="opal-cms-alert">{error}</div>}
      <small>الاتصال مشفّر عند استخدام HTTPS. صلاحية الدخول خاصة بإدارة الفندق فقط.</small>
    </div>
  </main>;
  if(!draft||!saved)return <main className="opal-cms-loading" role="alert">تعذر تحميل بيانات الإدارة. <button onClick={()=>void fetchContent()}>إعادة المحاولة</button></main>;
  return <div className="opal-cms-dashboard" lang="ar" dir="rtl">
    <aside className="opal-cms-sidebar">
      <div className="opal-cms-sidebar-brand"><span className="opal-cms-monogram">O</span>
        <div><strong>OPAL LEGACY</strong><small>CONTENT STUDIO</small></div></div>
      <p className="opal-cms-sidebar-eyebrow">MANAGEMENT</p>
      <nav aria-label="أقسام لوحة الإدارة">
        {([{id:"content",name:"المحتوى والنصوص",icon:"✎"},{id:"sections",name:"الأقسام والترتيب",icon:"▦"},
          {id:"media",name:"الصور واللوجو الأساسية",icon:"▧"},{id:"visual",name:"مكتبة الوسائط V2",icon:"▣"},{id:"history",name:"النسخ السابقة",icon:"↶"}] as {id:Tab;name:string;icon:string}[])
          .map(item=><button key={item.id} type="button" className={tab===item.id?"is-active":""}
            onClick={()=>{setTab(item.id);if(item.id==="history")void fetchHistory();}}>
            <span>{item.icon}</span>{item.name}</button>)}
      </nav>
      <div className="opal-cms-sidebar-footer">
        <a target="_blank" rel="noopener noreferrer" href="/ar">عرض الموقع <span>↗</span></a>
        <button type="button" onClick={()=>void logout()}>تسجيل الخروج <span>↗</span></button>
      </div>
    </aside>
    <main className="opal-cms-main">
      <header className="opal-cms-topbar"><div><p className="opal-cms-eyebrow">OWNER CONTENT STUDIO</p>
        <h1>{tab==="content"?"المحتوى والنصوص":tab==="sections"?"الأقسام والترتيب":tab==="media"?"الصور والهوية":tab==="visual"?"مكتبة الوسائط والربط":"سجل النسخ"}</h1>
        <p className="opal-cms-subtitle">تحكم في الموقع مباشرة. كل تعديل بيتحفظ كمسودة الأول، وبعدها أنت تقرر النشر.</p>
      </div>
      <div className="opal-cms-status"><span className={dirty||unpublished?"is-unsaved":"is-saved"}>
          {dirty?"● فيه تعديلات لسه مش محفوظة":unpublished?"● المسودة محفوظة لكن لسه مش منشورة":"● آخر تعديلات محفوظة ومنشورة"}
        </span>
        <small>المنشور: #{published?.revision??0}</small></div></header>
      <div className="opal-cms-toolbar">
        <div className="opal-cms-locale" role="group" aria-label="لغة المحتوى">
          <button type="button" className={locale==="ar"?"is-active":""} onClick={()=>setLocale("ar")}>العربية</button>
          <button type="button" className={locale==="en"?"is-active":""} onClick={()=>setLocale("en")}>English</button>
        </div>
        <div className="opal-cms-toolbar-actions">
          <a target="_blank" rel="noopener noreferrer" href={`/${locale}/preview`}>معاينة المسودة <span>↗</span></a>
          <button type="button" className="opal-cms-save" disabled={!dirty||Boolean(busy)||Boolean(uploading)} onClick={()=>void save()}>
            {busy==="saving"?"جاري الحفظ…":"حفظ المسودة"}</button>
          <button type="button" className="opal-cms-publish" disabled={dirty||Boolean(busy)||Boolean(uploading)}
            onClick={()=>void publish()}>{busy==="publishing"?"جاري النشر…":"نشر على الموقع"} <span>↗</span></button>
        </div>
      </div>
      {tab==="visual"&&pendingVisual.length>0&&<div role="status" className="opal-cms-visual-warning">
        فيه {pendingVisual.length} صورة/فيديو متحدد للأقسام لكنه غير جاهز للنشر؛ ده سبب ظهور الصور القديمة في الموقع.
        لازم تكمل الوصف باللغتين وتأكيد حق النشر، وبعدها تحفظ المسودة وتنشرها.
      </div>}
      {message&&<div role="status" className="opal-cms-message">{message}</div>}
      {error&&<div role="alert" className="opal-cms-alert">{error}{error==="REVISION_CONFLICT"&&
        <button type="button" onClick={()=>void fetchContent()}>إعادة تحميل أحدث مسودة</button>}</div>}
      {tab==="content"&&<ContentEditor draft={draft} locale={locale} change={setDraft}/>}
      {tab==="sections"&&<SectionEditor draft={draft} locale={locale} change={setDraft}/>}
      {tab==="media"&&<MediaEditor draft={draft} change={setDraft} onUpload={upload} onVideoUpload={uploadVideo} uploading={uploading}/>}
      {tab==="visual"&&<MediaStudio draft={draft} published={published} change={setDraft} upload={uploadLibrary} uploading={uploading}/>}
      {tab==="history"&&<div className="opal-cms-stack">
        <div className="opal-cms-note">يمكنك استرجاع نسخة سابقة كمسودة، ومراجعتها ثم نشرها. النسخة العامة لا تتغير عند الاسترجاع.</div>
        {history.length===0?<div className="opal-cms-editor-card">مفيش نسخ سابقة لسه.</div>:
          history.map(item=><div className="opal-cms-history-row" key={item.revision}>
            <div><strong>النسخة #{item.revision}</strong><small>{new Date(item.updatedAt).toLocaleString("ar-EG")}</small></div>
            <button type="button" disabled={Boolean(busy)||dirty} onClick={()=>void restore(item.revision)}>استرجاع كمسودة ↶</button>
          </div>)}
      </div>}
      <footer className="opal-cms-bottom">Opal Legacy CMS · التغييرات المنشورة فقط هي اللي تظهر للزوار. الحجوزات والتقييمات ما زالت في وضع المعاينة.</footer>
    </main>
  </div>;
}
