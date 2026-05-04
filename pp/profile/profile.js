let currentProfile = null;

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getStatusText(status) {
  if (status === 'new') return 'Новая';
  if (status === 'approved') return 'Одобрена';
  if (status === 'rejected') return 'Отклонена';
  return status;
}

function showMessage(elementId, text, type = '') {
  const el = document.getElementById(elementId);

  el.textContent = text;
  el.classList.remove('success', 'error');

  if (type) {
    el.classList.add(type);
  }
}

function getTodayIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today.toISOString().split('T')[0];
}

function ruDateToIso(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(value || ''));

  if (!match) {
    return '';
  }

  const day = match[1];
  const month = match[2];
  const year = match[3];

  return `${year}-${month}-${day}`;
}

function isoDateToRu(value) {
  const parts = String(value || '').split('-');

  if (parts.length !== 3) {
    return '';
  }

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  return `${day}.${month}.${year}`;
}

function validatePassword(password) {
  if (!password) {
    return 'Введите новый пароль';
  }

  if (password.length < 6) {
    return 'Пароль должен быть не короче 6 символов';
  }

  if (password.length > 50) {
    return 'Пароль должен быть не длиннее 50 символов';
  }

  return null;
}

function validateRequestForm(fullName, phone, preferredDateIso, comment) {
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

  if (!preferredDateIso) {
    return 'Выберите желаемую дату';
  }

  const selectedDate = new Date(preferredDateIso);
  selectedDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return 'Дата экскурсии не может быть в прошлом';
  }

  if (comment.length > 500) {
    return 'Комментарий должен быть не длиннее 500 символов';
  }

  return null;
}

function validateReviewForm(rating, comment) {
  if (!rating) {
    return 'Выберите оценку от 1 до 5';
  }

  if (Number(rating) < 1 || Number(rating) > 5) {
    return 'Оценка должна быть от 1 до 5';
  }

  if (comment.length > 500) {
    return 'Комментарий должен быть не длиннее 500 символов';
  }

  return null;
}

async function loadProfile() {
  const res = await fetch('/api/profile');
  const data = await res.json();

  if (!res.ok) {
    location.href = '/auth/login.html';
    return;
  }

  currentProfile = data;

  document.getElementById('loginText').textContent = data.user.login;

  const adminLink = document.getElementById('adminLink');
  if (data.user.role !== 'admin') {
    adminLink.style.display = 'none';
  }

  renderRequests(data.requests);
  renderReview(data.review);

  showMessage('msg', '');
}

function renderRequests(requests) {
  const list = document.getElementById('requestsList');
  list.innerHTML = '';

  if (!requests || requests.length === 0) {
    list.textContent = 'У вас пока нет заявок.';
    return;
  }

  requests.forEach(item => {
    const canEdit = item.status === 'new';
    const dateValue = ruDateToIso(item.preferredDate);

    const div = document.createElement('div');
    div.className = 'request-card';

    div.innerHTML = `
      <p><b>Заявка №${item.id}</b></p>
      <p>Статус: <b>${getStatusText(item.status)}</b></p>

      <div>
        <input id="fullName-${item.id}" value="${escapeHtml(item.fullName)}" ${canEdit ? '' : 'disabled'}>
      </div>

      <div>
        <input id="phone-${item.id}" value="${escapeHtml(item.phone)}" ${canEdit ? '' : 'disabled'}>
      </div>

      <div>
        <input id="date-${item.id}" type="date" min="${getTodayIso()}" value="${escapeHtml(dateValue)}" ${canEdit ? '' : 'disabled'}>
      </div>

      <div>
        <textarea id="comment-${item.id}" ${canEdit ? '' : 'disabled'}>${escapeHtml(item.comment || '')}</textarea>
      </div>

      <div>
        ${canEdit ? `
          <button data-id="${item.id}" class="save-request-btn">Сохранить</button>
          <button data-id="${item.id}" class="delete-request-btn">Удалить</button>
        ` : `
          <p>Одобренные и отклонённые заявки нельзя редактировать.</p>
        `}
      </div>
    `;

    list.appendChild(div);
  });

  document.querySelectorAll('.save-request-btn').forEach(btn => {
    btn.addEventListener('click', () => updateRequest(btn.dataset.id));
  });

  document.querySelectorAll('.delete-request-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteRequest(btn.dataset.id));
  });
}

function renderReview(review) {
  if (!review) return;

  const radio = document.querySelector(`input[name="rating"][value="${review.rating}"]`);
  if (radio) radio.checked = true;

  document.getElementById('reviewComment').value = review.comment || '';
}

async function changePassword() {
  const passwordInput = document.getElementById('newPassword');
  const newPassword = passwordInput.value.trim();

  const validationError = validatePassword(newPassword);

  if (validationError) {
    showMessage('passwordMsg', validationError, 'error');
    return;
  }

  const res = await fetch('/api/profile/password', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ newPassword })
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage('passwordMsg', data.error || 'Ошибка изменения пароля', 'error');
    return;
  }

  passwordInput.value = '';
  showMessage('passwordMsg', 'Пароль изменён', 'success');
}

async function updateRequest(id) {
  const fullName = document.getElementById(`fullName-${id}`).value.trim();
  const phone = document.getElementById(`phone-${id}`).value.trim();
  const preferredDateIso = document.getElementById(`date-${id}`).value;
  const comment = document.getElementById(`comment-${id}`).value.trim();

  const validationError = validateRequestForm(fullName, phone, preferredDateIso, comment);

  if (validationError) {
    showMessage('requestsMsg', validationError, 'error');
    return;
  }

  const preferredDate = isoDateToRu(preferredDateIso);

  const res = await fetch('/api/profile/requests/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName,
      phone,
      preferredDate,
      comment
    })
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage('requestsMsg', data.error || 'Ошибка сохранения заявки', 'error');
    return;
  }

  await loadProfile();

  showMessage('requestsMsg', 'Заявка сохранена', 'success');
}

async function deleteRequest(id) {
  const ok = confirm('Удалить эту заявку?');
  if (!ok) return;

  const res = await fetch('/api/profile/requests/' + id, {
    method: 'DELETE'
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage('requestsMsg', data.error || 'Ошибка удаления заявки', 'error');
    return;
  }

  await loadProfile();
}

async function saveReview() {
  const checkedRating = document.querySelector('input[name="rating"]:checked');
  const rating = checkedRating ? checkedRating.value : null;
  const comment = document.getElementById('reviewComment').value.trim();

  const validationError = validateReviewForm(rating, comment);

  if (validationError) {
    showMessage('reviewMsg', validationError, 'error');
    return;
  }

  const res = await fetch('/api/profile/review', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rating,
      comment
    })
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage('reviewMsg', data.error || 'Ошибка сохранения отзыва', 'error');
    return;
  }

  showMessage('reviewMsg', 'Отзыв сохранён', 'success');
}

document.getElementById('changePasswordBtn').addEventListener('click', changePassword);
document.getElementById('saveReviewBtn').addEventListener('click', saveReview);

document.getElementById('logoutBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  await fetch('/api/auth/logout', { method: 'POST' });
  location.href = '/main/main.html';
});

loadProfile();