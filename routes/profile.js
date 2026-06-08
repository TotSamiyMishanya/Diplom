const router = require('express').Router();
const bcrypt = require('bcrypt');

const { User, Request, Review, CustomerOrder } = require('../models');
const { requireAuth } = require('../middleware/auth');

function normalizeText(value) {
  return String(value || '').trim();
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

function validateReview(rating, comment) {
  const ratingNumber = Number(rating);

  if (!ratingNumber || ratingNumber < 1 || ratingNumber > 5) {
    return 'Оценка должна быть от 1 до 5';
  }

  if (comment.length > 500) {
    return 'Комментарий должен быть не длиннее 500 символов';
  }

  return null;
}

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'login', 'role']
    });

    const requests = await Request.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const review = await Review.findOne({
      where: { userId }
    });

    const orders = await CustomerOrder.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      ok: true,
      user,
      requests,
      review,
      orders
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.patch('/password', requireAuth, async (req, res) => {
  try {
    const newPassword = normalizeText(req.body.newPassword);

    const error = validatePassword(newPassword);

    if (error) {
      return res.status(400).json({ error });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await User.update(
      { passwordHash },
      { where: { id: req.session.user.id } }
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.patch('/requests/:id', requireAuth, async (req, res) => {
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

    const request = await Request.findOne({
      where: {
        id: req.params.id,
        userId: req.session.user.id
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    if (request.status !== 'new') {
      return res.status(400).json({ error: 'Можно редактировать только новые заявки' });
    }

    request.fullName = fullName;
    request.phone = phone;
    request.type = type;
    request.customType = customType;
    request.comment = comment || null;

    await request.save();

    res.json({ ok: true, request });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.delete('/requests/:id', requireAuth, async (req, res) => {
  try {
    const request = await Request.findOne({
      where: {
        id: req.params.id,
        userId: req.session.user.id
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }

    if (request.status !== 'new') {
      return res.status(400).json({ error: 'Можно удалить только новую заявку' });
    }

    await request.destroy();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.post('/review', requireAuth, async (req, res) => {
  try {
    const rating = req.body.rating;
    const comment = normalizeText(req.body.comment);

    const error = validateReview(rating, comment);

    if (error) {
      return res.status(400).json({ error });
    }

    const ratingNumber = Number(rating);

    let review = await Review.findOne({
      where: { userId: req.session.user.id }
    });

    if (review) {
      review.rating = ratingNumber;
      review.comment = comment || '';
      await review.save();
    } else {
      review = await Review.create({
        rating: ratingNumber,
        comment: comment || '',
        userId: req.session.user.id
      });
    }

    res.json({ ok: true, review });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

module.exports = router;