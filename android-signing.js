// Zet een oplopend versienummer en (als er een sleutel is) de eigen handtekening in android/app/build.gradle.
// Met dezelfde handtekening kun je een nieuwe APK over de oude heen installeren, zonder eerst te verwijderen.
// Gebruikt omgevingsvariabelen: BUILD_NUMBER, KEYSTORE_FILE, KEYSTORE_PASSWORD, KEY_ALIAS.
const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "android", "app", "build.gradle");
if (!fs.existsSync(file)) { console.error("build.gradle niet gevonden"); process.exit(1); }
let g = fs.readFileSync(file, "utf8");

const n = parseInt(process.env.BUILD_NUMBER || "1", 10) || 1;
g = g.replace(/versionCode \d+/, "versionCode " + n)
     .replace(/versionName "[^"]*"/, 'versionName "1.' + n + '"');

if (process.env.KEYSTORE_FILE && !g.includes("signingConfigs")) {
  g = g.replace(/(\n\s*buildTypes \{)/, `
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_FILE"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS") ?: "moesweasley"
            keyPassword System.getenv("KEYSTORE_PASSWORD")
        }
    }$1`)
       .replace(/(release \{\s*\n)(\s*)minifyEnabled/, "$1$2signingConfig signingConfigs.release\n$2minifyEnabled");
  if (!g.includes("signingConfig signingConfigs.release")) { console.error("Handtekening kon niet worden ingesteld"); process.exit(1); }
  console.log("Eigen handtekening ingesteld");
}
fs.writeFileSync(file, g);
console.log("Versie 1." + n + " (versionCode " + n + ")");
