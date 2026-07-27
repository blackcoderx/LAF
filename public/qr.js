function buildQrSvg(text, sizePx) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) rects += `<rect x="${c}" y="${r}" width="1" height="1"/>`;
    }
  }
  return `<svg viewBox="0 0 ${n} ${n}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">${rects}</svg>`;
}

function mountFooterQr() {
  const el = document.getElementById('footerQr');
  if (!el) return;
  const url = `${location.origin}/report`;
  el.innerHTML = buildQrSvg(url, 56);
}
