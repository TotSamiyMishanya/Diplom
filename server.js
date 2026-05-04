const express = require('express');
const session = require('express-session');
const path = require('path');

const { initDb } = require('./models');

const authRoutes = require('./routes/auth');
const excursionRoutes = require('./routes/excursions');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');
const reviewsRoutes = require('./routes/reviews');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'pp_secret_123',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, 'pp')));

app.use('/api/auth', authRoutes);
app.use('/api/excursions', excursionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reviews', reviewsRoutes);

app.get('/', (req, res) => {
  res.redirect('/main/main.html');
});

initDb().then(() => {
  app.listen(3000, () => console.log('Сервер запущен на: http://localhost:3000'));
});
