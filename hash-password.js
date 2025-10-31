// فایل: hash-password.js
const bcrypt = require('bcryptjs');

const plainPassword = 'Dada_9875'; // رمز عبور مورد نظر خود را اینجا بنویسید
const saltRounds = 12;

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Plain Password:', plainPassword);
  console.log('Hashed Password:', hash);
});