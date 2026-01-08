const bcrypt = require("bcryptjs");

(async () => {
  const password = "Welcome@123"; // test password
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
})();
