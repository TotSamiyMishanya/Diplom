const router = require('express').Router();
const { ExcursionRequest, User } = require('../models');
const { requireAdmin } = require('../middleware/auth');
router.get('/requests', requireAdmin, async (req, res) => {
  const list = await ExcursionRequest.findAll({
    include: [{ model: User, attributes: ['login'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json({ ok: true, list });
});
router.patch('/requests/:id', requireAdmin, async (req, res) => {
  const { status } = req.body; 
  const allowed = ['new', 'approved', 'rejected'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Плохой статус' });
  const reqItem = await ExcursionRequest.findByPk(req.params.id);
  if (!reqItem) return res.status(404).json({ error: 'Не найдено' });
  reqItem.status = status;
  await reqItem.save();
  res.json({ ok: true });
});
module.exports = router;