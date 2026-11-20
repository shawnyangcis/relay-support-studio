(function () {
  if (document.getElementById('relay-support-widget')) return;
  var script = document.currentScript || document.querySelector('script[src$="/embed.js"]');
  if (!script) return;
  var origin = new URL(script.src).origin;
  var host = document.createElement('div');
  host.id = 'relay-support-widget';
  var shadow = host.attachShadow({ mode: 'open' });
  var style = document.createElement('style');
  style.textContent = ':host{all:initial}*{box-sizing:border-box}button{position:fixed;right:24px;bottom:24px;z-index:2147483000;border:0;border-radius:50px;padding:17px 22px;background:#194f43;color:#fff;box-shadow:0 8px 30px #16392b33;font:600 15px -apple-system,BlinkMacSystemFont,sans-serif;cursor:pointer}button:focus-visible{outline:3px solid #e6a576;outline-offset:4px}iframe{position:fixed;right:24px;bottom:88px;width:410px;height:650px;max-height:calc(100dvh - 115px);max-width:calc(100vw - 32px);z-index:2147483000;border:1px solid #d6dfd9;border-radius:20px;box-shadow:0 20px 90px #16392b2b;background:white}iframe[hidden]{display:none}@media(max-width:480px){iframe{right:16px;bottom:86px}button{right:16px;bottom:18px}}';
  var frame = document.createElement('iframe');
  frame.id = 'relay-support-frame'; frame.title = 'Relay support assistant'; frame.hidden = true;
  frame.setAttribute('allow', 'clipboard-write');
  var button = document.createElement('button');
  button.type = 'button'; button.textContent = 'Chat with Relay';
  button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', frame.id);
  function toggle(open) { if (open && !frame.src) frame.src = origin + '/embed'; frame.hidden = !open; button.textContent = open ? 'Close chat' : 'Chat with Relay'; button.setAttribute('aria-expanded', String(open)); }
  button.addEventListener('click', function () { toggle(frame.hidden); });
  shadow.append(style, frame, button); document.body.appendChild(host);
})();
