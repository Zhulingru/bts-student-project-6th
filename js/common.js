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

/**
 * 可播放內容（優先於 PDF／簡報 iframe）。
 * videoUrl 可填：YouTube 連結、Google 雲端「影片」檔案連結、直接 .mp4/.webm 網址。
 */
function resolvePlayableMedia(student){
  const v = String(student.videoUrl || '').trim();
  if (!v || v === '#') return null;
  let m = v.match(/(?:youtube\.com\/watch\?[^#]*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (m) return { mode: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  m = v.match(/vimeo\.com\/(\d+)/);
  if (m) return { mode: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  m = v.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return { mode: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };
  if (/\.(mp4|webm|ogv|ogg)(\?|$)/i.test(v)) return { mode: 'video', src: v };
  if (v.startsWith('http')) return { mode: 'video', src: v };
  return null;
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

  const docLink = qs('#videoDocLink');

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
      if (docLink) docLink.hidden = true;
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
    const docUrl = String(student.projectUrl || student.notionUrl || student.driveUrl || '').trim();
    const videoRaw = String(student.videoUrl || '').trim();
    const playable = resolvePlayableMedia(student);

    if (title) title.textContent = studentDisplayName(student);

    const useVideoEl = playable && playable.mode === 'video';
    const useMediaIframe = playable && playable.mode === 'iframe';

    if (videoWrap) videoWrap.hidden = !useVideoEl;
    if (iframeWrap) iframeWrap.hidden = useVideoEl;
    if (panel) panel.classList.toggle('modal__panel--embed', !useVideoEl);

    if (useVideoEl) {
      if (frame) frame.src = '';
      if (video) {
        video.src = playable.src;
        video.load();
      }
    } else if (useMediaIframe) {
      if (video) {
        try {
          video.pause();
        } catch (_) {}
        video.removeAttribute('src');
        video.load();
      }
      if (frame) frame.src = playable.src;
    } else {
      if (video) video.removeAttribute('src');
      if (frame) {
        const embed = projectEmbedUrl(docUrl);
        frame.src = embed || 'about:blank';
      }
    }

    const openVideoTab = videoRaw && videoRaw !== '#';
    const openDocTab = docUrl && docUrl !== '#';
    if (fallback) {
      if (playable && openVideoTab) {
        fallback.href = videoRaw;
        fallback.textContent = '在新分頁開啟影片／媒體連結';
      } else if (openDocTab) {
        fallback.href = docUrl;
        fallback.textContent = '在新分頁開啟原始連結';
      } else {
        fallback.href = '#';
        fallback.textContent = '在新分頁開啟原始連結';
      }
      fallback.style.display = (playable && openVideoTab) || openDocTab ? 'inline-flex' : 'none';
    }

    if (docLink) {
      const showDoc = playable && openDocTab && docUrl !== videoRaw;
      docLink.href = docUrl || '#';
      docLink.hidden = !showDoc;
    }

    setOpen(true);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  window.addEventListener('hashchange', setActiveNav);
  initModal();
});

