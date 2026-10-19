/** Runs in the chat page at document start. Stamps iframe allow, then installs the drag border. */
export const FRAME_SCRIPT = `(() => {
  const mediaAllow = "camera; microphone; autoplay; display-capture";
  const stamp = (iframe) => {
    if (!iframe || String(iframe.tagName).toUpperCase() !== "IFRAME") return;
    const current = iframe.getAttribute("allow") || "";
    if (/\\bcamera\\b/.test(current) && /\\bmicrophone\\b/.test(current)) return;
    iframe.setAttribute("allow", current ? current + "; " + mediaAllow : mediaAllow);
  };
  const originalCreate = Document.prototype.createElement;
  Document.prototype.createElement = function (tag, options) {
    const element = originalCreate.call(this, tag, options);
    if (String(tag).toLowerCase() === "iframe") stamp(element);
    return element;
  };
  const srcDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
  if (srcDesc && srcDesc.get && srcDesc.set) {
    Object.defineProperty(HTMLIFrameElement.prototype, "src", {
      configurable: true,
      enumerable: srcDesc.enumerable,
      get() {
        return srcDesc.get.call(this);
      },
      set(value) {
        stamp(this);
        srcDesc.set.call(this, value);
      },
    });
  }
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (String(this.tagName).toUpperCase() === "IFRAME" && String(name).toLowerCase() === "src") {
      stamp(this);
    }
    return originalSetAttribute.call(this, name, value);
  };

  let topFrame = true;
  try {
    topFrame = window.top === window;
  } catch (error) {
    topFrame = false;
  }
  if (!topFrame) return;

  const boot = () => {
    if (document.getElementById("sno-frame")) return;

    const style = document.createElement("style");
    style.id = "sno-frame-style";
    style.textContent = \`
      #sno-frame { display: none; }
      html.sno-frame #sno-frame { display: block; }
      #sno-frame {
        position: fixed;
        inset: 0;
        z-index: 2147483646;
        pointer-events: none;
        border: 2px solid rgba(96, 165, 250, 0.95);
        border-radius: 12px;
        box-sizing: border-box;
      }
      #sno-top, .sno-edge, #sno-grip, #sno-close { pointer-events: auto; }
      #sno-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 0 6px 0 8px;
        background: rgba(12, 16, 28, 0.92);
        color: #f4f7ff;
        font: 12px/1 system-ui, sans-serif;
        border-radius: 10px 10px 0 0;
        box-sizing: border-box;
        -webkit-app-region: no-drag;
      }
      #sno-drag, .sno-edge {
        -webkit-app-region: drag;
      }
      #sno-drag {
        flex: 1;
        cursor: grab;
        user-select: none;
      }
      #sno-close, #sno-grip {
        -webkit-app-region: no-drag;
      }
      #sno-close {
        appearance: none;
        border: 0;
        background: rgba(255, 255, 255, 0.14);
        color: inherit;
        border-radius: 6px;
        padding: 4px 8px;
        font: inherit;
        cursor: pointer;
      }
      #sno-close:hover { background: rgba(255, 255, 255, 0.26); }
      .sno-edge { position: absolute; cursor: grab; }
      .sno-left, .sno-right { top: 28px; bottom: 14px; width: 8px; }
      .sno-left { left: 0; }
      .sno-right { right: 0; }
      .sno-bottom { left: 8px; right: 16px; bottom: 0; height: 8px; }
      #sno-grip {
        position: absolute;
        right: 2px;
        bottom: 2px;
        width: 16px;
        height: 16px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 0 42%, rgba(255,255,255,0.95) 42% 54%, transparent 54% 64%, rgba(255,255,255,0.95) 64% 76%, transparent 76%);
      }
    \`;
    document.documentElement.appendChild(style);

    const frame = document.createElement("div");
    frame.id = "sno-frame";
    frame.innerHTML = \`
      <div id="sno-top">
        <div id="sno-drag">Drag</div>
        <button id="sno-close" type="button">Close</button>
      </div>
      <div class="sno-edge sno-left"></div>
      <div class="sno-edge sno-right"></div>
      <div class="sno-edge sno-bottom"></div>
      <div id="sno-grip"></div>
    \`;
    document.documentElement.appendChild(frame);

    const close = document.getElementById("sno-close");
    close.addEventListener("mousedown", (event) => event.stopPropagation());
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      const invoke = window.ipc && window.ipc.invoke;
      if (!invoke) return;
      invoke("overlay:set-visible", false).catch((error) => console.error(error));
    });

    document.getElementById("sno-grip").addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const invoke = window.ipc && window.ipc.invoke;
      if (!invoke) return;
      invoke("settings:get").then((state) => {
        const originX = event.screenX;
        const originY = event.screenY;
        const originW = state.width;
        const originH = state.height;
        const move = (ev) => {
          invoke(
            "overlay:set-size",
            Math.round(originW + (ev.screenX - originX)),
            Math.round(originH + (ev.screenY - originY)),
          ).catch((error) => console.error(error));
        };
        const up = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", up);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", up);
      }).catch((error) => console.error(error));
    });

    window.__sno = window.__sno || {};
    window.__sno.setFrame = (on) => {
      document.documentElement.classList.toggle("sno-frame", Boolean(on));
    };
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();`
