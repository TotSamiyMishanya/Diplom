const router = require('express').Router();
const bcrypt = require('bcrypt');

const { User, ExcursionRequest, Review } = require('../models');
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

    const requests = await ExcursionRequest.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const review = await Review.findOne({
      where: { userId }
    });

    res.json({
      ok: true,
      user,
      requests,
      review
    });
  } catch (e) {
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
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.patch('/requests/:id', requireAuth, async (req, res) => {
  try {
    const fullName = normalizeText(req.body.fullName);
    const phone = normalizeText(req.body.phone);
    const preferredDate = normalizeText(req.body.preferredDate);
    const comment = normalizeText(req.body.comment);

    const error = validateExcursionRequest(fullName, phone, preferredDate, comment);

    if (error) {
      return res.status(400).json({ error });
    }

    const request = await ExcursionRequest.findOne({
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
    request.preferredDate = preferredDate;
    request.comment = comment || null;

    await request.save();

    res.json({ ok: true, request });
  } catch (e) {
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.delete('/requests/:id', requireAuth, async (req, res) => {
  try {
    const request = await ExcursionRequest.findOne({
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
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

module.exports = router;