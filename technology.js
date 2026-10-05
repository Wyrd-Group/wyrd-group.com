/* Progressive enhancement for the WUI and ICARUS illustrations. */
(() => {
  'use strict';
  function enhanceTechnologyDiagrams() {
    document.querySelectorAll('.tech-diagram[data-tech-interactive]').forEach((diagram) => {
      if (diagram.dataset.techReady === 'true') return;
      const detail = diagram.querySelector('.tech-detail');
      const nodes = Array.from(diagram.querySelectorAll('.tech-node[data-tech-explanation]'));
      if (!detail || !detail.id || !nodes.length) return;
      const buttons = nodes.map((node, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = node.className;
        button.dataset.techExplanation = node.dataset.techExplanation;
        button.setAttribute('aria-controls', detail.id);
        button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
        while (node.firstChild) button.appendChild(node.firstChild);
        node.replaceWith(button);
        return button;
      });
      const select = (button) => {
        buttons.forEach((item) => item.setAttribute('aria-pressed', item === button ? 'true' : 'false'));
        detail.textContent = button.dataset.techExplanation;
      };
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => select(button));
        button.addEventListener('keydown', (event) => {
          let next;
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = buttons.length - 1;
          if (next === undefined) return;
          event.preventDefault();
          buttons[next].focus();
          select(buttons[next]);
        });
      });
      diagram.dataset.techReady = 'true';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceTechnologyDiagrams, { once: true });
  } else {
    enhanceTechnologyDiagrams();
  }
})();
