let utility = require("../modules/utility");
const util = require("util");
const { JsonWebTokenError } = require("jsonwebtoken");
var jwt = require("jsonwebtoken");
module.exports = function (
  urlPrsr,
  app,
  authCheck,
  errorHandler,
  responder,
  mysqlConnection
) {
  app.post("/api/calc/user/signup", urlPrsr, (req, res) => {
    try {
      let body = req.body;
      let username = req.body.username;
      let responseSent = false;
      let userQuery = "select id from user_details where username = ?";
      let params = [username];

      let mysqlPromise = util.promisify(utility.mysqlHandler);

      mysqlPromise(userQuery, params, mysqlConnection)
        .then((result) => {
          if (result.length > 0) {
            let error = "Username is not available";
            errorHandler.errorHandler(400, error, res, "ER400");
            responseSent = true;
          } else {
            let password = Math.random().toString(36).slice(-5);
            let createUserQuery =
              "Insert into user_details (username, password) values (?, ?) ";
            params = [username, password];
            return mysqlPromise(createUserQuery, params, mysqlConnection);
          }
        })
        .then((result) => {
          if (!responseSent) {
            responder.respond(
              {
                message: "User created",
                data: result.insertId,
              },
              res
            );
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
    }
  });

  app.post("/api/calc/user/signin", urlPrsr, (req, res) => {
    try {
      let body = req.body;
      let username = req.body.username;
      let password = req.body.password;

      if (!username) {
        let error = "Invalid username";
        errorHandler.errorHandler(400, error, res, "ER400");
        return;
      }

      if (!password) {
        let error = "Password required";
        errorHandler.errorHandler(400, error, res, "ER400");
        return;
      }

      let responseSent = false;
      let checkPasswordQuery =
        "select id, username from user_details where username=? and password = ?";
      let params = [username, password];

      let mysqlPromise = util.promisify(utility.mysqlHandler);

      mysqlPromise(checkPasswordQuery, params, mysqlConnection)
        .then((result) => {
          if (result.length > 0) {
            let authToken = jwt.sign(
              {
                data: result[0].id,
              },
              "ezgb?fV+A&zjg=B(WoYVZtQM1E62=)",
              { expiresIn: "5h" }
            );
            responder.respond({ data: authToken }, res);
            responder.respond({ data: authToken }, res);
          } else {
            let error = "Invalid username or passoword";
            errorHandler.errorHandler(403, error, res, "ER400");
            responseSent = true;
          }
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
    }
  });
  app.post("/api/calc/user/history", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;

      let body = req.body;
      let num1 = body.num1;
      let num2 = body.num2;
      let action = body.action;
      let result = 0;
      if (!num1 || !num2) {
        errorHandler.errorHandler(400, error, res);
      }
      if (action === "add") {
        result = num1 + num2;
        responder.respond(result, res);
      } else if (action === "sub") {
        result = num1 - num2;
        responder.respond(result, res);
      } else if (action === "multiply") {
        result = num1 * num2;
        responder.respond(result, res);
      } else if (action === "divide") {
        result = num1 / num2;
        responder.respond(result, res);
      } else {
        errorHandler.errorHandler(
          412,
          "Incomplete action info",
          res,
          "MissError"
        );
      }
      let addCalculation =
        "Insert into history (userId, num1, num2, result, action) values (?, ?, ?, ?, ?)";
      let params = [userId, num1, num2, result, action];
      let mysqlPromise = util.promisify(utility.mysqlHandler);
      mysqlPromise(addCalculation, params, mysqlConnection)
        .then((response) => {
          responder.respond(
            {
              result: result,
            },
            res
          );
        })
        .catch((error) => {
          errorHandler.errorHandler(500, error, res);
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
      console.log(error);
    }
  });
  app.get("/api/calc/user/gethistory", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;
      let queryParams = req.query;
      let action = queryParams.action;

      let getHistory = "select * from history where action = ? and userId = ?";
      let params = [action, userId];
      let mysqlPromise = util.promisify(utility.mysqlHandler);
      mysqlPromise(getHistory, params, mysqlConnection)
        .then((result) => {
          responder.respond(
            {
              result: result,
            },
            res
          );
        })
        .catch((error) => {
          errorHandler.errorHandler(500, error, res);
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
      console.log(error);
    }
  });
  app.post("/api/calc/user/signout", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;
      var accessToken = req.headers["authorization"];

      let revokeTokenQuery = "insert into revoked_tokens (token) values (?)";
      let params = [accessToken];

      let mysqlPromise = util.promisify(utility.mysqlHandler);

      return mysqlPromise(revokeTokenQuery, params, mysqlConnection)
        .then((result) => {
          responder.respond({ message: "Logged out successfully." }, res);
        })
        .catch((error) => {
          errorHandler.errorHandler(500, error, res);
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
      console.log(error);
    }
  });
};
