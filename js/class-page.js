function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (c) => {
    const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
    return map[c] || c;
  });
}

/** 縮圖全失敗時的極簡佔位（不依賴本機圖檔）。 */
const THUMB_PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
  '<rect fill="#0F1630" width="800" height="450"/>' +
  '<rect x="1" y="1" width="798" height="448" fill="none" stroke="rgba(255,255,255,.12)"/>' +
  '</svg>'
);

function getProjectUrl(student){
  if (!student) return '';
  return String(student.projectUrl || student.notionUrl || student.driveUrl || '').trim();
}

function getDriveFileIdFromUrl(url){
  const u = String(url || '');
  let m = u.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = u.match(/drive\.google\.com\/open\?[^#]*\bid=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}

function getDriveThumbChain(fileId){
  const id = encodeURIComponent(fileId);
  return [
    `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w1920`,
    `https://drive.google.com/uc?export=view&id=${id}`,
  ];
}

function wireDriveThumbImage(img, fileId){
  const chain = getDriveThumbChain(fileId);
  let step = 0;
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', function onDriveThumbErr(){
    step += 1;
    if (step < chain.length) {
      img.src = chain[step];
    } else {
      img.removeEventListener('error', onDriveThumbErr);
      if (img.src !== THUMB_PLACEHOLDER) img.src = THUMB_PLACEHOLDER;
    }
  });
  img.src = chain[0];
}

async function loadStudents(){
  try{
    const res = await fetch('data/students.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }catch(e){
    return {
      A: [
        { id:'a1', name:'學生甲', avatarName:'分身甲', projectUrl:'#' },
        { id:'a2', name:'學生乙', avatarName:'分身乙', projectUrl:'#' },
        { id:'a3', name:'學生丙', avatarName:'分身丙', projectUrl:'#' },
      ],
      B: [
        { id:'b1', name:'學生丁', avatarName:'分身丁', projectUrl:'#' },
        { id:'b2', name:'學生戊', avatarName:'分身戊', projectUrl:'#' },
      ],
    };
  }
}

function renderStudentCards(students, className, gridEl){
  if (!gridEl) return;
  gridEl.innerHTML = '';

  if (!students || students.length === 0){
    gridEl.innerHTML = `<div class="panel" style="text-align:center; color: var(--muted2); font-weight:900;">${className} 班：尚未載入學生資料</div>`;
    return;
  }

  students.forEach((s) => {
    const displayName = s.avatarName || s.name || '分身';
    const safeName = escapeHtml(displayName);
    const explicitThumb = String(s.thumbUrl || '').trim();
    const driveId = getDriveFileIdFromUrl(getProjectUrl(s));
    const projectUrl = getProjectUrl(s);
    const hasProjectLink = projectUrl && projectUrl !== '#';

    const card = document.createElement('div');
    card.className = 'studentCard';
    card.innerHTML = `
      <div class="studentTop">
        <div>
          <p class="studentName">${safeName}</p>
        </div>
        <div class="pill">${className} 班</div>
      </div>`;

    const wrap = document.createElement('div');
    wrap.className = 'studentVideoWrap';
    if (hasProjectLink) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'studentThumbLink';
      btn.title = '在頁面內預覽作品';
      btn.setAttribute('aria-label', `${displayName}：在頁面內預覽作品`);
      const img = document.createElement('img');
      img.className = 'studentThumb';
      if (s.id) img.dataset.studentId = s.id;
      img.alt = `${displayName} 作品預覽`;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (explicitThumb) {
        const thumbDriveId = getDriveFileIdFromUrl(explicitThumb);
        if (thumbDriveId) {
          wireDriveThumbImage(img, thumbDriveId);
        } else {
          img.referrerPolicy = '';
          img.src = explicitThumb;
          img.addEventListener('error', function onThumbErr(){
            img.removeEventListener('error', onThumbErr);
            img.src = THUMB_PLACEHOLDER;
          });
        }
      } else if (driveId) {
        wireDriveThumbImage(img, driveId);
      } else {
        img.referrerPolicy = '';
        img.src = THUMB_PLACEHOLDER;
      }
      btn.appendChild(img);
      btn.addEventListener('click', () => {
        if (typeof window.openStudentVideo === 'function') window.openStudentVideo(s);
      });
      wrap.appendChild(btn);
    } else {
      wrap.innerHTML = '<div class="studentNoVideo">尚未提供作品連結</div>';
    }
    card.appendChild(wrap);

    gridEl.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const gridA = document.getElementById('studentGridA');
  const gridB = document.getElementById('studentGridB');
  if (!gridA || !gridB) return;
  const students = await loadStudents();
  renderStudentCards(students.A || [], 'A', gridA);
  renderStudentCards(students.B || [], 'B', gridB);
});
