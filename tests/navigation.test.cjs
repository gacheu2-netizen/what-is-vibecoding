const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const controller = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

function setup(hash = '') {
  const listeners = new Map();
  const makeElement = () => {
    const classes = new Set();
    return {
      style: {}, attributes: {}, textContent: '', disabled: false,
      classList: {
        add: name => classes.add(name), remove: name => classes.delete(name),
        contains: name => classes.has(name),
        toggle(name, value) { value ? classes.add(name) : classes.delete(name); },
      },
      setAttribute(name, value) { this.attributes[name] = value; },
      getAttribute(name) { return this.attributes[name]; },
      addEventListener(name, fn) { listeners.set(this.id + ':' + name, fn); },
      getBoundingClientRect: () => ({ left: 0, width: 1200 }),
    };
  };
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => {
    const element = makeElement();
    element.id = id;
    return [id, element];
  }));
  const slides = [...html.matchAll(/class="slide(?: active)?" id="([^"]+)"[^>]*data-notes="([^"]*)"/g)]
    .map(([, id, notes], index) => {
      const element = elements[id];
      element.classList.add('slide');
      if (index === 0) element.classList.add('active');
      element.dataset = { notes };
      element.attributes['data-notes'] = notes;
      return element;
    });
  elements.deck.children = slides;
  const window = {
    location: { hash },
    addEventListener: (name, fn) => listeners.set('window:' + name, fn),
    open: () => null,
  };
  const document = {
    getElementById: id => elements[id],
    addEventListener: (name, fn) => listeners.set('document:' + name, fn),
  };
  vm.runInNewContext(controller, {
    document, window, history: { replaceState: (_, __, value) => { window.location.hash = value; } },
  });
  const target = { closest: () => null };
  return {
    elements, slides, window,
    key: (key, extra = {}) => listeners.get('document:keydown')({ key, target, preventDefault() {}, ...extra }),
    click: id => listeners.get(id + ':click')({ target, clientX: 1000 }),
    changeHash(value) { window.location.hash = value; listeners.get('window:hashchange')(); },
    touch(dx, dy = 0) {
      listeners.get('deck:touchstart')({ touches: [{ clientX: 200, clientY: 200 }] });
      listeners.get('deck:touchend')({ changedTouches: [{ clientX: 200 + dx, clientY: 200 + dy }] });
    },
    expectSlide(number) {
      assert.equal(elements.counter.textContent, String(number).padStart(2, '0') + ' / 10');
      assert.equal(window.location.hash, '#' + number);
      assert.equal(slides.filter(s => s.classList.contains('active')).length, 1);
      assert.equal(slides[number - 1].classList.contains('active'), true);
      assert.equal(slides.filter(s => !s.inert).length, 1);
    },
  };
}

test('page has ten slides, unique IDs, one controller, and existing local assets', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((html.match(/class="slide(?: active)?"/g) || []).length, 10);
  assert.equal((html.match(/<script\b/g) || []).length, 1);
  assert.match(html, /<script src="script.js" defer><\/script>/);
  for (const [, file] of html.matchAll(/(?:src|href)="([^":]+)"/g)) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
});

test('keyboard reaches all ten slides and stops at each boundary', () => {
  const app = setup();
  app.expectSlide(1);
  app.key('ArrowLeft');
  app.expectSlide(1);
  for (let i = 2; i <= 10; i++) { app.key('ArrowRight'); app.expectSlide(i); }
  app.key(' ');
  app.expectSlide(10);
  assert.equal(app.elements.nextBtn.disabled, true);
  app.key(' ', { shiftKey: true });
  app.expectSlide(9);
  app.key('Home');
  app.expectSlide(1);
  assert.equal(app.elements.prevBtn.disabled, true);
  app.key('End');
  app.expectSlide(10);
});

test('buttons, slide clicks, URL navigation and reload use the same slide state', () => {
  const app = setup('#3');
  app.expectSlide(3);
  app.click('nextBtn'); app.expectSlide(4);
  app.click('prevBtn'); app.expectSlide(3);
  app.click('deck'); app.expectSlide(4);
  app.changeHash('#8'); app.expectSlide(8);
  app.changeHash('#999'); app.expectSlide(8);
  setup(app.window.location.hash).expectSlide(8);
});

test('swipes advance once, vertical scrolling stays on the slide, blocked notes do not crash', () => {
  const app = setup();
  app.touch(-100); app.expectSlide(2);
  app.click('deck'); app.expectSlide(2);
  app.touch(100); app.expectSlide(1);
  app.touch(-60, 150); app.expectSlide(1);
  assert.doesNotThrow(() => app.click('notesToggleBtn'));
  app.key('ArrowRight'); app.expectSlide(2);
});
