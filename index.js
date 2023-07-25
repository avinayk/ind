var module = require("module");
const express = require("express");
const nodemailer = require("nodemailer");
var router = express.Router();
const cors = require("cors");
var http = require("http");
var fs = require("fs");
var httpProxy = require("http-proxy");
const path = require("path");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
var request = require("request");
const app = (module.exports = express());
const https = require("https");
const md5 = require("md5");
// var httpServer = http.createServer((req, res) => {
//   res.send();
// });

// var port = 8000;
// app.listen(port, () => {
//   console.log(`Server listening on the port no.:${port}`);
// });

const path = require("path");
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "/public"));
});

// if not in production use the port 5000
const PORT = process.env.PORT || 8000;

console.log("server started on port:", PORT);
app.listen(PORT);

//app.listen();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://65.2.71.56:8000"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.static(__dirname + "/public"));

const db = mysql.createPool({
  connectionLimit: 10000, //important
  host: "roster.cqsns4d8loz6.us-west-2.rds.amazonaws.com",
  user: "admin",
  password: ")DuMy5t?Ou00",
  database: "roster",
  debug: false,
});

db.getConnection(function (err, connection) {
  connection.release();
});
app.use(cors());
//app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.get("/test", (req, res) => {
  console.log("start");
});
app.post("/register", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  let users = {
    first_name: data.first_name,
    middle_name: data.middle_name,
    last_name: data.last_name,
    email: data.email,
    password: md5(data.password),
    contact: data.contact,
    address: data.address,
    skills: data.skills,
    status: "Inactive",
    years: data.years,
    created_at: new Date(),
  };
  db.query(
    "SELECT * FROM users WHERE email=?",
    [data.email],
    function (err, row, fields) {
      if (err) throw err;
      // console.log(row);
      if (row == "") {
        db.query(
          "INSERT INTO users SET ?",
          users,
          function (error, results, fields) {
            if (error) throw error;
            var idd = results.insertId;
            var status = "1";
            res.json({ status });
          }
        );
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
});

app.post("/login", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  var pass = md5(data.password);
  db.query(
    "SELECT * FROM users WHERE email=?",
    [data.email, pass],
    function (err, row, fields) {
      if (err) throw err;
      console.log(row[0].status);

      if (row != "") {
        if (row[0].status == "Inactive") {
          var status = 3;
        } else {
          var status = row;
        }
        res.json({ status });
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
});

//Admin Panel
app.post("/admin/login", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  var pass = md5(data.password);
  db.query(
    "SELECT * FROM admin WHERE email=? And password",
    [data.email, pass],
    function (err, row, fields) {
      if (err) throw err;
      //console.log(row);
      if (row != "") {
        var status = row;
        //console.log(row);
        res.json({ status });
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
});

app.post("/admin/addclient", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  var data = req.body;

  let formdata = {
    email: data.email,
    name: data.name,
    position: data.position,
    department: data.department,
    phone_number: data.phone_number,
    mobile_number: data.mobile_number,
    home_phone_number: data.home_phone_number,
    fax_number: data.fax_number,
    created_at: new Date(),
  };
  db.query(
    "SELECT * FROM clients WHERE email=?",
    [data.email],
    function (err, row, fields) {
      if (err) throw err;
      //console.log(row);
      if (row == "") {
        db.query(
          "INSERT INTO clients SET ?",
          formdata,
          function (error, results, fields) {
            if (error) throw error;
            var idd = results.insertId;
            var status = "1";
            res.json({ status });
          }
        );
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
});
app.get("/admin/getclient", (req, res) => {
  db.query(
    "SELECT * FROM clients  order by id desc",
    function (err, results, fields) {
      if (err) throw err;

      res.json({ results });
    }
  );
});

app.get("/admin/getemployee", (req, res) => {
  db.query(
    "SELECT * FROM users  order by id desc",
    function (err, results, fields) {
      if (err) throw err;

      res.json({ results });
    }
  );
});
app.get("/admin/getlocation", (req, res) => {
  db.query(
    "SELECT * FROM locations  order by id desc",
    function (err, results, fields) {
      if (err) throw err;

      res.json({ results });
    }
  );
});
app.post("/admin/getclient", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  var id = data.clientId;
  db.query(
    "SELECT * FROM clients WHERE id=?",
    [id],
    function (err, row, fields) {
      if (err) throw err;
      // console.log(row);
      res.json({ row });
    }
  );
});
app.post("/admin/getidlocation", function (req, res) {
  //console.log(req.body);

  var data = req.body;
  var id = data.locationId;
  db.query(
    "SELECT * FROM locations WHERE id=?",
    [id],
    function (err, row, fields) {
      if (err) throw err;
      var location = row;
      //console.log(location[0].id);
      if (location != "") {
        db.query(
          "SELECT * FROM clients WHERE id=?",
          [location[0].client_id],
          function (err, row, fields) {
            if (err) throw err;
            var r = row;
            if (r != "") {
              // console.log(r);
              const currentDate = location[0].duration_start;
              const formattedDate = currentDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              const currentDatee = location[0].duration_end;
              const formattedDatee = currentDatee.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              let locations = {
                id: location[0].id,
                client_id: location[0].client_id,
                location_name: location[0].location_name,
                nearest_town: location[0].nearest_town,
                commodity: location[0].commodity,
                contract_type: location[0].contract_type,
                duration_start: formattedDate,
                duration_end: formattedDatee,
                scope: location[0].scope,
                client_name: r[0].name,
              };
              //console.log(locations);
              res.json({ locations });
            }
          }
        );
      }
    }
  );
});
app.post("/admin/getuser", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  var id = data.userId;
  db.query("SELECT * FROM users WHERE id=?", [id], function (err, row, fields) {
    if (err) throw err;
    // console.log(row);
    res.json({ row });
  });
});
app.post("/admin/userregister", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  let users = {
    first_name: data.first_name,
    middle_name: data.middle_name,
    last_name: data.last_name,
    email: data.email,
    password: md5(data.password),
    contact: data.contact,
    address: data.address,
    skills: data.skills,
    years: data.years,
    created_at: new Date(),
  };
  db.query(
    "SELECT * FROM users WHERE email=?",
    [data.email],
    function (err, row, fields) {
      if (err) throw err;
      // console.log(row);
      if (row == "") {
        db.query(
          "INSERT INTO users SET ?",
          users,
          function (error, results, fields) {
            if (error) throw error;
            var idd = results.insertId;
            var status = "1";
            res.json({ status });
          }
        );
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
});

app.post("/admin/addlocation", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  let locations = {
    client_id: data.client_id,
    location_name: data.location_name,
    nearest_town: data.nearest_town,
    commodity: data.commodity,
    contract_type: data.contract_type,
    duration_start: data.duration_start,
    duration_end: data.duration_end,
    scope: data.scope,
    created_at: new Date(),
  };
  db.query(
    "INSERT INTO locations SET ?",
    locations,
    function (error, results, fields) {
      if (error) throw error;
      var idd = results.insertId;
      var status = "1";
      res.json({ status });
    }
  );
});

app.post("/admin/getminesites", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  var id = data.clientId;
  db.query(
    "SELECT * FROM locations WHERE client_id=? order by id desc",
    [id],
    function (err, results, fields) {
      if (err) throw err;
      //  console.log(results);
      res.json({ results });
    }
  );
});

app.post("/admin/setRoster", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  var ndate = new Date();
  const formattedDate = ndate.toISOString().split("T")[0];
  if (data.type == "2/2") {
    var number_day_start = "2";
    var number_day_end = "2";
  }
  if (data.type == "8/6") {
    var number_day_start = "8";
    var number_day_end = "6";
  }
  if (data.type == "3/1") {
    var number_day_start = "3";
    var number_day_end = "1";
  }
  if (data.type == "2/1") {
    var number_day_start = "2";
    var number_day_end = "1";
  }
  if (data.type == "15/13") {
    var number_day_start = "15";
    var number_day_end = "13";
  }
  if (data.type == "7/7") {
    var number_day_start = "7";
    var number_day_end = "7";
  }
  console.log(number_day_start);
  console.log(number_day_end);
  db.query(
    "SELECT * FROM locations WHERE id=? And duration_end > ? order by id desc",
    [data.locationId, formattedDate],
    function (err, row, fields) {
      if (err) throw err;
      var ss = row;
      if (row != "") {
        db.query(
          "SELECT * FROM rosters WHERE user_id=? And client_id=? order by id desc",
          [data.user_id, data.clientID],
          function (err, row, fields) {
            if (err) throw err;

            if (row != "") {
              var status = "1";
              res.json({ status });
            } else {
              let rosters = {
                number_day_start: number_day_start,
                number_day_end: number_day_end,
                duration_date: ss[0].duration_end,
                location_id: data.locationId,
                client_id: data.clientID,
                user_id: data.user_id,
                type: data.type,
                created_at: new Date(),
              };
              db.query(
                "INSERT INTO rosters SET ?",
                rosters,
                function (error, results, fields) {
                  if (error) throw error;
                  db.query(
                    "SELECT * FROM users WHERE id=?",
                    [data.user_id],
                    function (err, row, fields) {
                      if (err) throw err;
                      var em = row;
                      var msg = "is select the roster";
                      let notifications = {
                        user_id: data.user_id,
                        message: msg,
                        date: new Date(),
                      };
                      db.query(
                        "INSERT INTO notifications SET ?",
                        notifications,
                        function (error, results, fields) {
                          if (error) throw error;
                        }
                      );
                    }
                  );
                }
              );
              var status = "2";
              res.json({ status });
            }
          }
        );
      } else {
        var status = "3";
        res.json({ status });
      }
    }
  );
});
app.post("/admin/getroster", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  db.query(
    "SELECT * FROM rosters WHERE user_id=? order by id desc",
    [data.user_id],
    function (err, results, fields) {
      if (err) throw err;
      res.json({ results });
    }
  );
});

app.post("/admin/getallroster", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  db.query(
    "SELECT rosters.*,locations.location_name,locations.client_id,locations.id,clients.id,clients.name FROM rosters join locations on rosters.location_id = locations.id join clients on locations.client_id = clients.id WHERE rosters.user_id=? And locations.duration_end >=? order by rosters.id desc",
    [data.user_id, formattedDate],
    function (err, results, fields) {
      if (err) throw err;
      res.json({ results });
    }
  );
});
app.post("/admin/getclient_check", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  db.query(
    "SELECT * from locations  where client_id =?",
    [data.clientId],
    function (err, results, fields) {
      if (err) throw err;
      res.json({ results });
    }
  );
});
app.post("/admin/getlocateroster", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  db.query(
    "SELECT * from rosters  where location_id =?",
    [data.clientId],
    function (err, results, fields) {
      if (err) throw err;
      res.json({ results });
    }
  );
});
app.post("/admin/attendancesave", function (req, res) {
  var data = req.body;
  console.log(data);
  let att = {
    user_id: data.user_id,
    client_id: data.clientId,
    location_id: data.location,
    roster: data.roster,
    hours: data.hour,
    shift: data.shift,
    status: data.status,
    date: new Date(),
    created_at: new Date(),
  };
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  db.query(
    "SELECT * from attendance where user_id =? And roster=? And date=?",
    [data.user_id, data.roster, formattedDate],
    function (err, row, fields) {
      if (err) throw err;
      if (row == "") {
        db.query(
          "INSERT INTO attendance SET ?",
          att,
          function (error, results, fields) {
            if (error) throw error;
            var status = "1";
            res.json({ row });
            db.query(
              "SELECT * FROM users WHERE id=?",
              [data.user_id],
              function (err, row, fields) {
                if (err) throw err;
                var em = row;
                var msg = "";
                if (data.shift === "Empty") {
                  if (data.status === "Sick Leave") {
                    var msg = " is Sick Leave";
                  }
                  if (data.status === "AL") {
                    var msg = " is Annual Leave";
                  }
                } else {
                  var msg =
                    " is " + data.shift + " shift and " + data.hour + " hours";
                }
                console.log(msg);

                let notifications = {
                  user_id: data.user_id,
                  message: msg,
                  date: new Date(),
                };
                db.query(
                  "INSERT INTO notifications SET ?",
                  notifications,
                  function (error, results, fields) {
                    if (error) throw error;
                  }
                );
              }
            );
          }
        );
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
  console.log(data);
});

app.post("/admin/daystatus", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  db.query(
    "SELECT * from attendance  where user_id =? And date =?",
    [data.user_id, formattedDate],
    function (err, row, fields) {
      if (err) throw err;
      res.json({ row });
    }
  );
});

app.post("/admin/getAttendancedetailForDay", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  var s = data.user_id;
  var status = "Present";
  var day = "Day";
  db.query(
    "SELECT YEAR(date) as year, MONTH(date) AS month ,id,status,date FROM  attendance where shift =? And status = ? And user_id = ? And client_id = ? ORDER BY id asc",
    [day, status, s, data.client_id],
    function (err, results, fields) {
      if (err) throw err;
      const data = {};

      results.forEach((row) => {
        const month = row.month;
        if (!data[month]) {
          data[month] = [];
        }
        const currentDate = new Date(row.date);
        const day = String(currentDate.getDate()).padStart(2, "0");
        row.nd = day;
        //console.log(row);
        data[month].push(row);
      });
      //console.log(data);
      res.json({ data });
    }
  );
});
app.post("/admin/getuserdetails", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  db.query(
    "SELECT * from users  where id =?",
    [data.user_id],
    function (err, row, fields) {
      if (err) throw err;
      //console.log(row);
      res.json({ row });
    }
  );
});
app.post("/admin/getclientFuser", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  db.query(
    "SELECT rosters.*,clients.id,locations.location_name,clients.name FROM rosters join clients on rosters.client_id = clients.id join locations on rosters.location_id = locations.id WHERE rosters.user_id=? And locations.duration_end >=? order by rosters.id desc",
    [data.user_id, formattedDate],
    function (err, results, fields) {
      if (err) throw err;
      res.json({ results });
    }
  );
});
app.post("/admin/getclientroster", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  console.log(data);
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  db.query(
    "SELECT rosters.*,locations.location_name,locations.client_id,locations.id,clients.id,clients.name FROM rosters join locations on rosters.location_id = locations.id join clients on locations.client_id = clients.id WHERE rosters.user_id=? And locations.duration_end >=? And rosters.client_id=? order by rosters.id desc",
    [data.user_id, formattedDate, data.client_id],
    function (err, row, fields) {
      if (err) throw err;
      res.json({ row });
    }
  );
});

