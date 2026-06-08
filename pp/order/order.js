window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sendReq');
  const msg = document.getElementById('msg');
  const requestType = document.getElementById('requestType');
  const customTypeBlock = document.getElementById('customTypeBlock');
  const customTypeInput = document.getElementById('customType');

  if (!btn) return;

  customTypeBlock.style.display = 'none';

  requestType.addEventListener('change', () => {
    if (requestType.value === 'other') {
      customTypeBlock.style.display = 'block';
    } else {
      customTypeBlock.style.display = 'none';
      customTypeInput.value = '';
    }
  });

  function showMessage(text, type) {
    msg.textContent = text;

    msg.classList.remove('success', 'error');
    msg.classList.add(type);
  }

  function validateForm(fullName, phone, type, customType, comment) {
    if (!fullName) {
      return 'Введите ФИО';
    }
    if (fullName.length < 5) {
      return 'ФИО должно быть не короче 5 символов';
    }
    if (fullName.length > 80) {
      return 'ФИО должно быть не длиннее 80 символов';
    }
    if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(fullName)) {
      return 'ФИО может содержать только буквы, пробелы и дефис';
    }
    if (!phone) {
      return 'Введите телефон';
    }
    if (!/^8\d{10}$/.test(phone)) {
      return 'Введите номер телефона в формате 8XXXXXXXXXX';
    }
    if (!type) {
      return 'Выберите тип заявки';
    }
    if (!['excursion', 'measurement', 'other'].includes(type)) {
      return 'Некорректный тип заявки';
    }
    if (type === 'other') {
      if (!customType) {
        return 'Укажите название заявки';
      }
      if (customType.length < 3) {
        return 'Название заявки должно быть не короче 3 символов';
      }
      if (customType.length > 80) {
        return 'Название заявки должно быть не длиннее 80 символов';
      }
    }
    if (comment.length > 500) {
      return 'Комментарий должен быть не длиннее 500 символов';
    }
    return null;
  }

  btn.addEventListener('click', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const type = document.getElementById('requestType').value;
    const customType = document.getElementById('customType').value.trim();
    const comment = document.getElementById('comment').value.trim();

    const validationError = validateForm(fullName, phone, type, customType, comment);

    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    const r = await fetch('/api/excursions/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        phone,
        type,
        customType,
        comment
      })
    });

    const data = await r.json();

    if (!r.ok) {
      showMessage(data.error || 'Ошибка отправки обращения', 'error');
      return;
    }

    showMessage('Обращение успешно отправлено!', 'success');

    document.getElementById('fullName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('requestType').value = '';
    document.getElementById('customType').value = '';
    document.getElementById('comment').value = '';

    customTypeBlock.style.display = 'none';
  });
});