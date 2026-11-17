/**
 * Reject rate-limited, blocked and structurally invalid HTML.
 * This validator MUST be run before calling a reference screenshot valid.
 */
export function validateCapture(audit) {
  const text = [audit.title, audit.bodyTextSnippet].filter(Boolean).join(" ").toLowerCase();
  if ([429,403,503].includes(audit.httpStatus)) {
    return {valid:false,reason:`HTTP ${audit.httpStatus}: blocked or unavailable`};
  }
  if (/rate limit exceeded|too many requests|access denied|request blocked|captcha|robot check/.test(text)) {
    return {valid:false,reason:"Reference returned a rate-limit or access-control page"};
  }
  if (!Array.isArray(audit.headings)||!audit.headings.some(h=>/opal legacy/i.test(h.text||""))) {
    return {valid:false,reason:"Opal Legacy heading missing from captured page"};
  }
  if (!Array.isArray(audit.images)||audit.images.length < 4) {
    return {valid:false,reason:"Expected photo gallery missing from captured page"};
  }
  if (!audit.body || audit.body.scrollHeight < 800) {
    return {valid:false,reason:"Reference page has insufficient document height"};
  }
  return {valid:true,reason:"Valid reference document"};
}
