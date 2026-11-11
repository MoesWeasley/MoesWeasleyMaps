/*
  MoesDetector – hulpdienstdetector voor MoesWeasley Maps
  Bordje: Heltec WiFi LoRa 32 V3 (ESP32-S3 + SX1262), 433 MHz-versie

  Wat het doet:
  - Zoekt continu het zendbereik van de mobiele C2000-toestellen af (380–386,5 MHz).
  - Meet alleen de SIGNAALSTERKTE. Er wordt niets ontvangen, opgeslagen of ontcijferd.
  - Leert per kanaal wat "normale ruis" is en ziet het als er een sterke uitzending bij komt.
  - Toont een sterktemeter op het schermpje en stuurt de meting via Bluetooth naar de app.

  Bediening: de PRG-knop wisselt de gevoeligheid (laag / normaal / hoog / zeer hoog).
  De app kan de gevoeligheid ook instellen; die wordt onthouden.
*/
#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <Preferences.h>
#include <RadioLib.h>
#include <NimBLEDevice.h>
#include "SSD1306Wire.h"

// ---- pinnen van de Heltec WiFi LoRa 32 V3 ----
#define LORA_CS   8
#define LORA_SCK  9
#define LORA_MOSI 10
#define LORA_MISO 11
#define LORA_RST  12
#define LORA_BUSY 13
#define LORA_DIO1 14
#define OLED_SDA  17
#define OLED_SCL  18
#define OLED_RST  21
#define VEXT_CTRL 36   // LOW = stroom naar het schermpje aan
#define LED_PIN   35
#define BTN_PIN   0

// ---- Bluetooth (moet gelijk zijn aan de app) ----
#define SVC_UUID  "6d6f6573-6465-7465-6374-6f7200000001"
#define DATA_UUID "6d6f6573-6465-7465-6374-6f7200000002"
#define CFG_UUID  "6d6f6573-6465-7465-6374-6f7200000003"

// ---- scaninstellingen ----
// Kanalen van 0,5 MHz breed (ontvangstbandbreedte 467 kHz) over 380,25–386,25 MHz.
static const int   NCH = 13;
static const float F0 = 380.25f, FSTEP = 0.5f;
// Een C2000-toestel zendt in tijdsloten van ~14 ms, één keer per ~57 ms: zo lang per kanaal luisteren.
static const uint32_t DWELL_MS = 60;

SPIClass loraSpi(FSPI);
SX1262 radio = new Module(LORA_CS, LORA_DIO1, LORA_RST, LORA_BUSY, loraSpi);
SSD1306Wire display(0x3c, OLED_SDA, OLED_SCL);
Preferences prefs;

NimBLECharacteristic* dataChar = nullptr;
volatile bool bleConnected = false;

float floorDb[NCH];        // geleerde ruisvloer per kanaal
int   threshold = 10;      // dB boven de ruis voordat het telt (lager = gevoeliger)
int   level = 0;           // 0..5
int   hits = 0;            // hoeveel scans achter elkaar iets gezien
float lastEx = 0, lastRssi = -140, lastF = 0;
bool  radioOk = false;
uint32_t sweeps = 0;

const int PRESETS[] = {16, 12, 9, 6};
const char* PRESET_NAMES[] = {"laag", "normaal", "hoog", "zeer hoog"};

int presetIndexFor(int t) {
  int best = 0;
  for (int i = 0; i < 4; i++) if (abs(PRESETS[i] - t) < abs(PRESETS[best] - t)) best = i;
  return best;
}

void setThreshold(int t) {
  threshold = constrain(t, 3, 30);
  prefs.putInt("thr", threshold);
}

// ---------- Bluetooth ----------
class ServerCB : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* s) { bleConnected = true; }
  void onDisconnect(NimBLEServer* s) { bleConnected = false; NimBLEDevice::startAdvertising(); }
};
class CfgCB : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* c) {
    NimBLEAttValue v = c->getValue();
    String s;
    for (size_t i = 0; i < v.length(); i++) s += (char)v.data()[i];
    s.trim();
    // "T=12" = drempel in dB
    if (s.startsWith("T=")) setThreshold(s.substring(2).toInt());
  }
};

void setupBle() {
  NimBLEDevice::init("MoesDetector");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
  NimBLEServer* srv = NimBLEDevice::createServer();
  srv->setCallbacks(new ServerCB());
  NimBLEService* svc = srv->createService(SVC_UUID);
  dataChar = svc->createCharacteristic(DATA_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY);
  NimBLECharacteristic* cfg = svc->createCharacteristic(CFG_UUID, NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::WRITE);
  cfg->setCallbacks(new CfgCB());
  cfg->setValue(std::string("T=10"));
  dataChar->setValue(std::string("0,0,-140,0"));
  svc->start();
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->setScanResponse(true);
  adv->start();
}

