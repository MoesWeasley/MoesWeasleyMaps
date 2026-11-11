// Voegt de rechten toe die de app nodig heeft aan AndroidManifest.xml.
// Draai dit na "npx cap add android". Veilig om vaker te draaien.
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "android", "app", "src", "main", "AndroidManifest.xml");
if (!fs.existsSync(file)) {
  console.error("AndroidManifest.xml niet gevonden. Draai eerst: npx cap add android");
  process.exit(1);
}
let xml = fs.readFileSync(file, "utf8");
const lines = [
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />',
  '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  '<uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />',
  '<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />',
  '<uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />',
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />'
];
/* snelkoppelingen op het app-icoon (lang drukken): Naar huis / Naar werk, via de link moesweasley://naar/... */
const resDir = path.join(__dirname, "android", "app", "src", "main", "res");
const appId = JSON.parse(fs.readFileSync(path.join(__dirname, "capacitor.config.json"), "utf8")).appId;
fs.mkdirSync(path.join(resDir, "xml"), { recursive: true });
const sc = (id, label, long, url) => `  <shortcut android:shortcutId="${id}" android:enabled="true" android:icon="@mipmap/ic_launcher" android:shortcutShortLabel="@string/${label}" android:shortcutLongLabel="@string/${long}">
    <intent android:action="android.intent.action.VIEW" android:targetPackage="${appId}" android:targetClass="${appId}.MainActivity" android:data="${url}" />
  </shortcut>`;
fs.writeFileSync(path.join(resDir, "xml", "shortcuts.xml"), `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
${sc("naar_huis", "sc_home", "sc_home_long", "moesweasley://naar/thuis")}
${sc("naar_werk", "sc_work", "sc_work_long", "moesweasley://naar/werk")}
</shortcuts>
`);
const strFile = path.join(resDir, "values", "strings.xml");
if (fs.existsSync(strFile)) {
  let sx = fs.readFileSync(strFile, "utf8");
  if (!sx.includes("sc_home")) {
    sx = sx.replace("</resources>", '    <string name="sc_home">Naar huis</string>\n    <string name="sc_home_long">Navigeer naar huis</string>\n    <string name="sc_work">Naar werk</string>\n    <string name="sc_work_long">Navigeer naar werk</string>\n</resources>');
    fs.writeFileSync(strFile, sx);
  }
}
if (!xml.includes("android.app.shortcuts")) {
  xml = xml.replace(/(<activity[^>]*MainActivity[\s\S]*?)(<\/activity>)/, '$1    <meta-data android:name="android.app.shortcuts" android:resource="@xml/shortcuts" />\n            <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="moesweasley" />\n            </intent-filter>\n        $2');
}
console.log(xml.includes("android.app.shortcuts") ? "Snelkoppelingen Naar huis/werk toegevoegd" : "Let op: snelkoppelingen niet toegevoegd");

/* spraakherkenning (Smiesh luistert): Android 11+ moet de herkenningsdienst mogen zien */
if (!xml.includes("android.speech.RecognitionService")) {
  xml = xml.replace(/(\s*)<application/, "\n    <queries><intent><action android:name=\"android.speech.RecognitionService\" /></intent></queries>$1<application");
}
const missing = lines.filter(l => !xml.includes(l.match(/android:name="([^"]+)"/)[0]));
if (missing.length) {
  xml = xml.replace(/(\s*)<application/, "\n    " + missing.join("\n    ") + "\n$1<application");
  fs.writeFileSync(file, xml);
  console.log("Rechten toegevoegd:\n  " + missing.join("\n  "));
} else {
  fs.writeFileSync(file, xml);
  console.log("Rechten stonden er al in.");
}

// GPS zo snel als de telefoon kan: de achtergrondlocatie-plugin vraagt standaard maar
// 1 positie per seconde. Hier zetten we dat op "zo vaak als de gps-chip levert".
const bg = path.join(__dirname, "node_modules", "@capacitor-community", "background-geolocation",
  "android", "src", "main", "java", "com", "equimaps", "capacitor_background_geolocation", "BackgroundGeolocationService.java");
if (fs.existsSync(bg)) {
  let j = fs.readFileSync(bg, "utf8");
  if (!j.includes("setFastestInterval(0)")) {
    j = j.replace("locationRequest.setMaxWaitTime(1000);", "locationRequest.setMaxWaitTime(0);")
         .replace("locationRequest.setInterval(1000);", "locationRequest.setInterval(100);\n            locationRequest.setFastestInterval(0);");
    fs.writeFileSync(bg, j);
    console.log(j.includes("setFastestInterval(0)") ? "GPS-snelheid: zo snel als de telefoon kan" : "Let op: GPS-instelling niet gevonden in de plug-in");
  }
} else {
  console.log("Achtergrondlocatie-plugin niet gevonden, GPS-instelling overgeslagen");
}
