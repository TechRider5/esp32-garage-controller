#include "LedController.h"

static int s_ledPin = -1;
static bool s_pulsing = false;
static unsigned long s_intervalMs = 300;
static unsigned long s_lastToggle = 0;
static int s_toggleCount = 0;
static bool s_pulseFinishedEdge = false;

void initLed(int pin){
  s_ledPin = pin;
  pinMode(s_ledPin, OUTPUT);
  digitalWrite(s_ledPin, LOW);
}

void ledOn(){ if (s_ledPin >= 0) digitalWrite(s_ledPin, HIGH); }
void ledOff(){ if (s_ledPin >= 0) digitalWrite(s_ledPin, LOW); }

void startPulse(unsigned long intervalMs){
  if (s_ledPin < 0) return;
  s_intervalMs = intervalMs;
  s_pulsing = true;
  s_toggleCount = 0;
  s_lastToggle = millis();
  digitalWrite(s_ledPin, HIGH);
}

void tickPulse(unsigned long nowMs){
  if (!s_pulsing || s_ledPin < 0) return;
  if (nowMs - s_lastToggle >= s_intervalMs){
    digitalWrite(s_ledPin, !digitalRead(s_ledPin));
    s_lastToggle = nowMs;
    s_toggleCount++;
    if (s_toggleCount >= 6){
      s_pulsing = false;
      digitalWrite(s_ledPin, LOW);
      s_pulseFinishedEdge = true;
    }
  }
}

bool isPulsing(){ return s_pulsing; }

bool consumePulseFinishedFlag(){
  bool was = s_pulseFinishedEdge;
  s_pulseFinishedEdge = false;
  return was;
}


