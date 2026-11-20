"use client";

import { createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { OpalLoadingVisual } from "@/components/OpalLoadingVisual";

type RouteLoadingValue={startNavigation:()=>void};
const RouteLoadingContext=createContext<RouteLoadingValue>({startNavigation:()=>{}});
const guestRoute=(pathname:string)=>/^\/(?:ar|en)(?:\/|$)/.test(pathname);

/** Real navigation feedback, not an artificial loading screen.
 * Delay avoids flicker on instant routes; commit and a safety timeout dismiss it.
 * Hash scrolling, downloads, modifier/new-tab clicks and CMS navigation are ignored. */
export function RouteLoadingProvider({children}:{children:ReactNode}){
  const pathname=usePathname();
  const [visible,setVisible]=useState(false);
  const showTimer=useRef<number|null>(null);
  const guardTimer=useRef<number|null>(null);

  const stopNavigation=useCallback(()=>{
    if(showTimer.current!==null)window.clearTimeout(showTimer.current);
    if(guardTimer.current!==null)window.clearTimeout(guardTimer.current);
    showTimer.current=null;
    guardTimer.current=null;
    setVisible(false);
  },[]);

  const startNavigation=useCallback(()=>{
    if(typeof window==="undefined"||!guestRoute(window.location.pathname))return;
    if(showTimer.current!==null||guardTimer.current!==null)return;
    // Loading that finishes quickly should never flash over the actual page.
    showTimer.current=window.setTimeout(()=>{
      showTimer.current=null;
      setVisible(true);
    },150);
    // A cancelled, failed or stalled navigation must never trap the guest.
    guardTimer.current=window.setTimeout(stopNavigation,6500);
  },[stopNavigation]);

  useEffect(()=>{
    // The new route is committed. Dismiss the overlay immediately.
    stopNavigation();
  },[pathname,stopNavigation]);

  useEffect(()=>{
    const onClick=(event:MouseEvent)=>{
      if(event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      const anchor=event.target instanceof Element
        ?event.target.closest<HTMLAnchorElement>("a[href]"):null;
      if(!anchor||anchor.hasAttribute("download")||anchor.dataset.noRouteTransition==="true"
        ||(anchor.target&&anchor.target!=="_self"))return;
      let next:URL;
      try{next=new URL(anchor.href,window.location.href);}
      catch{return;}
      if(next.origin!==window.location.origin||!guestRoute(next.pathname))return;
      const current=new URL(window.location.href);
      if(next.pathname===current.pathname&&next.search===current.search)return;
      startNavigation();
    };
    const onHistory=()=>stopNavigation();
    const onPageShow=()=>stopNavigation();
    document.addEventListener("click",onClick,true);
    window.addEventListener("popstate",onHistory);
    window.addEventListener("pageshow",onPageShow);
    return ()=>{
      document.removeEventListener("click",onClick,true);
      window.removeEventListener("popstate",onHistory);
      window.removeEventListener("pageshow",onPageShow);
      if(showTimer.current!==null)window.clearTimeout(showTimer.current);
      if(guardTimer.current!==null)window.clearTimeout(guardTimer.current);
    };
  },[startNavigation,stopNavigation]);

  const locale=pathname?.startsWith("/ar")?"ar":"en";
  return <RouteLoadingContext.Provider value={{startNavigation}}>
    {children}
    {visible&&<OpalLoadingVisual locale={locale} overlay/>}
  </RouteLoadingContext.Provider>;
}

export function useRouteLoading(){return useContext(RouteLoadingContext);}
