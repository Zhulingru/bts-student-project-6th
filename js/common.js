/* Shared helpers for page interactions */

function qs(sel, root = document){
  return root.querySelector(sel);
}

function qsa(sel, root = document){
  return Array.from(root.querySelectorAll(sel));
}

function setActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const map = {
    'index.html': 'home',
    'a.html': 'a',
    'b.html': 'b',
  };
  const active = map[path] || 'home';
  qsa('[data-nav="home"], [data-nav="a"], [data-nav="b"]').forEach(el => {
    const key = el.getAttribute('data-nav');
    el.classList.toggle('nav__link--active', key === active);
  });
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
    if (title) title.textContent = `${student.name} / ${student.avatarName}`;
    if (fallback) {
      const url = student.projectUrl || student.notionUrl || student.driveUrl || '#';
      fallback.href = url;
      fallback.style.display = url && url !== '#' ? 'inline-flex' : 'none';
    }

    const hasVideo = !!(student.videoUrl && student.videoUrl !== '#');
    if (videoWrap) videoWrap.hidden = !hasVideo;
    if (iframeWrap) iframeWrap.hidden = hasVideo;

    if (hasVideo) {
      if (frame) frame.src = '';
      if (video) {
        video.src = student.videoUrl;
        video.load();
      }
    } else {
      if (video) video.removeAttribute('src');
      if (frame) {
        const url = student.projectUrl || student.notionUrl || student.driveUrl || 'about:blank';
        frame.src = url;
      }
    }
    setOpen(true);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initModal();
});