// ---------- schermpje ----------
void drawScreen() {
  display.clear();
  display.setFont(ArialMT_Plain_10);
  display.setTextAlignment(TEXT_ALIGN_LEFT);
  display.drawString(0, 0, "MoesDetector");
  display.setTextAlignment(TEXT_ALIGN_RIGHT);
  display.drawString(128, 0, bleConnected ? "BT verbonden" : "BT wacht");
  display.setTextAlignment(TEXT_ALIGN_LEFT);

  if (!radioOk) {
    display.setFont(ArialMT_Plain_16);
    display.drawString(0, 24, "Radio fout");
    display.display();
    return;
  }
  // vijf staafjes
  for (int i = 0; i < 5; i++) {
    int h = 6 + i * 6, x = 4 + i * 16, y = 50 - h;
    if (i < level) display.fillRect(x, y, 12, h); else display.drawRect(x, y, 12, h);
  }
  display.setFont(ArialMT_Plain_16);
  display.drawString(88, 16, level > 0 ? "!" : "-");
  display.setFont(ArialMT_Plain_10);
  char buf[32];
  snprintf(buf, sizeof(buf), "+%d dB", (int)lastEx);
  display.drawString(88, 34, buf);
  snprintf(buf, sizeof(buf), "%.2f MHz  gev: %s", lastF, PRESET_NAMES[presetIndexFor(threshold)]);
  display.drawString(0, 53, buf);
  display.display();
}

// ---------- meten ----------
// luister DWELL_MS op één kanaal en geef de hoogste gemeten sterkte (dBm)
float measure(float f) {
  radio.standby();
  radio.setFrequency(f);
  radio.startReceive();
  delayMicroseconds(800);
  float mx = -200;
  uint32_t t0 = millis();
  while (millis() - t0 < DWELL_MS) {
    float r = radio.getRSSI(false);
    if (r > mx) mx = r;
    delayMicroseconds(300);
  }
  return mx;
}

void sweep() {
  float bestEx = -99, bestR = -200, bestF = 0;
  for (int i = 0; i < NCH; i++) {
    float f = F0 + i * FSTEP;
    float r = measure(f);
    float ex = r - floorDb[i];
    if (ex > bestEx) { bestEx = ex; bestR = r; bestF = f; }
    // ruisvloer bijleren: snel als het rustig is, heel langzaam als er iets zendt
    if (ex < 6) floorDb[i] = floorDb[i] * 0.85f + r * 0.15f;
    else        floorDb[i] = floorDb[i] * 0.995f + r * 0.005f;
    if (floorDb[i] < -135) floorDb[i] = -135;
  }
  sweeps++;
  // de eerste scans alleen leren
  if (sweeps < 6) { level = 0; lastEx = 0; lastRssi = bestR; lastF = bestF; return; }

  int now = 0;
  if (bestEx >= threshold) now = 1 + (int)min(4.0f, (bestEx - threshold) / 6.0f);
  hits = now > 0 ? hits + 1 : 0;
  // een losse piek telt pas mee als hij twee scans aanhoudt of meteen sterk is
  if (now > 0 && hits < 2 && now < 3) now = 0;
  // langzaam afnemen, snel stijgen
  level = max(now, level - 1);
  lastEx = max(0.0f, bestEx); lastRssi = bestR; lastF = bestF;
}

void notifyApp() {
  if (!dataChar) return;
  char buf[40];
  // niveau, dB boven de ruis, sterkte in dBm, frequentie
  snprintf(buf, sizeof(buf), "%d,%d,%d,%.2f", level, (int)lastEx, (int)lastRssi, lastF);
  dataChar->setValue(std::string(buf));
  if (bleConnected) dataChar->notify();
}

// ---------- start ----------
void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(VEXT_CTRL, OUTPUT); digitalWrite(VEXT_CTRL, LOW); delay(50);
  pinMode(OLED_RST, OUTPUT); digitalWrite(OLED_RST, LOW); delay(20); digitalWrite(OLED_RST, HIGH); delay(20);
  display.init();
  display.flipScreenVertically();
  display.setFont(ArialMT_Plain_10);
  display.drawString(0, 0, "MoesDetector start...");
  display.display();

  prefs.begin("moesdet", false);
  threshold = prefs.getInt("thr", 10);

  loraSpi.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_CS);
  // FSK-ontvanger met de breedste filter (467 kHz); TCXO op 1,8 V zoals op de Heltec V3
  int st = radio.beginFSK(383.0, 9.6, 5.0, 467.0, 0, 16, 1.8, false);
  radioOk = (st == RADIOLIB_ERR_NONE);
  Serial.printf("radio: %d\n", st);
  for (int i = 0; i < NCH; i++) floorDb[i] = -110;

  setupBle();
  drawScreen();
}

uint32_t lastBtn = 0;
void loop() {
  // knop: gevoeligheid wisselen
  if (digitalRead(BTN_PIN) == LOW && millis() - lastBtn > 400) {
    lastBtn = millis();
    int idx = (presetIndexFor(threshold) + 1) % 4;
    setThreshold(PRESETS[idx]);
  }
  if (radioOk) sweep(); else delay(500);
  digitalWrite(LED_PIN, level > 0 ? ((millis() / 150) % 2) : LOW);
  notifyApp();
  drawScreen();
  if (Serial) Serial.printf("niveau %d  +%.0f dB  %.0f dBm  %.2f MHz\n", level, lastEx, lastRssi, lastF);
}