//Night Shift
app.post("/admin/getAttendancedetailForNight", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  var s = data.user_id;
  var status = "Present";
  var day = "Night";
  db.query(
    "SELECT YEAR(date) as year, MONTH(date) AS month ,id,status,date FROM  attendance where shift=? And status = ? And user_id = ? And client_id = ? ORDER BY MONTH(date) asc",
    [day, status, s, data.client_id],
    function (err, results, fields) {
      if (err) throw err;
      const data = {};

      results.forEach((row) => {
        const month = row.month;
        if (!data[month]) {
          data[month] = [];
        }
        const currentDate = new Date(row.date);
        const day = String(currentDate.getDate()).padStart(2, "0");
        row.nd = day;
        //console.log(row);
        data[month].push(row);
      });
      // console.log(data);
      res.json({ data });
    }
  );
});
//Sick Leave

app.post("/admin/getAttendancedetailsickLeave", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  var s = data.user_id;
  var status = "Sick Leave";
  db.query(
    "SELECT YEAR(date) as year, MONTH(date) AS month ,id,status,date FROM  attendance where status = ? And user_id = ? And client_id = ? ORDER BY MONTH(date) asc",
    [status, s, data.client_id],
    function (err, results, fields) {
      if (err) throw err;
      const data = {};

      results.forEach((row) => {
        const month = row.month;
        if (!data[month]) {
          data[month] = [];
        }
        const currentDate = new Date(row.date);
        const day = String(currentDate.getDate()).padStart(2, "0");
        row.nd = day;
        //console.log(row);
        data[month].push(row);
      });
      // console.log(data);
      res.json({ data });
    }
  );
});

