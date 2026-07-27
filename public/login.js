const modeButtons = document.querySelectorAll('.toggle-btn[data-mode]');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginFormError = document.getElementById('loginFormError');
const signupFormError = document.getElementById('signupFormError');

function setMode(mode) {
  modeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.mode === mode));
  loginForm.classList.toggle('hidden', mode !== 'login');
  signupForm.classList.toggle('hidden', mode !== 'signup');
  loginFormError.classList.add('hidden');
  signupFormError.classList.add('hidden');
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});

function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  field.classList.toggle('has-error', hasError);
  field.querySelector('.field-error').classList.toggle('hidden', !hasError);
}

function clearFieldError(input) {
  const field = input.closest('.field');
  field.classList.remove('has-error');
  const errorEl = field.querySelector('.field-error');
  if (errorEl) errorEl.classList.add('hidden');
}

function validateFields(fields) {
  let valid = true;
  fields.forEach(({ fieldId, input }) => {
    const hasError = !input.value.trim();
    setFieldError(fieldId, hasError);
    if (hasError) valid = false;
  });
  return valid;
}

function submitForm(url, form) {
  const formData = new FormData(form);
  const body = new URLSearchParams();
  formData.forEach((value, key) => body.append(key, value));
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  }).then((response) => response.json());
}

const LOGIN_FIELDS = [
  { fieldId: 'loginFieldEmail', input: document.getElementById('loginEmail') },
  { fieldId: 'loginFieldPassword', input: document.getElementById('loginPassword') },
];

LOGIN_FIELDS.forEach(({ input }) => input.addEventListener('input', () => clearFieldError(input)));

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loginFormError.classList.add('hidden');
  if (!validateFields(LOGIN_FIELDS)) return;

  const submitBtn = loginForm.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitForm('/api/login', loginForm)
    .then((result) => {
      submitBtn.disabled = false;
      if (result.status === 'ok') {
        window.location.href = '/';
      } else {
        loginFormError.textContent = result.message || 'Unable to log in. Please try again.';
        loginFormError.classList.remove('hidden');
      }
    })
    .catch(() => {
      submitBtn.disabled = false;
      loginFormError.textContent = 'Unable to log in. Please try again.';
      loginFormError.classList.remove('hidden');
    });
});

const SIGNUP_FIELDS = [
  { fieldId: 'signupFieldName', input: document.getElementById('signupName') },
  { fieldId: 'signupFieldPhone', input: document.getElementById('signupPhone') },
  { fieldId: 'signupFieldEmail', input: document.getElementById('signupEmail') },
  { fieldId: 'signupFieldPassword', input: document.getElementById('signupPassword') },
];

SIGNUP_FIELDS.forEach(({ input }) => input.addEventListener('input', () => clearFieldError(input)));

signupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  signupFormError.classList.add('hidden');
  if (!validateFields(SIGNUP_FIELDS)) return;

  const submitBtn = signupForm.querySelector('.submit-btn');
  submitBtn.disabled = true;
  submitForm('/api/signup', signupForm)
    .then((result) => {
      submitBtn.disabled = false;
      if (result.status === 'saved') {
        window.location.href = '/';
      } else {
        signupFormError.textContent = result.message || 'Unable to sign up. Please try again.';
        signupFormError.classList.remove('hidden');
      }
    })
    .catch(() => {
      submitBtn.disabled = false;
      signupFormError.textContent = 'Unable to sign up. Please try again.';
      signupFormError.classList.remove('hidden');
    });
});

mountAuthNav();
mountFooterQr();
