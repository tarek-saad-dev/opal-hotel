#!/usr/bin/env node
/**
 * Media handoff preflight. No network, credentials or special dependencies.
 * - npm run media:check          => checks present/staged files; preview is valid
 * - npm run media:launch-check   => blocks until the complete owner-approved
 *                                   image/logo and content handoff exists
 *
 * This does NOT deploy or remove the site's separate noindex safety gate.
 */
import { readFileSync, existsSync, statSync, realpathSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repository=resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifestPath=resolve(repository,"src/config/hotel-media.json");
const mediaRoot=resolve(repository,"public/media/hotel");
const launchCheck=process.argv.includes("--launch");
const errors=[];
const warnings=[];
const roles=["exterior","garden","roomMain","roomSecondary","architecture","roomDetail"];
const supportedPhotos=["webp","jpeg","jpg","png"];
const supportedLogo=["svg","webp","png"];

const fail=(message)=>errors.push(message);
const warn=(message)=>warnings.push(message);
const validText=(value)=>typeof value==="string"&&value.trim().length>=2;
const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);

function validateLocalPath(path,extensions,label){
  if(typeof path!=="string"||!path.startsWith("/media/hotel/")){
    fail(label+": use a local /media/hotel/... path; no external/hotlinked images");
    return null;
  }
  if(path.includes("..")||path.includes("\\")||path.includes("//")||/[?#%]/.test(path)){
    fail(label+": unsafe image path");
    return null;
  }
  const part=path.slice("/media/hotel/".length);
  const extension=part.split(".").at(-1)?.toLowerCase();
  if(!part||!/^[a-z0-9][a-z0-9._/-]*$/.test(part)||!extensions.includes(extension)){
    fail(label+": unsupported path/extension (allowed: "+extensions.join(", ")+")");
    return null;
  }
  const disk=resolve(mediaRoot,part);
  const rel=relative(mediaRoot,disk);
  if(rel.startsWith(".."+sep)||rel===".."||rel.startsWith(sep)){
    fail(label+": image path leaves the approved media folder");
    return null;
  }
  if(!existsSync(disk)){
    fail(label+": local file not found at public"+path);
    return null;
  }
  const real=realpathSync(disk);
  const relReal=relative(mediaRoot,real);
  if(relReal.startsWith(".."+sep)||relReal===".."||relReal.startsWith(sep)){
    fail(label+": symlink resolves outside approved media folder");
    return null;
  }
  if(!statSync(real).isFile()){
    fail(label+": media source is not a regular file");
    return null;
  }
  return {disk:real,extension};
}
function imageDimensions(buf,extension){
  // Simple header verification of actual file format and dimensions.
  if(extension==="png"){
    if(buf.length<24||buf.toString("ascii",1,4)!=="PNG")return null;
    return {width:buf.readUInt32BE(16),height:buf.readUInt32BE(20)};
  }
  if(extension==="webp"){
    if(buf.length<30||buf.toString("ascii",0,4)!=="RIFF"||buf.toString("ascii",8,12)!=="WEBP")return null;
    const kind=buf.toString("ascii",12,16);
    if(kind==="VP8X"){
      return {width:1+buf.readUIntLE(24,3),height:1+buf.readUIntLE(27,3)};
    }
    if(kind==="VP8L"){
      if(buf[20]!==0x2f)return null;
      return {
        width:1+(((buf[22]&0x3f)<<8)|buf[21]),
        height:1+(((buf[24]&0x0f)<<10)|(buf[23]<<2)|((buf[22]&0xc0)>>6)),
      };
    }
    if(kind==="VP8 " && buf[23]===0x9d && buf[24]===0x01 && buf[25]===0x2a){
      return {width:buf.readUInt16LE(26)&0x3fff,height:buf.readUInt16LE(28)&0x3fff};
    }
    return null;
  }
  if(extension==="jpg"||extension==="jpeg"){
    if(buf.length<6||buf[0]!==0xff||buf[1]!==0xd8)return null;
    let offset=2;
    while(offset+9<=buf.length){
      if(buf[offset]!==0xff){offset++;continue;}
      let marker=buf[offset+1];
      while(marker===0xff){offset++;marker=buf[offset+1];}
      if(marker===0xd9||marker===0xda)break;
      if(marker===0xd8||marker===0x01||(marker>=0xd0&&marker<=0xd7)){
        offset+=2;continue;
      }
      const length=buf.readUInt16BE(offset+2);
      if(length<2||offset+2+length>buf.length)return null;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
        return {width:buf.readUInt16BE(offset+7),height:buf.readUInt16BE(offset+5)};
      }
      offset+=2+length;
    }
  }
  return null;
}
function validateFile(path,extensions,label,maxBytes,minWidth,minHeight){
  const file=validateLocalPath(path,extensions,label);
  if(!file)return;
  const buffer=readFileSync(file.disk);
  if(buffer.length===0){fail(label+": file is empty");return;}
  if(buffer.length>maxBytes){
    fail(label+": image exceeds "+Math.round(maxBytes/1024)+" KB target ("+Math.round(buffer.length/1024)+" KB)");
  }
  if(file.extension==="svg"){
    const xml=buffer.toString("utf8");
    if(!/<svg[\s>]/i.test(xml)||!/<\/svg>/i.test(xml)){
      fail(label+": SVG document is missing the expected root element");
    }
    if(/<script\b|<foreignObject\b|\bon(?:load|error|click)\s*=|(?:href|xlink:href)\s*=\s*["'](?:https?:|data:|javascript:)/i.test(xml)){
      fail(label+": SVG contains active or external content; use an approved, self-contained logo");
    }
    return;
  }
  const dimensions=imageDimensions(buffer,file.extension);
  if(!dimensions||dimensions.width===0||dimensions.height===0){
    fail(label+": unsupported or corrupt image header");return;
  }
  if(dimensions.width<minWidth||dimensions.height<minHeight){
    fail(label+": too small ("+dimensions.width+"×"+dimensions.height+"); minimum "+minWidth+"×"+minHeight);
  }
}

let manifest;
try{manifest=JSON.parse(readFileSync(manifestPath,"utf8"));}
catch(err){fail("Cannot read official media manifest: "+String(err.message));}
if(manifest){
  if(manifest.version!==1)fail("Unsupported manifest version");
  if(!["preview","official"].includes(manifest.mode))fail('mode must be "preview" or "official"');
  if(!manifest.approval||typeof manifest.approval!=="object")fail("approval block missing");
  if(!manifest.logo||typeof manifest.logo!=="object")fail("logo block missing");
  if(!manifest.photos||typeof manifest.photos!=="object")fail("photos block missing");
  if(!errors.length){
    const requestedOfficial=manifest.mode==="official"||launchCheck;
    if(requestedOfficial){
      const approval=manifest.approval;
      if(!validText(approval.approvedBy))fail("Missing named authorized hotel approver");
      if(typeof approval.approvedOn!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(approval.approvedOn)
        ||!Number.isFinite(Date.parse(approval.approvedOn))){
        fail("Missing valid approvedOn (YYYY-MM-DD)");
      }
      if(!validText(approval.licenseEvidence))fail("Missing documented image rights/license evidence reference");
      if(approval.contentVerified!==true)fail("Hotel descriptions, facts, and operating policies are not approved");
      if(manifest.logo.rightsConfirmed!==true)fail("Official logo rights approval missing");
    }
    if(manifest.logo.src!==null){
      validateFile(manifest.logo.src,supportedLogo,"Official logo",350*1024,200,100);
    }else if(requestedOfficial){
      fail("Official logo asset not provided");
    }
    for(const role of roles){
      if(!own(manifest.photos,role)){fail("Missing required photo slot: "+role);continue;}
      const photo=manifest.photos[role];
      if(!photo||typeof photo!=="object"){fail("Invalid photo slot: "+role);continue;}
      if(requestedOfficial){
        if(!validText(photo.altEn)||!validText(photo.altAr)){
          fail(role+": official photo needs both accurate English and Arabic alt descriptions");
        }
        if(photo.rightsConfirmed!==true)fail(role+": hotel image rights not confirmed");
      }
      if(photo.src!==null){
        validateFile(photo.src,supportedPhotos,"Photo "+role,1536*1024,1100,600);
      }else if(requestedOfficial){
        fail(role+": approved hotel photo missing");
      }
    }
    if(launchCheck && manifest.mode!=="official") {
      fail('Publication is blocked: mode is "preview". Activate "official" only after owner approval and asset validation.');
    }
    if(manifest.mode==="preview"){
      warn("Preview mode remains active: public pages show illustrative photography and the temporary O mark.");
      warn("To release approved assets, obtain six real hotel photos, the official logo, license evidence and a signed content approval.");
    }
  }
}
for(const line of warnings)console.log("NOTICE "+line);
for(const line of errors)console.error("ERROR "+line);
if(errors.length){
  console.error("Media preflight: FAILED ("+errors.length+" issue"+(errors.length===1?"":"s")+")");
  process.exitCode=1;
}else{
  console.log("Media preflight: PASS ("+(launchCheck?"launch readiness":"manifest integrity")+")");
  if(manifest?.mode==="official")console.log("Official photo and logo assets verified; the separate noindex launch gate remains unchanged.");
}
