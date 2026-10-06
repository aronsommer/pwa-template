const $ = (id) => document.getElementById(id);

// Absent outside a secure context (https or localhost).
navigator.serviceWorker?.register("sw.js");

// --- Install -----------------------------------------------------------------

// Only a browser tab needs to be told how to install. Checked once, since the
// Fullscreen button changes the display mode.
$("install-hint").hidden = !matchMedia("(display-mode: browser)").matches;

// Chrome fires this when the app can be installed; keep the event so the
// button can open its dialog. Safari has no such event, so the button stays
// disabled there.
let installPrompt;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  $("install").disabled = false;
});
$("install").addEventListener("click", () => {
  $("install").disabled = true;
  installPrompt.prompt();
});
addEventListener("appinstalled", () => {
  $("install").disabled = true;
});

// --- Fullscreen --------------------------------------------------------------

// Hides the status bar too. iPhone has no Fullscreen API.
$("fullscreen").disabled = !document.fullscreenEnabled;
$("fullscreen").addEventListener("click", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen();
});

// --- Notification ------------------------------------------------------------

// iOS has no Notification in a browser tab, only in the installed app.
const canNotify = "Notification" in window && "serviceWorker" in navigator;
$("notify").disabled = !canNotify;
$("notify").addEventListener("click", async () => {
  const permission = await Notification.requestPermission();
  showInfo();
  if (permission !== "granted") return;
  // `new Notification()` throws on Android; showing it through the service
  // worker works everywhere.
  const registration = await navigator.serviceWorker.ready;
  registration.showNotification("PWA Template", {
    body: "Sent by the button on the page.",
    icon: "img/pwa-icon-512x512.png",
  });
});

// --- What the device reports -------------------------------------------------

// The height in px that a CSS length resolves to on this device.
function px(length) {
  const el = document.createElement("div");
  el.style.cssText = `position: fixed; visibility: hidden; height: ${length}`;
  document.body.append(el);
  const height = el.offsetHeight;
  el.remove();
  return height;
}

function showInfo() {
  const mode = ["fullscreen", "standalone", "minimal-ui", "browser"].find(
    (m) => matchMedia(`(display-mode: ${m})`).matches,
  );
  // The probe's borders are as wide as the safe-area insets.
  const inset = (side) => parseFloat(getComputedStyle($("probe"))[`border${side}Width`]);
  $("info").textContent = [
    `display-mode     ${mode}`,
    `safe top/bottom  ${inset("Top")} / ${inset("Bottom")}`,
    `safe left/right  ${inset("Left")} / ${inset("Right")}`,
    `100dvh/100lvh    ${px("100dvh")} / ${px("100lvh")}`,
    `viewport         ${innerWidth} × ${innerHeight}`,
    `screen           ${screen.width} × ${screen.height}`,
    `notifications    ${canNotify ? Notification.permission : "unavailable"}`,
    `network          ${navigator.onLine ? "online" : "offline"}`,
    `font             ${document.fonts.check('14px "Space Grotesk"') ? "loaded" : "not loaded"}`,
  ].join("\n");
}

// Fires once now, and again whenever the viewport or the safe area changes.
new ResizeObserver(showInfo).observe($("probe"));
// Fire when navigator.onLine changes.
addEventListener("online", showInfo);
addEventListener("offline", showInfo);
// Fires when the font has loaded or failed to.
document.fonts.addEventListener("loadingdone", showInfo);
