module.exports = function (urlPrsr, app, errorHandler, responder) {
  app.post("/api/calci/post", urlPrsr, (req, res) => {
    try {
      let body = req.body;
      let num1 = body.num1;
      let num2 = body.num2;
      let action = body.action;
      if (!num1 || !num2) {
        errorHandler.errorHandler(400, error, res);
        return;
      }
      if (action === "add") {
        let result = num1 + num2;
        responder.respond(result, res);
        return;
      }
      else if (action === "sub") {
          let result = num1 - num2;
          responder.respond(result, res);
        return;
      }
      else if (action === "multiply") {
        let result = num1 * num2;
        responder.respond(result, res);
        return;
      }
      else if (action === "divide") {
        let result = num1 / num2;
        responder.respond(result, res);
        return;
      }
      else{
        errorHandler.errorHandler(412, "Incomplete action info", res, "MissError");
      }
    } catch(error) {
      errorHandler.errorHandler(500, error, res);
  }
  });
  // app.post("/api/sub/post", urlPrsr, (req, res) => {
  //   let body = req.body;

  //   let num1 = body.num1;
  //   let num2 = body.num2;

  //   let result = num1 - num2;

  //   res.status(200).json({
  //     message: "Subtraction Operation sucessfull",
  //     data: result,
  //     success: "true",
  //     error: "false",
  //   });
  // });
  // app.post("/api/multiply/post", urlPrsr, (req, res) => {
  //   let body = req.body;

  //   let num1 = body.num1;
  //   let num2 = body.num2;

  //   let result = num1 * num2;

  //   res.status(200).json({
  //     message: "Multiplication Operation sucessfull",
  //     data: result,
  //     success: "true",
  //     error: "false",
  //   });
  // });
  // app.post("/api/divide/post", urlPrsr, (req, res) => {
  //   let body = req.body;

  //   let num1 = body.num1;
  //   let num2 = body.num2;

  //   let result = num1 / num2;

  //   res.status(200).json({
  //     message: "Division Operation sucessfull",
  //     data: result,
  //     success: "true",
  //     error: "false",
  //   });
  // });

  // app.get("/api/test/get", urlPrsr, (req, res) => {
  //     console.log("Hit get api");
  //     res.status(200).json({
  //         message: "You hit the get api",
  //     });
  // });
  // app.put("/api/test/put", urlPrsr, (req, res) => {
  //     console.log("Hit put api");
  //     res.status(200).json({
  //         message: "You hit the put api",
  //     });
  // });
  // app.delete("/api/test/delete", urlPrsr, (req, res) => {
  //     console.log("Hit delete api");
  //     res.status(200).json({
  //         message: "You hit the delete api",
  //     });
  // });
};
