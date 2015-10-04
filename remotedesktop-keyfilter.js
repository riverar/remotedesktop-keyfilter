(function () {
    var keyboardProc = DebugSymbol.getFunctionByName("CTSInput::IHStaticLowLevelKeyboardProc");
    var originalKeyboardProc = new NativeFunction(keyboardProc, 'int64', ['int', 'uint64', 'pointer'], 'win64');

    var CallNextHookEx = new NativeFunction(Module.findExportByName("user32.dll", "CallNextHookEx"), 'long', ['pointer', 'int', 'uint64', 'pointer']);
    var keybd_event = new NativeFunction(Module.findExportByName("user32.dll", "keybd_event"), 'void', ['uchar', 'uchar', 'int32', 'uint64']);

    var WM_KEYDOWN = 256;
    var WM_KEYUP = 257;

    var VK_LEFT = 37;
    var VK_RIGHT = 39;
    var VK_LWIN = 91;
    var VK_RWIN = 92;
    var VK_LCONTROL = 162;
    var VK_RCONTROL = 163;

    var PASS_THROUGH_HOOK = 0;
    var SKIP_HOOK = 1;

    function InjectKeys(keys, state) {
      keys.every((key) => {
          keybd_event(key, 0, state, 0xfeed);
      });
    }

    this.__sequences = [
      [VK_LCONTROL, VK_LWIN, VK_LEFT],
      [VK_LCONTROL, VK_LWIN, VK_RIGHT],
      [VK_LWIN, VK_LCONTROL, VK_LEFT],
      [VK_LWIN, VK_LCONTROL, VK_RIGHT],
    ];

    var MatchType = { None: 0, Partial: 1, Full: 2 };

    function EvaluateQueue() {
      var sequences = this.__sequences;
      var queue = this.__queue;

      var result = { matchType: MatchType.None, sequence: -1 };

      for (var si = 0; si < sequences.length; si++) {
          var sequence = sequences[si];

          var numOfElemToCheck = (queue.length < sequence.length) ? queue.length : sequence.length;

          var matchFound = true;
          for (var i = 0; i < numOfElemToCheck; i++) {
              if (queue[i] != sequence[i]) {
                  matchFound = false;
                  break;
              }
          }

          if (matchFound) {
              result.matchType = (queue.length == sequence.length) ? MatchType.Full : MatchType.Partial;
              result.sequence = si;

              if (result.matchType == MatchType.Full)
                  return result;
          }
      }

      return result;
    }

    function OnKeyDown(context) {
      if (context.extra == 0xfeed)
          return PASS_THROUGH_HOOK;

      if (context.vkCode == 255) // RDP-specific sync message
          return PASS_THROUGH_HOOK;

      if (this.__queue[this.__queue.length - 1] != context.vkCode) {
          this.__queue.push(context.vkCode);
      }

      var result = EvaluateQueue();

      if (result.matchType == MatchType.None) {
          setTimeout(() => { InjectKeys(this.__queue.slice(0), 2) }, 0);
          this.__queue.length = 0;
          return PASS_THROUGH_HOOK;
      } else if (result.matchType == MatchType.Partial) {
          return SKIP_HOOK;
      } else {
          this.__queue.pop();
          return SKIP_HOOK;
      }
    }

    function OnKeyUp(context) {
      for (var i = 0; i < this.__queue.length; i++) {
          if (this.__queue[i] === context.vkCode) {
              this.__queue.splice(i, 1);
          }
      }
      
      return PASS_THROUGH_HOOK;
    }

    function GetContext(nCode, wParam, lParam) {
      if (typeof this.__queue == 'undefined')
          this.__queue = [];
          
      return {
          shouldProcess: (nCode == 0),
          message: wParam,
          vkCode: Memory.readInt(lParam),
          scanCode: Memory.readInt(lParam.add(4)),
          flags: Memory.readInt(lParam.add(8)),
          time: Memory.readInt(lParam.add(12)),
          extra: Memory.readInt(lParam.add(16)),
          queue: this.__queue
      }
    }

    Interceptor.replace(keyboardProc, new NativeCallback(function (nCode, wParam, lParam) {
      var context = GetContext(nCode, wParam, lParam);
      var returnImmediately = false;
      
      switch (context.message) {
          case WM_KEYDOWN:
              returnImmediately = OnKeyDown(context);
              break;

          case WM_KEYUP:
              returnImmediately = OnKeyUp(context);
              break;
      }

      if (returnImmediately) {
          return CallNextHookEx(NULL, 0, wParam, lParam);
      } else {
          return originalKeyboardProc(nCode, wParam, lParam);
      }
    }, 'int64', ['int', 'uint64', 'pointer']));
}());
