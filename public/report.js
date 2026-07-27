const form = document.getElementById('reportForm');
const successState = document.getElementById('successState');
const formError = document.getElementById('formError');
const toggleButtons = document.querySelectorAll('.toggle-btn');
const hiddenType = form.querySelector('input[name="type"]');
const submitBtn = form.querySelector('.submit-btn');

const REQUIRED_FIELDS = [
  { fieldId: 'fieldName', input: document.getElementById('itemName') },
  { fieldId: 'fieldLocation', input: document.getElementById('location') },
  { fieldId: 'fieldDescription', input: document.getElementById('description') },
  { fieldId: 'fieldEmail', input: document.getElementById('email') },
];

toggleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    toggleButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    hiddenType.value = button.dataset.value;
  });
});

function setFieldError(fieldId, hasError) {
  const field = document.getElementById(fieldId);
  field.classList.toggle('has-error', hasError);
  const errorEl = field.querySelector('.field-error');
  errorEl.classList.toggle('hidden', !hasError);
}

function clearFieldError(input) {
  const field = input.closest('.field');
  field.classList.remove('has-error');
  const errorEl = field.querySelector('.field-error');
  if (errorEl) errorEl.classList.add('hidden');
}

REQUIRED_FIELDS.forEach(({ input }) => {
  input.addEventListener('input', () => clearFieldError(input));
});

function validate() {
  let valid = true;
  REQUIRED_FIELDS.forEach(({ fieldId, input }) => {
    const hasError = !input.value.trim();
    setFieldError(fieldId, hasError);
    if (hasError) valid = false;
  });
  return valid;
}

function resetForm() {
  form.reset();
  toggleButtons.forEach((btn) => btn.classList.remove('active'));
  document.querySelector('.toggle-btn[data-value="Lost"]').classList.add('active');
  hiddenType.value = 'Lost';
  REQUIRED_FIELDS.forEach(({ fieldId }) => setFieldError(fieldId, false));
  formError.classList.add('hidden');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.classList.add('hidden');

  if (!validate()) return;

  const formData = new FormData(form);
  const body = new URLSearchParams();
  formData.forEach((value, key) => body.append(key, value));

  submitBtn.disabled = true;

  fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
    .then((response) => response.json())
    .then((result) => {
      submitBtn.disabled = false;
      if (result.status === 'saved') {
        resetForm();
        form.classList.add('hidden');
        successState.classList.remove('hidden');
      } else {
        formError.textContent = 'Unable to save the report. Please try again.';
        formError.classList.remove('hidden');
      }
    })
    .catch(() => {
      submitBtn.disabled = false;
      formError.textContent = 'Unable to save the report. Please try again.';
      formError.classList.remove('hidden');
    });
});

document.getElementById('submitAnother').addEventListener('click', () => {
  successState.classList.add('hidden');
  form.classList.remove('hidden');
});