//Day Off
app.post("/admin/getuserdayoff", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  // console.log(data);
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");
  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  var status = "AL";
  var ss = "Sick Leave";
  db.query(
    "SELECT attendance.*,rosters.number_day_end from attendance join rosters on attendance.client_id = attendance.client_id where attendance.client_id =? And attendance.user_id =? And rosters.duration_date >= ?  order by attendance.date desc",
    [data.client_id, data.user_id, formattedDate],
    function (err, row, fields) {
      if (err) throw err;
      //console.log(row);
      if (row != "") {
        var d = row[0].date;
        var currdate = d.toISOString().slice(0, 10);
        var lm = row[0].number_day_end;
        db.query(
          "SELECT YEAR(date) as year, MONTH(date) AS month ,id,status,date FROM  attendance where client_id != ? And user_id = ? And date >? And status != ? And status != ? ORDER BY MONTH(date) asc Limit ?",
          [data.client_id, data.user_id, currdate, status, ss, lm],
          function (err, results, fields) {
            if (err) throw err;
            const data = {};

            results.forEach((row) => {
              const month = row.month;
              if (!data[month]) {
                data[month] = [];
              }
              const currentDate = new Date(row.date);
              const day = String(currentDate.getDate()).padStart(2, "0");
              row.nd = day;
              //console.log(row);
              data[month].push(row);
            });
            // console.log(data);
            res.json({ data });
          }
        );
      }
    }
  );
});
//Day Off

