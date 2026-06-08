const router = require('express').Router();

const { Request, User, CustomerOrder } = require('../models');
const { requireAdmin } = require('../middleware/auth');

function normalizeText(value) {
  return String(value || '').trim();
}

function getTypeTitle(type) {
  if (type === 'excursion') return 'Заявка на экскурсию';
  if (type === 'measurement') return 'Заявка на замеры';
  if (type === 'other') return 'Другое обращение';
  return type;
}

router.get('/requests', requireAdmin, async (req, res) => {
  try {
    const type = normalizeText(req.query.type);

    const where = {};

    if (type) {
      where.type = type;
    }

    const list = await Request.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['login']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ ok: true, list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.patch('/requests/:id', requireAdmin, async (req, res) => {
  try {
    const status = normalizeText(req.body.status);

    const allowed = ['new', 'approved', 'rejected'];

    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Плохой статус' });
    }

    const reqItem = await Request.findByPk(req.params.id);

    if (!reqItem) {
      return res.status(404).json({ error: 'Не найдено' });
    }

    reqItem.status = status;
    await reqItem.save();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await CustomerOrder.findAll({
      include: [
        {
          model: User,
          attributes: ['login']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ ok: true, orders });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.post('/orders', requireAdmin, async (req, res) => {
  try {
    const login = normalizeText(req.body.login);
    const imagePath = normalizeText(req.body.imagePath);
    const amount = normalizeText(req.body.amount);
    const orderDate = normalizeText(req.body.orderDate);
    const deliveryDate = normalizeText(req.body.deliveryDate);

    if (!login) {
      return res.status(400).json({ error: 'Введите логин пользователя' });
    }

    const user = await User.findOne({
      where: { login }
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким логином не найден' });
    }

    const order = await CustomerOrder.create({
      userId: user.id,
      imagePath,
      amount: amount || 0,
      orderDate,
      deliveryDate,
    });

    res.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.patch('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await CustomerOrder.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const login = normalizeText(req.body.login);
    const imagePath = normalizeText(req.body.imagePath);
    const amount = normalizeText(req.body.amount);
    const orderDate = normalizeText(req.body.orderDate);
    const deliveryDate = normalizeText(req.body.deliveryDate);

    if (login) {
      const user = await User.findOne({
        where: { login }
      });

      if (!user) {
        return res.status(404).json({ error: 'Пользователь с таким логином не найден' });
      }

      order.userId = user.id;
    }

    order.imagePath = imagePath;
    order.amount = amount || 0;
    order.orderDate = orderDate;
    order.deliveryDate = deliveryDate;

    await order.save();

    res.json({ ok: true, order });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

router.delete('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await CustomerOrder.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    await order.destroy();

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

module.exports = router;