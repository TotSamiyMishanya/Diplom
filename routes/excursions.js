const router = require('express').Router();
const { Request } = require('../models');

function normalizeText(value) {
  return String(value || '').trim();
}

function validateRequest(fullName, phone, type, customType, comment) {
  const allowedTypes = ['excursion', 'measurement', 'other'];

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

  if (!allowedTypes.includes(type)) {
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

router.post('/request', async (req, res) => {
  try {
    const fullName = normalizeText(req.body.fullName);
    const phone = normalizeText(req.body.phone);
    const type = normalizeText(req.body.type);
    const rawCustomType = normalizeText(req.body.customType);
    const comment = normalizeText(req.body.comment);

    const customType = type === 'other' ? rawCustomType : '-';

    const error = validateRequest(fullName, phone, type, customType, comment);

    if (error) {
      return res.status(400).json({ error });
    }

    const userId = req.session.user ? req.session.user.id : null;

    const created = await Request.create({
      fullName,
      phone,
      type,
      customType,
      comment: comment || null,
      userId
    });

    res.json({ ok: true, request: created });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

module.exports = router;