//Employee Current Work
app.post("/admin/getEmployeeDetail", function (req, res) {
  //console.log(req.body);
  var data = req.body;
  console.log(data);
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  var ss = "Present";
  db.query(
    "SELECT attendance.*,locations.location_name from attendance join locations on locations.id = attendance.location_id where attendance.user_id =? And attendance.client_id=? And attendance.status = ? And attendance.date =?",
    [data.user_id, data.client_id, ss, formattedDate],
    function (err, row, fields) {
      if (err) throw err;
      console.log(row);
      var rw = row;
      if (rw != "") {
        // Get the day of the week as an index (0 to 6, where 0 represents Sunday)
        var currd = row[0].created_at;
        const dayIndex = currd.getDay();

        // Array of human-readable day names
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        // Get the day of the week as a human-readable string
        const dayName = daysOfWeek[dayIndex];
        // Create a Date object from the input date string
        const dateObj = new Date(row[0].date);

        // Get the day, month, and year components
        const day = dateObj.getDate().toString().padStart(2, "0");
        const month = (dateObj.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
        const year = dateObj.getFullYear();

        // Form the desired date format
        const formattedDate = `${day}/${month}/${year}`;

        rw.d = dayName;
        rw.nd = formattedDate;
        res.json({ row });
      } else {
        rw.d = "";
        rw.nd = "";
        res.json({ rw });
      }
    }
  );
});
//Employee Current Work

//Employee Form Submit
app.post("/admin/employeAttendanceForm", function (req, res) {
  //console.log(req.body);
  var data = req.body;

  let em = {
    client_id: data.client_id,
    user_id: data.user_id,
    hours: data.hours,
    created_at: new Date(),
  };
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
  const day = String(currentDate.getDate()).padStart(2, "0");

  // Form the desired format: YYYY-MM-DD
  const formattedDate = `${year}-${month}-${day}`;
  db.query(
    "SELECT * FROM employeeWorkform WHERE user_id=? And client_id =? And created_at =?",
    [data.user_id, data.client_id, formattedDate],
    function (err, row, fields) {
      if (err) throw err;
      // console.log(row);
      if (row == "") {
        db.query(
          "INSERT INTO employeeWorkform SET ?",
          em,
          function (error, results, fields) {
            if (error) throw error;
            var idd = results.insertId;
            var status = "1";
            res.json({ status });
          }
        );
      } else {
        var status = "2";
        res.json({ status });
      }
    }
  );
});

//Get All Notifications
app.post("/admin/getallnotifications", function (req, res) {
  console.log(req.body);

  db.query(
    "SELECT notifications.*,users.first_name,users.middle_name,users.last_name FROM notifications join users on users.id = notifications.user_id order by notifications.id desc",
    function (err, results, fields) {
      if (err) throw err;
      // console.log(row);
      const data = [];
      results.forEach((row) => {
        const currentDate = new Date(row.date);
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
        const day = String(currentDate.getDate()).padStart(2, "0");

        // Form the desired format: YYYY-MM-DD
        const formattedDate = `${day}/${month}/${year}`;
        row.nd = formattedDate;

        console.log(row);
        data.push(row);
      });
      res.json({ data });
    }
  );
});

//User Approve
app.post("/admin/userApprove", function (req, res) {
  //console.log(req.body);

  var data = req.body;
  sendEmail(data.email);
  var s = "Active";
  db.query(
    "UPDATE users SET status =? where id=?",
    [s, data.user_id],
    function (err, result) {
      if (err) throw err;
      var status = "1";
      res.json({ status });
    }
  );
});

//Send Confimation Mail
async function sendEmail(too) {
  // Create a transporter object using SMTP
  let transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net", // Your SMTP server host
    port: 587, // Your SMTP server port (587 is the default for SMTP)
    secure: false, // Set to true if you're using a secure connection (e.g., SSL/TLS)
    auth: {
      user: "apikey", // Your email address
      pass: "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", // Your email password
    },
  });

  // Email content
  let mailOptions = {
    from: "bhartikumaritesting@gmail.com", // Sender address (should be the same as the auth.user)
    to: too, // Recipient address. You can also use an array for multiple recipients.
    subject: "Account Approved", // Email subject
    text: "Your account has been successfully approved", // Plain text body
    // You can also use `html` key for sending HTML content.
  };

  try {
    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

//Get Time Sheet

app.post("/admin/getTimesheet", function (req, res) {
  var data = req.body;
  db.query(
    "SELECT attendance.*,locations.location_name,clients.name from attendance join locations on locations.id = attendance.location_id join clients on clients.id = attendance.client_id where attendance.user_id =?",
    [data.user_id],
    function (err, results, fields) {
      if (err) throw err;
      const data = [];
      results.forEach((row) => {
        const currentDate = new Date(row.date);
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // January is 0, so we add 1
        const day = String(currentDate.getDate()).padStart(2, "0");

        // Form the desired format: YYYY-MM-DD
        const formattedDate = `${day}/${month}/${year}`;
        var currd = row.created_at;
        const dayIndex = currd.getDay();

        // Array of human-readable day names
        const daysOfWeek = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        // Get the day of the week as a human-readable string
        const dayName = daysOfWeek[dayIndex];
        row.nd = formattedDate;
        row.dd = dayName;
        data.push(row);
      });
      res.json({ data });
    }
  );
});

app.post("/admin/getclientinfo", function (req, res) {
  var data = req.body;
  db.query(
    "SELECT * from clients where id =?",
    [data.clientId],
    function (err, row, fields) {
      if (err) throw err;
      res.json({ row });
    }
  );
});
