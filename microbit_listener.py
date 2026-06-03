# MicroPython code for micro:bit
# Flash this to the micro:bit using Mu Editor or the online MicroPython editor.

from microbit import *
import sys

# Initialize UART (micro:bit uses default UART pins; on micro:bit v2, uart.init)
try:
    uart.init(baudrate=115200)
except Exception:
    pass

# Define relay pins (adjust to wiring)
LAMPU_PIN = pin0
KIPAS_PIN = pin1

# Ensure outputs low initially
LAMPU_PIN.write_digital(0)
KIPAS_PIN.write_digital(0)

print('Micro:bit serial listener started')

while True:
    if uart.any():
        try:
            raw = uart.readline()
            if not raw:
                continue
            try:
                line = raw.decode('utf-8').strip().upper()
            except Exception:
                line = str(raw).strip().upper()
            # Expected commands: LAMPU:1 or KIPAS:0
            if line.startswith('LAMPU:'):
                v = line.split(':')[1]
                if v == '1':
                    LAMPU_PIN.write_digital(1)
                    print('LAMPU ON')
                else:
                    LAMPU_PIN.write_digital(0)
                    print('LAMPU OFF')
            elif line.startswith('KIPAS:'):
                v = line.split(':')[1]
                if v == '1':
                    KIPAS_PIN.write_digital(1)
                    print('KIPAS ON')
                else:
                    KIPAS_PIN.write_digital(0)
                    print('KIPAS OFF')
        except Exception as e:
            print('ERR', e)
    sleep(50)
