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
