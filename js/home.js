function initQuiz(){
  const quizRoot = document.getElementById('quizList');
  if (!quizRoot) return;

  // 每次載入頁面時，各組隨機決定左／右哪一側為假圖
  const quizData = [
    { id:'q1', realSrc:'assets/images/true1.webp', fakeSrc:'assets/images/fake1.webp' },
    { id:'q2', realSrc:'assets/images/true2.webp', fakeSrc:'assets/images/fake2.webp' },
    { id:'q3', realSrc:'assets/images/true3.webp', fakeSrc:'assets/images/fake3.webp' },
    { id:'q4', realSrc:'assets/images/true4.webp', fakeSrc:'assets/images/fake4.webp' },
    { id:'q5', realSrc:'assets/images/true5.webp', fakeSrc:'assets/images/fake5.webp' },
    { id:'q6', realSrc:'assets/images/true6.webp', fakeSrc:'assets/images/fake6.webp' },
  ];

  quizRoot.innerHTML = '';

  quizData.forEach((q, idx) => {
    const fakeOnLeft = Math.random() < 0.5;
    const leftSrc = fakeOnLeft ? q.fakeSrc : q.realSrc;
    const rightSrc = fakeOnLeft ? q.realSrc : q.fakeSrc;
    const fakeSide = fakeOnLeft ? 'left' : 'right';

    const card = document.createElement('div');
    card.className = 'quizCard';
    card.innerHTML = `
      <div class="quizTop">
        <div class="quizLabel">第 ${idx+1} 組：判斷何者為假圖</div>
      </div>
      <div class="choiceGrid">
        <div class="choice" data-side="left">
          <div class="choice__img">
            <img alt="左側圖片" style="width:100%; height:100%; object-fit:cover;" src="${leftSrc}"/>
          </div>
          <div class="choice__btnRow">
            <button class="choice__btn" type="button" data-pick-fake-side="left">左圖為假</button>
          </div>
        </div>
        <div class="choice" data-side="right">
          <div class="choice__img">
            <img alt="右側圖片" style="width:100%; height:100%; object-fit:cover;" src="${rightSrc}"/>
          </div>
          <div class="choice__btnRow">
            <button class="choice__btn" type="button" data-pick-fake-side="right">右圖為假</button>
          </div>
        </div>
      </div>
      <div class="quizResult" data-result></div>
    `;

    const btnLeft = card.querySelector('[data-pick-fake-side="left"]');
    const btnRight = card.querySelector('[data-pick-fake-side="right"]');
    const result = card.querySelector('[data-result]');

    const setResult = (pickedSide) => {
      card.querySelectorAll('.choice').forEach(el => el.removeAttribute('data-selected'));
      const target = card.querySelector(`.choice[data-side="${pickedSide}"]`);
      if (target) target.setAttribute('data-selected', pickedSide);

      const ok = pickedSide === fakeSide;
      result.textContent = ok ? '答對！' : '答錯。';
    };

    btnLeft.addEventListener('click', () => setResult('left'));
    btnRight.addEventListener('click', () => setResult('right'));

    quizRoot.appendChild(card);
  });
}

function initOrihimeTabs(){
  const root = document.getElementById('orihimeTabs');
  if (!root) return;

  const btns = Array.from(root.querySelectorAll('[data-tab-btn]'));
  const panels = Array.from(root.querySelectorAll('[data-tab-panel]'));
  if (btns.length === 0 || panels.length === 0) return;

  const activate = (id) => {
    btns.forEach(b => b.setAttribute('aria-selected', String(b.getAttribute('data-tab-btn') === id)));
    panels.forEach(p => p.hidden = p.getAttribute('data-tab-panel') !== id);
  };

  btns.forEach(b => {
    b.addEventListener('click', () => activate(b.getAttribute('data-tab-btn')));
  });

  // default
  activate(btns[0].getAttribute('data-tab-btn'));
}

document.addEventListener('DOMContentLoaded', () => {
  initQuiz();
  initOrihimeTabs();
});

