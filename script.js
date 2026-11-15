// ==========================================================================
// make-slide Standard Controller for Playful Theme
// ==========================================================================

  (function () {
    'use strict';

    var deck = document.getElementById('deck');
    if (!deck) return;

      var slides = Array.from(deck.querySelectorAll('.slide'));
      var total = slides.length;
      var current = 0;
      var notesVisible = false;

      var progressBar = document.getElementById('progress');
      var counter = document.getElementById('counter');
      var notesPanel = document.getElementById('notes-panel');
      var notesContent = document.getElementById('notes-content');

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

        var noteText = slides[current].getAttribute('data-notes') || '작성된 스피치 노트가 없습니다.';
        if (notesContent) notesContent.textContent = noteText;

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
            notesVisible = !notesVisible;
            if (notesPanel) notesPanel.classList.toggle('visible', notesVisible);
          }

          window.toggleNotes = toggleNotes;

            /* 키보드 내비게이션 */
            document.addEventListener('keydown', function (e) {
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

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
              if (e.target.closest('a, button, table, input')) return;
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
            var touchStartTime = 0;

              deck.addEventListener('touchstart', function (e) {
                touchStartX = e.touches[0].clientX;
                touchStartTime = Date.now();
              }, { passive: true });

                deck.addEventListener('touchend', function (e) {
                  var dx = e.changedTouches[0].clientX - touchStartX;
                  var dt = Date.now() - touchStartTime;

                    if (dt > 500 || Math.abs(dx) < 50) return;
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

            /* 초기화 */
            readHash();
            updateUI();
          })();
