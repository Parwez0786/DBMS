const express = require("express");
var con = require("../database/db");
const router = express.Router();
const middlewares = require("../utils/verifyUser.js");


router.get("/sellStocks", async (req, res) => {
    var id=req.query.id;

res.render('sellStocks', {id});

  

});



const getPrice = async (id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM stocks WHERE id="${id}"`;
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
router.post("/sellStock", async (req, res) => {
   var unit=req.body.units;
   var stockId=req.body.stockid;
   var username=req.body.username;
   var password=req.body.password;

    const sql = `select * from  userStocks where username='${username}' and id='${stockId}'`;

    con.query(sql, async (error, result) => {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                //   return;
            }

            else{
                if(result[0].units>=unit){
                       const sql1 = `select * from  stockuser where username='${username}' and password='${password}'`;
                        con.query(sql1, async (error, result) => {
                            if(error){
                                res.send("invalid credentials")
                            }

                            else{
                                var currentPrice=await getPrice(stockId);
                                var currentValue=unit*currentPrice;

                                 const sql2 = `update userStocks set units=units-${unit} where username="${username}" and id="${stockId}"`;
                                 con.query(sql2, async (error, result) => {

                                    if(error){
                                      console.log("eroor");

                                    }
                                    else{
                                            const sql3 = `update stockuser set amount=amount+${currentValue} where username="${username}"`; 
                                            con.query(sql3, async (error, result) => {
                                                if(error){
                                                 console.log(error);

                                                }
                                                else{
                                                      res.send("sold successfully ")
                                                }
                                            });

                                    }
                                 });


                            }
                        });

                }
                else{
                    res.send("insufficient units");

                }


            }
        });



});

module.exports = router;
