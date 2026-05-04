function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function initAuthLinks() {
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const profileLink = document.getElementById('profileLink');
  const adminLink = document.getElementById('adminLink');
  const logoutBtn = document.getElementById('logoutBtn');

  const res = await fetch('/api/auth/me');
  const data = await res.json();

  const user = data.user;

  if (!user) {
    profileLink.style.display = 'none';
    adminLink.style.display = 'none';
    logoutBtn.style.display = 'none';
    return;
  }

  loginLink.style.display = 'none';
  registerLink.style.display = 'none';

  if (user.role !== 'admin') {
    adminLink.style.display = 'none';
  }

  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = '/main/main.html';
  });
}

async function loadReviews() {
  const list = document.getElementById('reviewsList');
  const msg = document.getElementById('msg');

  const res = await fetch('/api/reviews');
  const data = await res.json();

  if (!res.ok) {
    msg.textContent = data.error || 'Ошибка загрузки отзывов';
    list.textContent = '';
    return;
  }

  list.innerHTML = '';

  if (!data.reviews || data.reviews.length === 0) {
    list.textContent = 'Пока отзывов нет.';
    return;
  }

  data.reviews.forEach(review => {
    const div = document.createElement('div');
    div.className = 'review-card';

    const date = new Date(review.createdAt).toLocaleString('ru-RU');

    div.innerHTML = `
      <p><b>${escapeHtml(review.User?.login || 'Пользователь')}</b></p>
      <p>Оценка: <b>${review.rating} из 5</b></p>
      <p>${escapeHtml(review.comment || '')}</p>
      <p>Дата: ${date}</p>
      <hr>
    `;

    list.appendChild(div);
  });
}

initAuthLinks();
loadReviews();