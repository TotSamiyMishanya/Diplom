const router = require('express').Router();

const { Review, User } = require('../models');

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      include: [
        {
          model: User,
          attributes: ['login']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ ok: true, reviews });
  } catch (e) {
    res.status(500).json({ error: 'Серверная ошибка' });
  }
});

module.exports = router;