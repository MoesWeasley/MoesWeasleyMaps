/* Instellingen van MoesWeasley Maps. Pas hier aan, de rest van de app hoeft niet te veranderen. */
window.NAVI_CFG = {
  /* Waar de flitser- en verkeersbestanden staan. Van boven naar beneden geprobeerd:
     1. de eigen GitHub-repo (werkt alleen als de repo openbaar/Public is)
     2. de bestanden die bij het bouwen in de app zijn gestopt (altijd beschikbaar, maar zo oud als de APK) */
  dataBases: [
    "https://raw.githubusercontent.com/MoesWeasley/MoesWeasleyMaps/main/data/",
    "data/"
  ],
  /* gratis kaart zonder sleutel */
  mapStyle: "https://tiles.openfreemap.org/styles/liberty",
  /* gratis routeplanners (OSRM); de eerste die antwoordt wint */
  routers: [
    "https://routing.openstreetmap.de/routed-car/route/v1/driving/",
    "https://router.project-osrm.org/route/v1/driving/"
  ],
  /* adres zoeken */
  photon: "https://photon.komoot.io/api/",
  nominatim: "https://nominatim.openstreetmap.org/search",

  /* Gratis sleutels voor live verkeer. Je kunt ze ook in de app invullen (Instellingen).
     TomTom: developer.tomtom.com  ·  HERE: platform.here.com */
  tomtomKey: "",
  hereKey: "",

  /* Firebase voor gedeelde flitsermeldingen. Vul hier dezelfde gegevens in als bij sprintje,
     dan zien beide apps elkaars meldingen. Leeg laten = meldingen alleen op je eigen telefoon. */
  firebase: window.__FBCFG || null
};
