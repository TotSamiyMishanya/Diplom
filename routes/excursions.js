const router = require('express').Router();
const { ExcursionRequest } = require('../models');
const { requireAuth } = require('../middleware/auth');

function normalizeText(value) {
  return String(value || '').trim();
}

function parseRuDate(value) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function validateExcursionRequest(fullName, phone, preferredDate, comment) {
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
    return 'Введите желаемую дату';
  }

  const parsedDate = parseRuDate(preferredDate);

  if (!parsedDate) {
    return 'Дата должна быть в формате дд.мм.гггг';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedDate < today) {
    return 'Дата экскурсии не может быть в прошлом';
  }

  if (comment.length > 500) {
    return 'Комментарий должен быть не длиннее 500 символов';
  }

  return null;
}

router.post('/request', requireAuth, async (req, res) => {
  try {
    const fullName = normalizeText(req.body.fullName);
    const phone = normalizeText(req.body.phone);
    const preferredDate = normalizeText(req.body.preferredDate);
    const comment = normalizeText(req.body.comment);

    const error = validateExcursionRequest(fullName, phone, preferredDate, comment);

    if (error) {
      return res.status(400).json({ error });
    }

    const created = await ExcursionRequest.create({
      fullName,
      phone,
      preferredDate,
      comment: comment || null,
      userId: req.session.user.id
    });

    res.json({ ok: true, request: created });
  } catch (e) {
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

module.exports = router;