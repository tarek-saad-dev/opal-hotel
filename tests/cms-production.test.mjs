import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("Opal production deploy and CMS smoke scripts are valid Bash", () => {
  for (const file of ["ops/deploy-vps.sh", "ops/check-cms-production.sh"]) {
    const r = spawnSync("bash", ["-n", file], { encoding: "utf8" });
    assert.equal(r.status, 0, file + ": " + r.stderr);
  }
});

test("Existing Opal managed systemd service receives CMS data and secrets via a safe drop-in", () => {
  const deploy = read("ops/deploy-vps.sh");
  assert.match(deploy, /CMS_DROPIN_DIR=\/etc\/systemd\/system\/opal-hotel\.service\.d/);
  assert.match(deploy, /# Managed by Opal Hotel CMS/);
  assert.match(deploy, /Environment=OPAL_CMS_DATA_DIR=\/var\/lib\/opal-hotel-cms/);
  assert.match(deploy, /EnvironmentFile=\/etc\/opal-hotel\/cms\.env/);
  assert.match(deploy, /Existing CMS systemd override is not Opal-managed/);
  assert.doesNotMatch(deploy, /sed -i .*NEXT_TELEMETRY_DISABLED/);
});

test("CMS production smoke script is read-only and checks private endpoints", () => {
  const src = read("ops/check-cms-production.sh");
  assert.match(src, /BASE="https:\/\/\$DOMAIN"/);
  assert.match(src, /expect \/api\/admin\/cms 401/);
  assert.match(src, /check_preview \/en\/preview/);
  assert.match(src, /data\.configured !== true/);
  assert.match(src, /data\.authenticated !== false/);
  assert.doesNotMatch(src, /(--insecure| -k |OPAL_CMS_ADMIN_PASSWORD|curl .*--data|curl .*--request POST)/);
});


test("Unpublished photo uploads remain private and public images require all approvals", () => {
  const store = read("src/lib/cms-store.ts");
  const media = read("src/app/api/cms/media/[filename]/route.ts");
  assert.match(store, /export async function isPublishedCmsImage/);
  assert.match(store, /if\(!hasCompleteCmsMedia\(published\)\)return false/);
  assert.match(media, /if\(!published&&!await isCmsAuthenticated\(\)\)/);
  assert.match(media, /published\?"public, max-age=600":"private, no-store"/);
});
