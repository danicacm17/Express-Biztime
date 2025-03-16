/** Server startup for BizTime. */

const app = require("./app");
const db = require("./db"); // Import the db connection

app.listen(3000, function () {
  console.log("Listening on 3000");
});