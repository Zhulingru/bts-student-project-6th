/* Shared helpers for page interactions */

function qs(sel, root = document){
  return root.querySelector(sel);
}

function qsa(sel, root = document){
  return Array.from(root.querySelectorAll(sel));
}

function navActiveKeyFromLocation(){
  const path = window.location.pathname.split('/').pop() || '';
  const onIndex = path === 'index.html' || path === '';
  if (!onIndex) return 'home';
  const hash = (window.location.hash || '').replace(/^#/, '');
  if (hash === 'class-a') return 'a';
  if (hash === 'class-b') return 'b';
  return 'home';
}

function setActiveNav(){
  const active = navActiveKeyFromLocation();
  qsa('[data-nav="home"], [data-nav="a"], [data-nav="b"]').forEach(el => {
    const key = el.getAttribute('data-nav');
    el.classList.toggle('nav__link--active', key === active);
  });
}

/** 將 Google 簡報／雲端檔案／Canva 連結轉成可內嵌預覽的網址；其餘原樣回傳。 */
function projectEmbedUrl(raw){
  const u = String(raw || '').trim().replace(/^["'\s]+|["'\s]+$/g, '');
  if (!u || u === '#') return '';

  const drv = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (drv) return `https://drive.google.com/file/d/${drv[1]}/preview`;

  const g = u.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (g) return `https://docs.google.com/presentation/d/${g[1]}/embed`;

  const c = u.match(/canva\.com\/design\/([^/?#]+)\/([^/?#]+)/);
  if (c) return `https://www.canva.com/design/${c[1]}/${c[2]}/view?embed`;

  return u;
}

function studentDisplayName(student){
  if (!student) return '作品';
  return String(student.avatarName || student.name || '').trim() || '作品';
}

function initModal(){
  const modal = qs('#videoModal');
  if (!modal) return;

  const closeBtn = qs('#videoModalClose');
  const frame = qs('#videoFrame');
  const iframeWrap = qs('#iframeWrap');
  const videoWrap = qs('#videoWrap');
  const video = qs('#videoElement');
  const title = qs('#videoModalTitle');
  const fallback = qs('#videoFallbackLink');

  const panel = modal.querySelector('.modal__panel');

  const setOpen = (open) => {
    modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (!open) {
      if (frame) frame.src = '';
      if (video) {
        try {
          video.pause();
        } catch (_) {}
        video.removeAttribute('src');
        video.load();
      }
      if (videoWrap) videoWrap.hidden = true;
      if (iframeWrap) iframeWrap.hidden = false;
      if (panel) panel.classList.remove('modal__panel--embed');
    }
  };

  const close = () => setOpen(false);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  if (closeBtn) closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  // Expose a global opener so page scripts can trigger it.
  window.openStudentVideo = (student) => {
    if (!student) return;
    const original = String(student.projectUrl || student.notionUrl || student.driveUrl || '').trim();
    if (title) title.textContent = studentDisplayName(student);
    if (fallback) {
      fallback.href = original && original !== '#' ? original : '#';
      fallback.style.display = original && original !== '#' ? 'inline-flex' : 'none';
    }

    const hasVideo = !!(student.videoUrl && student.videoUrl !== '#');
    if (videoWrap) videoWrap.hidden = !hasVideo;
    if (iframeWrap) iframeWrap.hidden = hasVideo;
    if (panel) panel.classList.toggle('modal__panel--embed', !hasVideo);

    if (hasVideo) {
      if (frame) frame.src = '';
      if (video) {
        video.src = student.videoUrl;
        video.load();
      }
    } else {
      if (video) video.removeAttribute('src');
      if (frame) {
        const embed = projectEmbedUrl(original);
        frame.src = embed || 'about:blank';
      }
    }
    setOpen(true);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  window.addEventListener('hashchange', setActiveNav);
  initModal();
});

