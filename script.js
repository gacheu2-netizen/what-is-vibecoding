// ==========================================================================
// make-slide Standard Controller for Playful Theme
// ==========================================================================

  (function () {
    'use strict';

    var deck = document.getElementById('deck');
    if (!deck) return;

      var slides = Array.from(deck.children).filter(function (node) { return node.classList.contains('slide'); });
      if (!slides.length) return;
      var total = slides.length;
      var current = 0;
      var notesWindow = null;
      var prevButton = document.getElementById('prevBtn');
      var nextButton = document.getElementById('nextBtn');

      var progressBar = document.getElementById('progress');
      var counter = document.getElementById('counter');

      /* URL 해시 동기화 */
      function readHash() {
        var hash = window.location.hash;
        if (hash && /^#\d+$/.test(hash)) {
          var idx = parseInt(hash.substring(1), 10) - 1;
          if (idx >= 0 && idx < total) {
            slides[current].classList.remove('active');
            current = idx;
            slides[current].classList.add('active');
          }
        }
      }

      function writeHash() {
        history.replaceState(null, '', '#' + (current + 1));
      }

      /* UI 상태 갱신 */
      function updateUI() {
        var pct = ((current + 1) / total) * 100;
        if (progressBar) progressBar.style.width = pct + '%';

        var curStr = String(current + 1).padStart(2, '0');
        var totStr = String(total).padStart(2, '0');
        if (counter) counter.textContent = curStr + ' / ' + totStr;

        slides.forEach(function (slide, index) {
          slide.classList.toggle('active', index === current);
          slide.setAttribute('aria-hidden', String(index !== current));
          slide.inert = index !== current;
        });
        prevButton.disabled = current === 0;
        nextButton.disabled = current === total - 1;
        updateNotes();

        writeHash();
      }

        /* 슬라이드 이동 함수 */
        function goTo(index) {
          if (index < 0 || index >= total || index === current) return;
          slides[current].classList.remove('active');
          current = index;
          slides[current].classList.add('active');
          slides[current].scrollTop = 0;
          updateUI();
        }

        function next() { goTo(current + 1); }
        function prev() { goTo(current - 1); }

          /* 전체화면 */
          window.toggleFullscreen = function () {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(function () { });
            } else {
              document.exitFullscreen().catch(function () { });
            }
          };

          /* 발표자 노트 토글 */
function toggleNotes() {
  if (notesWindow && !notesWindow.closed) {
    notesWindow.close();
    notesWindow = null;
    return;
  }
  notesWindow = window.open('', 'SpeakerNotes', 'width=520,height=420,top=80,left=80');
  if (!notesWindow) return;
  notesWindow.document.write(`<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
         background: #1a1a1a; color: #e0e0e0; padding: 24px; }
  .slide-num { font-size: 12px; color: #888; margin-bottom: 12px; font-family: monospace; }
  .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
           color: #666; margin-bottom: 8px; }
  .notes { font-size: 16px; line-height: 1.8; color: #ccc; }
</style></head><body>
  <div class="slide-num" id="sn"></div>
  <div class="label">Speaker Notes</div>
  <div class="notes" id="nt"></div>
</body></html>`);
  notesWindow.document.close();
  updateNotes();
}

function updateNotes() {
  if (!notesWindow || notesWindow.closed) return;
  try {
    const note = slides[current].dataset.notes || '작성된 발표자 노트가 없습니다.';
    notesWindow.document.getElementById('nt').textContent = note;
    notesWindow.document.getElementById('sn').textContent =
      'Slide ' + (current + 1) + ' / ' + slides.length;
  } catch(e) {}
}

          window.toggleNotes = toggleNotes;

            /* 키보드 내비게이션 */
            document.addEventListener('keydown', function (e) {
              if (e.target.closest('input, textarea, select, [contenteditable]')) return;
              if (e.key === ' ' && e.target.closest('button, a')) return;

              switch (e.key) {
                case 'ArrowRight':
                case 'ArrowDown':
                case 'PageDown':
                  e.preventDefault();
                  next();
                  break;
                case 'ArrowLeft':
                case 'ArrowUp':
                case 'PageUp':
                case 'Backspace':
                  e.preventDefault();
                  prev();
                  break;
                case ' ':
                  e.preventDefault();
                  if (e.shiftKey) { prev(); } else { next(); }
                  break;
                case 'Home':
                  e.preventDefault();
                  goTo(0);
                  break;
                case 'End':
                  e.preventDefault();
                  goTo(total - 1);
                  break;
                case 'f':
                case 'F':
                case 'ㄹ':
                  e.preventDefault();
                  window.toggleFullscreen();
                  break;
                case 's':
                case 'S':
                case 'ㄴ':
                case 'n':
                case 'N':
                case 'ㅜ':
                  e.preventDefault();
                  toggleNotes();
                  break;
              }
            });

            /* 클릭 내비게이션 (화면 왼쪽 1/3 클릭 시 이전, 오른쪽 2/3 클릭 시 다음) */
            deck.addEventListener('click', function (e) {
              if (Date.now() < suppressClickUntil || e.target.closest('a, button, table, input')) return;
              var rect = deck.getBoundingClientRect();
              var x = e.clientX - rect.left;
              if (x < rect.width / 3) {
                prev();
              } else {
                next();
              }
            });

            /* 터치 스와이프 제어 */
            var touchStartX = 0;
            var touchStartY = 0;
            var touchStartTime = 0;
            var suppressClickUntil = 0;

              deck.addEventListener('touchstart', function (e) {
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
              }, { passive: true });

                deck.addEventListener('touchend', function (e) {
                  var dx = e.changedTouches[0].clientX - touchStartX;
                  var dt = Date.now() - touchStartTime;

                    var dy = e.changedTouches[0].clientY - touchStartY;
                    if (dt > 500 || Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
                    suppressClickUntil = Date.now() + 500;
                    if (dx < 0) {
                      next();
                    } else {
                      prev();
                    }
                }, { passive: true });

            /* 해시 변경 리스너 */
            window.addEventListener('hashchange', function () {
              readHash();
              updateUI();
            });

            prevButton.addEventListener('click', prev);
            nextButton.addEventListener('click', next);
            document.getElementById('notesToggleBtn').addEventListener('click', toggleNotes);
            document.getElementById('fullscreenBtn').addEventListener('click', window.toggleFullscreen);

            /* 초기화 */
            readHash();
            updateUI();
          })();
