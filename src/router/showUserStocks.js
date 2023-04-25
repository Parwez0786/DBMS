const express = require("express");
var con = require("../database/db");
const router = express.Router();
const middlewares = require("../utils/verifyUser.js");



const getPrice = async (row) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT price FROM stocks WHERE id="${row.id}"`;
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log(result);
        if (result.length === 0) {
          resolve(0);
        } else {
          const price = result[0].price;
          resolve(price);
        }
      }
    });
  });
};
router.get("/showUserStocks", async (req, res) => {
    try {
        const sql = `SELECT * FROM userStocks`;
        con.query(sql, async (error, result) => {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                //   return;
            }

            if (result.length === 0) {
                res.render('showUserStocks', {
                    resultWithProfit: [],
                });
                return;
            }

            const resultWithProfit = await Promise.all(
                result.map(async (row) => {
                    const price = await getPrice(row);
                    var currValue = parseFloat(price) * parseInt(row.units);
                    currValue = currValue.toFixed(2);
                    var profit = (currValue * 100) / row.amt_invested;
                    profit = (profit - 100).toFixed(2);

                    var flagProfit = false;
                    if (profit >= 0) {
                        flagProfit = true;
                    }

                    console.log(profit)
                    return {
                        ...row,
                        currValue: currValue,
                        profit: profit,
                        flagProfit
                    };
                })
            );

            res.render('showUserStocks', {
                resultWithProfit,
            });
        });
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});



router.get("/showStocks", async (req, res) => {
  try {
    var message = req.query.message;
    var sql = `SELECT * FROM stocks`;
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error);
      }
       console.log(result)
      res.render("showStocks", {
        result,
        message,
      });
      // res.send(result)
    });
  } catch (error) {
    if (error) {
      console.log(error);
    }
  }
});

router.get("/buy", async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);

    const message = req.query.message;
    //search if this id exist in userStocks
    var sql = `SELECT * FROM stocks WHERE id=?`;
    con.query(sql, [id], (error, result) => {
      if (error) {
        console.log(error);
      }
       console.log(result);

      res.render("buy", {
        result,
        message,
      });
    });
  } catch (error) {
    if (error) {
      console.log(error);
    }
  }
});


 router.post('/post', middlewares.verifyUser,   async (req, res) => {
  try {
     console.log(req.user.username+"par");

    var id = req.body.id; //stock id
    var userId = req.body.userId;
    var units = parseInt(req.body.units);
    var password = req.body.password;
    var price = parseFloat(req.body.price);
    var name = req.body.name;
   console.log(id)

    //check if userId exist
    var sql = `select * from stockuser where username='${userId}' and password='${password}'`;
    con.query(sql, (error, result) => {
      if (error) {
        console.log(error, "matching error");
      } else {
        if (result[0]) {
          //
          var cost = units * price;
          console.log(cost);

          if (cost > result[0].amount) {
            // res.send('<h2>Insufficient funds<h2>')
            res.redirect(`/api/showUserStocks/buy?id=${id}&message=Insufficient Funds`);
          } else {
            //update the balance of user in buyer table

            var sql2 = `update stockuser set amount=amount-${cost} where username='${userId}'`;
            con.query(sql2, (error, result) => {
              if (error) {
                console.log(error);
              }
            });
            ////

            //check if stock already present in userStocks
            var sql = `SELECT id FROM userStocks WHERE id=? and username='${req.user.username}'`;
            con.query(sql, [id], (error, result) => {
              if (error) {
                console.log(error);
              }
              // console.log(result);
              if (result[0]) {
                //if exist
                var sql = `UPDATE userStocks set units=units+${units}, amt_invested=amt_invested+${cost} WHERE id="${id}" and username='${req.user.username}'`;
                con.query(sql, (error, result) => {
                  if (error) {
                    console.log(error);
                  }
                  // alert('Succefully done');
                  res.redirect(
                    `/api/showUserStocks/buy?id=${id}&message=Transaction Succesful`
                  );
                });
              } else {
                console.log(req.user.username);

                var sql = `INSERT INTO userStocks VALUES(?,?,?,?,?)`;

                var values = [id, name, units, cost,16.6, req.user.username];
                console.log(values);
                
                con.query(sql, values, (error, result) => {
                  if (error) {
                    console.log(error);
                  }
                  // alert('Succefully done');
                  res.redirect(`/api/showUserStocks/buy?id=${id}&message=Transaction Succesful`);
                });
              }
            });
          }
        } else {
          // res.redirect('buy')
          res.redirect(
            `/api/showUserStocks/buy?id=${id}&message=Invalid Credentials`
          );
        }
      }
    });

    // var cost = units * price;
    // //check if stock already present in userStocks
    // var sql = `SELECT id FROM userStocks WHERE id=?`;
    // con.query(sql, [id], (error, result) => {
    //     if (error) {
    //         console.log(error);
    //     }
    //     // console.log(result);
    //     if (result[0]) { //if exist
    //         var sql = `UPDATE userStocks set units=units+${units}, amt_invested=amt_invested+${cost} WHERE id="${id}"`;
    //         con.query(sql, (error, result) => {
    //             if (error) {
    //                 console.log(error);
    //             }
    //             res.redirect('showStocks');
    //         })
    //     } else {
    //         var sql = `INSERT INTO userStocks VALUES(?,?,?,?)`;
    //         var values = [id, name, units, cost];
    //         con.query(sql, values, (error, result) => {
    //             if (error) {
    //                 console.log(error);
    //             }
    //             res.redirect('showStocks');
    //         })
    //     }
    // })
  } catch (error) {
    if (error) {
      console.log(error);
    }
  }
});


module.exports=router;
