#include "DoorController.h"

static int s_pin1 = -1;
static int s_pin2 = -1;

void initDoors(int pin1, int pin2){
  s_pin1 = pin1;
  s_pin2 = pin2;
  pinMode(s_pin1, OUTPUT);
  pinMode(s_pin2, OUTPUT);
  digitalWrite(s_pin1, HIGH);
  digitalWrite(s_pin2, HIGH);
}

static void pulsePin(int pin){
  if (pin < 0) return;
  digitalWrite(pin, LOW);
  delay(300);
  digitalWrite(pin, HIGH);
}

void triggerDoor1(){ pulsePin(s_pin1); }
void triggerDoor2(){ pulsePin(s_pin2); }


