"""Windows Service wrapper — runs run_server.py's server as a background
Windows service so it auto-starts on boot without anyone logging in.

This is a *dev-machine* script (uses pywin32, run via the venv's python.exe)
that installs a service pointing at the run_server.py entry point directly —
it does NOT need the PyInstaller .exe to already exist, so it can be used to
test the service behavior before doing a full PyInstaller build. For the
real packaged install, point ProInvoicingServer.exe at this same pattern via
`sc create` instead (see README.md) — pywin32-style services need a Python
interpreter, which an end-user PC won't have, so the *shipped* installer
should use `sc create` + the PyInstaller .exe, not this script.

Usage (run as Administrator, from backend/, with the venv active):
    python packaging/windows_service.py install
    python packaging/windows_service.py start
    python packaging/windows_service.py stop
    python packaging/windows_service.py remove

NOT run automatically by anything in this build — installing a Windows
service is a system-level, hard-to-reverse-without-admin-rights action, so
it's left for the admin to run deliberately.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import servicemanager
import win32event
import win32service
import win32serviceutil


class ProInvoicingService(win32serviceutil.ServiceFramework):
    _svc_name_ = "ProInvoicingServer"
    _svc_display_name_ = "PRO Invoicing Server"
    _svc_description_ = (
        "Local FastAPI backend for the PRO Invoicing app. Employee PCs on "
        "the LAN connect to this. Safe to stop only when no one is using "
        "the app."
    )

    def __init__(self, args):
        super().__init__(args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.server_thread = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.stop_event)

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, ""),
        )
        import threading

        from run_server import main as run_server_main

        self.server_thread = threading.Thread(target=run_server_main, daemon=True)
        self.server_thread.start()
        win32event.WaitForSingleObject(self.stop_event, win32event.INFINITE)


if __name__ == "__main__":
    win32serviceutil.HandleCommandLine(ProInvoicingService)
