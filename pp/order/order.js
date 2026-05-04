window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('sendReq');
  const msg = document.getElementById('msg');
  const dateInput = document.getElementById('preferredDate');

  if (!btn) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayIso = today.toISOString().split('T')[0];
  dateInput.min = todayIso;

  function showMessage(text, type) {
    msg.textContent = text;

    msg.classList.remove('success', 'error');
    msg.classList.add(type);
  }

  function convertDateToRuFormat(value) {
    const parts = value.split('-');

    if (parts.length !== 3) {
      return '';
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    return `${day}.${month}.${year}`;
  }

  function validateForm(fullName, phone, preferredDate, comment) {
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

    if (!preferredDate) {
      return 'Выберите желаемую дату';
    }

    const selectedDate = new Date(preferredDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return 'Дата экскурсии не может быть в прошлом';
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
    const preferredDateValue = document.getElementById('preferredDate').value;
    const comment = document.getElementById('comment').value.trim();

    const validationError = validateForm(fullName, phone, preferredDateValue, comment);

    if (validationError) {
      showMessage(validationError, 'error');
      return;
    }

    const preferredDate = convertDateToRuFormat(preferredDateValue);

    const r = await fetch('/api/excursions/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, phone, preferredDate, comment })
    });

    const data = await r.json();

    if (!r.ok) {
      if (r.status === 401) {
        showMessage('Сначала войдите в аккаунт.', 'error');
        return;
      }

      showMessage(data.error || 'Ошибка отправки заявки', 'error');
      return;
    }

    showMessage('Заявка успешно отправлена!', 'success');

    document.getElementById('fullName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('preferredDate').value = '';
    document.getElementById('comment').value = '';
  });
});