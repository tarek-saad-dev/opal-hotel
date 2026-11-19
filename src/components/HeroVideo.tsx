"use client";

import { createPortal } from "react-dom";
import { useEffect,useRef,useState } from "react";
import type { Locale } from "@/lib/hotel-content";

/** Poster remains the LCP asset; MP4 is not attached until the hero is visible
 * and the visitor has not requested data savings/reduced motion. */
export function HeroVideoBackground({desktop,mobile,poster,locale}:{
  desktop:string;mobile:string;poster:string;locale:Locale
}){
  const containerRef=useRef<HTMLDivElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);
  const [visible,setVisible]=useState(false);
  const [allowAutoplay,setAllowAutoplay]=useState(false);
  const [manualPlay,setManualPlay]=useState(false);
  const [userPaused,setUserPaused]=useState(false);
  const [playing,setPlaying]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [src,setSrc]=useState(desktop);
  const ar=locale==="ar";

  useEffect(()=>{
    const compact=window.matchMedia("(max-width: 800px)");
    const sync=()=>setSrc(compact.matches&&mobile?mobile:desktop);
    sync();
    compact.addEventListener("change",sync);
    return ()=>compact.removeEventListener("change",sync);
  },[desktop,mobile]);
  useEffect(()=>{
    const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
    setAllowAutoplay(!reduce&&!connection?.saveData&&connection?.effectiveType!=="2g"&&connection?.effectiveType!=="slow-2g");
    const element=containerRef.current;
    if(!element)return;
    if(!("IntersectionObserver" in window)){setVisible(true);return;}
    const observer=new IntersectionObserver(entries=>{
      setVisible(Boolean(entries[0]?.isIntersecting));
    },{threshold:0.1});
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  const load=(allowAutoplay||manualPlay)&&visible&&!failed;
  useEffect(()=>{
    const video=videoRef.current;
    if(!video)return;
    if(!load||document.hidden||userPaused){
      video.pause();setPlaying(false);return;
    }
    if(!ready)return;
    void video.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));
  },[load,ready,userPaused,src]);
  useEffect(()=>{
    const sync=()=>{
      const video=videoRef.current;
      if(!video)return;
      if(document.hidden){video.pause();setPlaying(false);}
      else if(load&&ready&&!userPaused)void video.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false));
    };
    document.addEventListener("visibilitychange",sync);
    return ()=>document.removeEventListener("visibilitychange",sync);
  },[load,ready,userPaused]);
  const toggle=()=>{
    if(playing){setUserPaused(true);videoRef.current?.pause();setPlaying(false);}
    else{setUserPaused(false);setManualPlay(true);setFailed(false);}
  };
  return <div ref={containerRef} className="opal-hero-video-background" data-hero-mode="video">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="premium-hero-photo opal-hero-video-poster" src={poster} alt=""
      width={1920} height={1080} fetchPriority="high" decoding="async"/>
    {load&&<video key={src} ref={videoRef}
      className={`opal-hero-video-player${playing?" is-playing":""}`}
      muted loop playsInline preload="auto" autoPlay={false}
      src={src} aria-hidden="true" tabIndex={-1}
      onLoadedData={()=>setReady(true)}
      onPlay={()=>setPlaying(true)}
      onPause={()=>setPlaying(false)}
      onError={()=>{setFailed(true);setPlaying(false);}}>
      {ar?"المتصفح لا يدعم تشغيل الفيديو":"Your browser does not support video playback"}
    </video>}
    <button type="button" className="opal-hero-video-toggle" onClick={toggle}
      aria-label={playing?(ar?"إيقاف فيديو الخلفية مؤقتًا":"Pause background video"):(ar?"تشغيل فيديو الخلفية":"Play background video")}>
      {playing?"Ⅱ":"▶"}
    </button>
  </div>;
}

/** Full-length film is mounted only after an intentional click. Nothing is
 * preloaded or streamed on normal landing-page visits. */
export function FullHotelFilm({src,locale,onClose}:{src:string;locale:Locale;onClose:()=>void}){
  const closeRef=useRef<HTMLButtonElement>(null);
  const ar=locale==="ar";
  useEffect(()=>{
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==="Escape")onClose();
      if(event.key==="Tab"){
        const dialog=document.getElementById("opal-hotel-film-dialog");
        const focusable=Array.from(dialog?.querySelectorAll<HTMLElement>("button, video[controls]")||[]);
        if(!focusable.length)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    };
    window.addEventListener("keydown",onKey);
    return ()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey);};
  },[onClose]);
  return createPortal(<div id="opal-hotel-film-dialog" className="opal-film-backdrop"
    role="dialog" aria-modal="true" aria-label={ar?"فيلم أوبال ليجاسي":"Opal Legacy hotel film"}>
    <div className="opal-film-panel">
      <div className="opal-film-top"><strong>{ar?"فيلم أوبال ليجاسي":"THE OPAL LEGACY FILM"}</strong>
        <button type="button" ref={closeRef} onClick={onClose} aria-label={ar?"إغلاق الفيلم":"Close film"}>×</button>
      </div>
      <video src={src} controls playsInline preload="none" autoPlay
        controlsList="nodownload" className="opal-full-film-player"/>
    </div>
  </div>,document.body);
}
