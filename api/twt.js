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
  app.post("/api/twt/user/signup", urlPrsr, (req, res) => {
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
  app.post("api/twt/user/signin", urlPrsr, (req, res) => {
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
  app.post("/api/calc/user/tweets", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;

      let body = req.body;
      let text = body.text;
      let attachment  = body.attachment;
  
      if (text.length > 160) {
        errorHandler.errorHandler(400, "Tweet Excedded length", res);
        return;
      }
      let addTweet =
        "Insert into tweets (userId, text, attachment) values (?, ?, ?)";
      let params = [userId, text, attachment];
      let mysqlPromise = util.promisify(utility.mysqlHandler);
      mysqlPromise(addTweet, params, mysqlConnection)
        .then((result) => {
          responder.respond(
            {
              message:"Tweet sent"
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
  app.get("/api/twt/user/getmytweets", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;
      let getHistory = "select id, text,attachment from tweets where userId = ?";
      let params = [userId];
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
  app.get("/api/twt/user/getusers", urlPrsr, (req, res) => {
    try {
      let getUsers = "select id, username from user_details";
      let params = [];
      let mysqlPromise = util.promisify(utility.mysqlHandler);
      mysqlPromise(getUsers, params, mysqlConnection)
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
  app.post("/api/twt/user/followinginfo", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;

      let body = req.body;
      let following_id = body.following_id;
      let userQuery = "select following_id from connection_data where follower_id = ? and following_id = ?";
      let params = [userId,following_id];
      let mysqlPromise = util.promisify(utility.mysqlHandler);

      mysqlPromise(userQuery, params, mysqlConnection)
        .then((result) => {
          if (result.length > 0) {
            let error = "Following already added";
            errorHandler.errorHandler(400, error, res, "ER400");
          } else {
            let addFollowing =
              "Insert into connection_data (follower_id, following_id) values (?, ?)";
              let params = [userId, following_id];
            return mysqlPromise(addFollowing, params, mysqlConnection);
          }
        })
        .then((result) => {
            responder.respond(
              {
                message: "Following added"
              },
              res
            );
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
      console.log(error);
    }
  });
  app.get("/api/twt/user/following", urlPrsr, authCheck,(req, res) => {
    try {
      let userId = req.userId;
      let getFollowers = "select username from user_details natural join connection_data where (id=following_id and follower_id = ?)";
      let params = [userId];
      let mysqlPromise = util.promisify(utility.mysqlHandler);
      mysqlPromise(getFollowers, params, mysqlConnection)
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
  app.get("/api/twt/user/followers", urlPrsr, authCheck,(req, res) => {
    try {
      let userId = req.userId;
      let getFollowers = "select username from user_details natural join connection_data where (id=follower_id and following_id = ?)";
      let params = [userId];
      let mysqlPromise = util.promisify(utility.mysqlHandler);
      mysqlPromise(getFollowers, params, mysqlConnection)
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
  app.post("/api/twt/user/bookmark", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;

      let body = req.body;
      let tweet_id = body.tweet_id;
      let userQuery = "select tweet_id from bookmark where user_id = ? and tweet_id = ?";
      let params = [userId,tweet_id];
      let mysqlPromise = util.promisify(utility.mysqlHandler);

      mysqlPromise(userQuery, params, mysqlConnection)
        .then((result) => {
          if (result.length > 0) {
            let error = "Already bookmarked";
            errorHandler.errorHandler(400, error, res, "ER400");
          } else {
            let addBookmark =
              "Insert into bookmark (user_id, tweet_id) values (?, ?)";
              let params = [userId, tweet_id];
            return mysqlPromise(addBookmark, params, mysqlConnection);
          }
        })
        .then((result) => {
            responder.respond(
              {
                message: "Tweet bookmarked"
              },
              res
            );
        })
        .catch((error) => {
          console.log(error);
        });
    } catch (error) {
      errorHandler.errorHandler(500, error, res);
      console.log(error);
    }
  });
  app.get("/api/twt/user/bmktweets", urlPrsr, authCheck, (req, res) => {
    try {
      let userId = req.userId;
      let getHistory = "select text,attachment from tweets natural join bookmark where (tweets.id=tweet_id and bookmark.user_id = ?)";
      let params = [userId];
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
  app.post("/api/twt/user/signout", urlPrsr, authCheck, (req, res) => {
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
