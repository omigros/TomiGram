'use strict';

const buttons = [...document.querySelectorAll('[data-messenger]')];
let transitionTimer;

function selectButton(id) {
  for (const button of buttons) {
    const selected = button.dataset.messenger === id;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
}

buttons.forEach((button) => {
  button.addEventListener('click', async () => {
    const id = button.dataset.messenger;
    if (button.classList.contains('active')) return;
    selectButton(id);
    document.body.classList.add('switching');
    clearTimeout(transitionTimer);
    transitionTimer = setTimeout(() => document.body.classList.remove('switching'), 240);
    try {
      await window.tomigram.switchMessenger(id);
    } catch (error) {
      console.error('Unable to switch messenger', error);
      document.body.classList.remove('switching');
    }
  });
});

window.tomigram.getActiveMessenger().then(selectButton);
window.tomigram.onMessengerChanged((id) => {
  selectButton(id);
  document.body.classList.remove('switching');
});
