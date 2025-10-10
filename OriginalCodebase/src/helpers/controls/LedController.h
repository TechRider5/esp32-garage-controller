#ifndef LED_CONTROLLER_H
#define LED_CONTROLLER_H

#include <Arduino.h>

// Simple LED controller with optional pulse/blink behavior.
// Call tickPulse(millis()) frequently from loop() when a pulse is active.

void initLed(int pin);
void ledOn();
void ledOff();

// Start a pulse sequence: toggles every intervalMs for 6 toggles (3 blinks)
void startPulse(unsigned long intervalMs);

// Advance pulse state machine; call with current millis().
void tickPulse(unsigned long nowMs);

// Query whether a pulse is active.
bool isPulsing();

// Returns true exactly once when the pulse finishes (edge).
bool consumePulseFinishedFlag();

#endif // LED_CONTROLLER_H

