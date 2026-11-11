// Zet de bestanden op de plek waar Capacitor ze verwacht:
// app-bestanden -> www/, kaartbibliotheek -> www/lib/, flitser- en verkeersdata -> www/data/, icoontjes -> assets/
// Draai dit na "npm install", anders ontbreekt de kaartbibliotheek (de app valt dan terug op internet).
const fs = require("fs");
for (const d of ["www", "www/lib", "www/data", "assets"]) fs.mkdirSync(d, { recursive: true });
for (const f of ["index.html", "app.js", "nav-core.js", "config.js"]) fs.copyFileSync(f, "www/" + f);
const ml = "node_modules/maplibre-gl/dist/";
for (const f of ["maplibre-gl.js", "maplibre-gl.css"]) {
  if (fs.existsSync(ml + f)) fs.copyFileSync(ml + f, "www/lib/" + f);
  else console.log("Let op: " + f + " niet gevonden, de app laadt hem dan van internet");
}
const mb = "node_modules/mapbox-gl/dist/";
for (const f of ["mapbox-gl.js", "mapbox-gl.css"]) if (fs.existsSync(mb + f)) fs.copyFileSync(mb + f, "www/lib/" + f);
for (const f of ["flitsers.json", "verkeer.json"]) if (fs.existsSync("data/" + f)) fs.copyFileSync("data/" + f, "www/data/" + f);
for (const f of ["icon-only.png", "icon-foreground.png", "icon-background.png"]) if (fs.existsSync(f)) fs.copyFileSync(f, "assets/" + f);
console.log("Bestanden klaargezet in www/ en assets/");
