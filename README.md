# remotedesktop-keyfilter

## What is it?
A [Frida](http://www.frida.re) hook that intercepts defined keys within a remote desktop context and sends them to the operating system.

The hook intercepts <kbd>CTRL</kbd> + <kbd>WIN</kbd> + <kbd>LEFT</kbd> / <kbd>RIGHT</kbd> to enable virtual desktop switching while using full-screen remote desktop windows configured to send remote keys to the remote computer.

## Requirements

* Python 3.4
* Frida 4.4 or higher
* Windows 10 RTM (or higher, if you can get symbols)

## Install

1. Download processor architecture native Python 3.4. (Python 3.5 or higher is not supported.)

2. Add \Python34 and \Python34\Scripts to the PATH environment variable.

3. Open a PowerShell console for the following commands.

4. Install easy_install helper:
  ```
  (Invoke-WebRequest https://bootstrap.pypa.io/ez_setup.py).Content | python -
  ```

5. Install Frida
  ```
  easy_install frida
  ```

6. Set _NT_SYMBOL_PATH appropriately ([more info](https://msdn.microsoft.com/en-us/library/windows/hardware/ff558829)):
  ```
  SRV*X:\Path\To\Symbol\Cache*http://msdl.microsoft.com/download/symbols
  ```

  Alternatively you can [download] symbols (https://msdn.microsoft.com/en-us/windows/hardware/gg463028) for mstscax.dll (i.e. mstscax.pdb) and place in \System32.

## Usage

Hook an instance of Remote Desktop Connection via executable name:
```
frida -l remotedesktop-keyfilter.js mstsc.exe
```

Hook an instance of Remote Desktop Connection via process ID:
```
frida -l remotedesktop-keyfilter.js 19231
```