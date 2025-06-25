const fs = require('fs');
const path = require('path');

beforeEach(() => {
  document.body.innerHTML = `
    <form id="nn-contact-form" action="/" method="POST">
      <input type="text" id="name" name="name" />
      <input type="email" id="email" name="email" />
      <textarea id="message" name="message"></textarea>
      <div class="loss-message hidden" id="loss-message"></div>
      <button type="submit" id="submit-btn"></button>
    </form>
  `;
  jest.resetModules();
  require('../js/scripts');
});

test('empty form shows loss message and prevents fetch', () => {
  const fetchSpy = jest.spyOn(global, 'fetch');
  const form = document.getElementById('nn-contact-form');
  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
  form.dispatchEvent(submitEvent);

  const loss = document.getElementById('loss-message');
  expect(loss.classList.contains('hidden')).toBe(false);
  expect(fetchSpy).not.toHaveBeenCalled();
});
