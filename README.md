# remotedesktop-keyfilter

## What is it?
A [Frida](http://www.frida.re) hook that intercepts defined keys within a remote desktop context and sends them to the operating system.

By default, the hook intercepts <kbd>CTRL</kbd> + <kbd>WIN</kbd> + <kbd>LEFT</kbd> / <kbd>RIGHT</kbd> to enable virtual desktop switching while using full-screen remote desktop windows.

## Install

1. Download platform native Python 3.4. (Python 3.5 or higher is not supported.)

2. Add \Python34 and \Python34\Scripts to PATH.

3. Open PowerShell window for the following commands.

4. Install easy_install helper:
```
(Invoke-WebRequest https://bootstrap.pypa.io/ez_setup.py).Content | python -
```

5. Install Frida
```
easy_install frida
```

## Usage

Hook an instance of Remote Desktop Connection
```
frida -l remotedesktop-keyfilter.js mstsc.exe
```