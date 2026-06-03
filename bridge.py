"""
bridge.py
Bridge script to run on the laptop that has micro:bit connected.
It polls Firebase Realtime Database paths and sends serial commands
to the micro:bit in format: "LAMPU:1\n" or "KIPAS:0\n".

Usage:
  python bridge.py --port COM3 --url https://<PROJECT>.firebaseio.com --paths lampu kipas

Optional: --auth <FIREBASE_DATABASE_SECRET_OR_TOKEN>

Requirements:
  pip install -r requirements.txt

Notes:
- Set SERIAL_PORT to the serial device for micro:bit (Windows: COMx, Linux: /dev/ttyACM0)
- If Firebase requires auth, provide --auth token
"""

import time
import argparse
import sys
import requests
import serial
import serial.tools.list_ports

DEFAULT_PATHS = ['lampu', 'kipas']
POLL_INTERVAL = 1.0


def list_serial_ports():
    return [p.device for p in serial.tools.list_ports.comports()]


def read_path(db_url, path, auth_token=None, timeout=5):
    url = f"{db_url.rstrip('/')}/{path}.json"
    params = {}
    if auth_token:
        params['auth'] = auth_token
    r = requests.get(url, params=params, timeout=timeout)
    r.raise_for_status()
    return r.json()


def main():
    p = argparse.ArgumentParser(description='Firebase -> micro:bit bridge')
    p.add_argument('--port', '-p', help='Serial port of micro:bit (e.g. COM3 or /dev/ttyACM0)')
    p.add_argument('--baud', '-b', type=int, default=115200, help='Serial baudrate')
    p.add_argument('--url', '-u', required=True, help='Firebase RTDB base URL (https://...firebaseio.com or ...default-rtdb.asia-southeast1.firebasedatabase.app)')
    p.add_argument('--auth', help='Firebase Database secret or auth token (optional)')
    p.add_argument('--paths', '-k', nargs='+', default=DEFAULT_PATHS, help='Database paths to watch (default: lampu kipas)')
    p.add_argument('--interval', '-i', type=float, default=POLL_INTERVAL, help='Polling interval seconds')
    p.add_argument('--verbose', '-v', action='store_true', help='Verbose logging')
    args = p.parse_args()

    serial_port = args.port
    if not serial_port:
        ports = list_serial_ports()
        if not ports:
            print('No serial ports found. Connect micro:bit and retry, or pass --port.')
            sys.exit(1)
        print('Available serial ports:', ports)
        serial_port = ports[0]
        print('Using first available port:', serial_port)

    try:
        ser = serial.Serial(serial_port, args.baud, timeout=1)
    except Exception as e:
        print('Failed to open serial port', serial_port, e)
        sys.exit(1)

    last = {path: None for path in args.paths}
    db_url = args.url
    auth = args.auth
    interval = args.interval
    verbose = args.verbose

    print('Bridge started. Polling', args.paths, '-> serial', serial_port)
    try:
        while True:
            for path in args.paths:
                try:
                    val = read_path(db_url, path, auth_token=auth)
                except requests.exceptions.HTTPError as he:
                    print('HTTP error reading', path, he)
                    val = None
                except Exception as e:
                    print('Error reading', path, e)
                    val = None

                if val is None:
                    if verbose:
                        print('READ', path, '=>', val, '(skipped)')
                    continue

                is_on = 1 if (val == 1 or val is True or str(val) == '1') else 0
                if verbose:
                    print('READ', path, '=>', val, 'interpreted as', is_on)
                if last.get(path) != is_on:
                    cmd = f"{path.upper()}:{is_on}\n"
                    try:
                        if verbose:
                            print('WRITE serial ->', cmd.strip())
                        ser.write(cmd.encode('utf-8'))
                        ser.flush()
                        print('-> SENT', cmd.strip())
                        last[path] = is_on
                    except Exception as e:
                        print('Serial write failed:', e)
            time.sleep(interval)
    except KeyboardInterrupt:
        print('\nExiting...')
    finally:
        try:
            ser.close()
        except:
            pass


if __name__ == '__main__':
    main()
