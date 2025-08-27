const sequenceEl = document.querySelector(".sequence");

if (sequenceEl) {
  let dots = 0;
  setInterval(() => {
    dots = (dots + 1) % 4;
    sequenceEl.textContent += ".";
    if (dots === 0) {
      sequenceEl.textContent = sequenceEl.textContent.replace(/\.+$/, "");
    }
  }, 500);
}

// Auto close after 4s
setTimeout(() => {
  // Ask VS Code host to close
  window.parent.postMessage({ command: "close" }, "*");
}, 4000);
