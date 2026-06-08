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

function getTypeText(type) {
  if (type === 'excursion') return 'На экскурсию';
  if (type === 'measurement') return 'На замеры';
  if (type === 'other') return 'Другое';
  return type;
}

function showMessage(elementId, text, type = '') {
  const el = document.getElementById(elementId);

  el.textContent = text;
  el.classList.remove('success', 'error');

  if (type) {
    el.classList.add(type);
  }
}

function validatePassword(password) {
  if (!password) return 'Введите новый пароль';
  if (password.length < 6) return 'Пароль должен быть не короче 6 символов';
  if (password.length > 50) return 'Пароль должен быть не длиннее 50 символов';

  return null;
}

function validateRequestForm(fullName, phone, type, customType, comment) {
  if (!fullName) return 'Введите ФИО';

  if (fullName.length < 5) {
    return 'ФИО должно быть не короче 5 символов';
  }

  if (fullName.length > 80) {
    return 'ФИО должно быть не длиннее 80 символов';
  }

  if (!/^[а-яА-ЯёЁa-zA-Z\s-]+$/.test(fullName)) {
    return 'ФИО может содержать только буквы, пробелы и дефис';
  }

  if (!phone) return 'Введите телефон';

  if (!/^8\d{10}$/.test(phone)) {
    return 'Введите номер телефона в формате 8XXXXXXXXXX';
  }

  if (!type) return 'Выберите тип заявки';

  if (!['excursion', 'measurement', 'other'].includes(type)) {
    return 'Некорректный тип заявки';
  }

  if (type === 'other') {
    if (!customType) return 'Укажите название заявки';

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

function validateReviewForm(rating, comment) {
  if (!rating) return 'Выберите оценку от 1 до 5';

  if (Number(rating) < 1 || Number(rating) > 5) {
    return 'Оценка должна быть от 1 до 5';
  }

  if (comment.length > 500) {
    return 'Комментарий должен быть не длиннее 500 символов';
  }

  return null;
}

function initProfileTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.profile-tab-panel');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      buttons.forEach(btn => btn.classList.remove('active'));
      panels.forEach(panel => panel.classList.remove('active'));

      button.classList.add('active');

      const activePanel = document.getElementById(tabId);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
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
  renderOrders(data.orders);
  renderReview(data.review);

  showMessage('msg', '');
}

function renderRequests(requests) {
  const list = document.getElementById('requestsList');
  list.innerHTML = '';

  if (!requests || requests.length === 0) {
    list.textContent = 'У вас пока нет обращений.';
    return;
  }

  requests.forEach(item => {
    const canEdit = item.status === 'new';

    const div = document.createElement('div');
    div.className = 'request-card';

    div.innerHTML = `
      <p><b>Обращение №${item.id}</b></p>
      <p>Статус: <b>${getStatusText(item.status)}</b></p>
      <p>Дата отправки: ${new Date(item.createdAt).toLocaleString('ru-RU')}</p>

      <div>
        <input id="fullName-${item.id}" value="${escapeHtml(item.fullName)}" ${canEdit ? '' : 'disabled'}>
      </div>

      <div>
        <input id="phone-${item.id}" value="${escapeHtml(item.phone)}" ${canEdit ? '' : 'disabled'}>
      </div>

      <div>
        <label class="field-label" for="type-${item.id}">Тип заявки</label>
        <select id="type-${item.id}" ${canEdit ? '' : 'disabled'}>
          <option value="excursion" ${item.type === 'excursion' ? 'selected' : ''}>На экскурсию</option>
          <option value="measurement" ${item.type === 'measurement' ? 'selected' : ''}>На замеры</option>
          <option value="other" ${item.type === 'other' ? 'selected' : ''}>Другое</option>
        </select>
      </div>

      <div id="customTypeBlock-${item.id}" class="custom-type-block" style="${item.type === 'other' ? '' : 'display: none;'}">
        <label class="field-label" for="customType-${item.id}">Название заявки</label>
        <input id="customType-${item.id}" value="${escapeHtml(item.customType === '-' ? '' : item.customType)}" ${canEdit ? '' : 'disabled'}>
      </div>

      <div>
        <textarea id="comment-${item.id}" ${canEdit ? '' : 'disabled'}>${escapeHtml(item.comment || '')}</textarea>
      </div>

      <div>
        ${canEdit ? `
          <button data-id="${item.id}" class="save-request-btn">Сохранить</button>
          <button data-id="${item.id}" class="delete-request-btn">Удалить</button>
        ` : `
          <p>Одобренные и отклонённые обращения нельзя редактировать.</p>
        `}
      </div>
    `;

    list.appendChild(div);
  });

  requests.forEach(item => {
    const typeSelect = document.getElementById(`type-${item.id}`);
    const customTypeBlock = document.getElementById(`customTypeBlock-${item.id}`);
    const customTypeInput = document.getElementById(`customType-${item.id}`);

    if (!typeSelect) return;

    typeSelect.addEventListener('change', () => {
      if (typeSelect.value === 'other') {
        customTypeBlock.style.display = 'block';
      } else {
        customTypeBlock.style.display = 'none';
        customTypeInput.value = '';
      }
    });
  });

  document.querySelectorAll('.save-request-btn').forEach(btn => {
    btn.addEventListener('click', () => updateRequest(btn.dataset.id));
  });

  document.querySelectorAll('.delete-request-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteRequest(btn.dataset.id));
  });
}

function renderOrders(orders) {
  const list = document.getElementById('ordersList');
  list.innerHTML = '';

  if (!orders || orders.length === 0) {
    list.textContent = 'История заказов пока пуста.';
    return;
  }

  orders.forEach(order => {
    const div = document.createElement('div');
    div.className = 'order-card';

    div.innerHTML = `
      ${order.imagePath ? `
        <img class="order-image" src="${escapeHtml(order.imagePath)}" alt="Фото заказа">
      ` : ''}

      <div class="order-info">
        <p><b>Заказ №${order.id}</b></p>
        <p>Сумма заказа: <b>${escapeHtml(order.amount)} ₽</b></p>
        <p>Дата заказа: ${escapeHtml(order.orderDate || '-')}</p>
        <p>Дата отдачи заказчику: ${escapeHtml(order.deliveryDate || '-')}</p>
      </div>
    `;

    list.appendChild(div);
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
  const type = document.getElementById(`type-${id}`).value;
  const customType = document.getElementById(`customType-${id}`).value.trim();
  const comment = document.getElementById(`comment-${id}`).value.trim();

  const validationError = validateRequestForm(fullName, phone, type, customType, comment);

  if (validationError) {
    showMessage('requestsMsg', validationError, 'error');
    return;
  }

  const res = await fetch('/api/profile/requests/' + id, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName,
      phone,
      type,
      customType,
      comment
    })
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage('requestsMsg', data.error || 'Ошибка сохранения обращения', 'error');
    return;
  }

  await loadProfile();

  showMessage('requestsMsg', 'Обращение сохранено', 'success');
}

async function deleteRequest(id) {
  const ok = confirm('Удалить это обращение?');
  if (!ok) return;

  const res = await fetch('/api/profile/requests/' + id, {
    method: 'DELETE'
  });

  const data = await res.json();

  if (!res.ok) {
    showMessage('requestsMsg', data.error || 'Ошибка удаления обращения', 'error');
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

initProfileTabs();
loadProfile();