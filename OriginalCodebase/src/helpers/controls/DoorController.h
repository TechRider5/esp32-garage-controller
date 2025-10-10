#ifndef DOOR_CONTROLLER_H
#define DOOR_CONTROLLER_H

#include <Arduino.h>

void initDoors(int pin1, int pin2);
void triggerDoor1();
void triggerDoor2();

#endif // DOOR_CONTROLLER_H

