function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (c) => {
    const map = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
    return map[c] || c;
  });
}

/** 分身／暱稱 → 大頭照檔名（不含路徑）。若 JSON 有 imageFile 則優先使用。 */
const STUDENT_NAME_MAP = {
  A: {},
  B: {}
};

const IMAGE_EXT_OVERRIDES = {
  A: {},
  B: {}
};

function getStudentName(student, className){
  const map = STUDENT_NAME_MAP[className] || {};
  return map[student.avatarName] || student.name || student.avatarName || '學生';
}

function getStudentImageSrc(student, className){
  const folder = `${className}class`;
  if (student && student.imageFile) {
    const f = String(student.imageFile).trim();
    if (f.includes('.')) return `assets/images/${folder}/${f}`;
    return `assets/images/${folder}/${f}.png`;
  }
  const studentName = getStudentName(student, className);
  const extMap = IMAGE_EXT_OVERRIDES[className] || {};
  const ext = extMap[studentName] || 'png';
  return `assets/images/${folder}/${studentName}.${ext}`;
}

async function loadStudents(){
  try{
    const res = await fetch('data/students.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }catch(e){
    // Preview fallback if JSON isn't ready yet
    return {
      A: [
        { id:'a1', name:'學生甲', avatarName:'分身甲', notionUrl:'#' },
        { id:'a2', name:'學生乙', avatarName:'分身乙', notionUrl:'#' },
        { id:'a3', name:'學生丙', avatarName:'分身丙', notionUrl:'#' },
      ],
      B: [
        { id:'b1', name:'學生丁', avatarName:'分身丁', notionUrl:'#' },
        { id:'b2', name:'學生戊', avatarName:'分身戊', notionUrl:'#' },
      ],
    };
  }
}

function renderStudentCards(students, className){
  const grid = document.getElementById('studentGrid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!students || students.length === 0){
    grid.innerHTML = `<div class="panel" style="text-align:center; color: var(--muted2); font-weight:900;">${className} 班：尚未載入學生資料</div>`;
    return;
  }

  students.forEach((s) => {
    const displayName = s.avatarName || s.name || '分身';
    const safeName = escapeHtml(displayName);
    const imageSrc = getStudentImageSrc(s, className);
    const safeImageSrc = escapeHtml(imageSrc);
    const notionUrl = String(s.notionUrl || '').trim();
    const safeNotionUrl = escapeHtml(notionUrl);
    const hasNotion = notionUrl && notionUrl !== '#';

    const card = document.createElement('div');
    card.className = 'studentCard';
    card.innerHTML = `
      <div class="studentTop">
        <div>
          <p class="studentName">${safeName}</p>
        </div>
        <div class="pill">${className} 班</div>
      </div>
      <div class="studentVideoWrap">
        ${hasNotion
          ? `<a class="studentThumbLink" href="${safeNotionUrl}" target="_blank" rel="noopener noreferrer">
              <img class="studentThumb" data-student-id="${escapeHtml(s.id || '')}" src="${safeImageSrc}" alt="${safeName}" loading="lazy" />
            </a>`
          : `<div class="studentNoVideo">尚未提供 Notion 連結</div>`
        }
      </div>
    `;

    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const className = document.body.getAttribute('data-class') || 'A';
  const students = await loadStudents();
  renderStudentCards(students[className] || [], className);
});

