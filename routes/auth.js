const router = require('express').Router();
const bcrypt = require('bcrypt');
const { User } = require('../models');

function normalizeLogin(login) {
  return String(login || '').trim();
}

function normalizePassword(password) {
  return String(password || '').trim();
}

function validateLogin(login) {
  if (!login) return 'Введите логин';

  if (login.length < 3) {
    return 'Логин должен быть не короче 3 символов';
  }

  if (login.length > 20) {
    return 'Логин должен быть не длиннее 20 символов';
  }

  if (!/^[a-zA-Z0-9_]+$/.test(login)) {
    return 'Логин может содержать только английские буквы, цифры и знак _';
  }

  return null;
}

function validatePassword(password) {
  if (!password) return 'Введите пароль';

  if (password.length < 6) {
    return 'Пароль должен быть не короче 6 символов';
  }

  if (password.length > 50) {
    return 'Пароль должен быть не длиннее 50 символов';
  }

  return null;
}

router.post('/register', async (req, res) => {
  try {
    const login = normalizeLogin(req.body.login);
    const password = normalizePassword(req.body.password);

    const loginError = validateLogin(login);
    if (loginError) {
      return res.status(400).json({ error: loginError });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const exists = await User.findOne({ where: { login } });
    if (exists) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ login, passwordHash, role: 'user' });

    req.session.user = { id: user.id, login: user.login, role: user.role };
    res.json({ ok: true, user: req.session.user });
  } catch (e) {
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const login = normalizeLogin(req.body.login);
    const password = normalizePassword(req.body.password);

    if (!login || !password) {
      return res.status(400).json({ error: 'Введите логин и пароль' });
    }

    const user = await User.findOne({ where: { login } });
    if (!user) {
      return res.status(400).json({ error: 'Неверный логин или пароль' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ error: 'Неверный логин или пароль' });
    }

    req.session.user = { id: user.id, login: user.login, role: user.role };
    res.json({ ok: true, user: req.session.user });
  } catch (e) {
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

module.exports = router;