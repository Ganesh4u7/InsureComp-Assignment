const express = require('express');
const router = require('express').Router();
const fs = require('fs');
var path = require('path');
var cors = require("cors");

const port = normalizePort(process.env.PORT || '3000');

let tempArray =[];

let total_sales = {
  total_sales:0,
  total_money_generated:0,
  monthly_sales:{}
};

let total_item_sales ={};

let most_popular_item ={};

let popular_item={
  name:'',
  quantity:0,
  total_sales:0,
  total_revenue:0,
  unit_price:0
};

let popular_item_analysis={
  min:{  
    name:'',
    quantity:0,
    total_sales:0,
    total_revenue:0,
    unit_price:0
  },
  max:{  
    name:'',
    quantity:0,
    total_sales:0,
    total_revenue:0,
    unit_price:0
  },
  average:{  
    name:'',
    quantity:0,
    total_sales:0,
    total_revenue:0,
    unit_price:0
  }
};

let app_init = async () => {
       const app = express();
       app.use(cors());

       app.use(express.static(path.join(__dirname,'./dist/insure-comp')));
       app.get('/',function(req,res){
          res.sendFile(path.join(__dirname,"./dist/insure-comp/index.html"));
       });

     

       app.get('/get_data',function(req,res){
        let monthly_sales = Object.values(total_sales.monthly_sales);
        let sales =[];
        let popular =[];
        let revenue=[];
     
        monthly_sales.forEach((month,index)=>{
          sales.push({
            month :index+1,
            items:Object.values(month.items)
          });
          popular.push({
            month : index+1,
            popular_item: month.popular_item
          });
          revenue.push({
            month : index+1,
            revenue_generating_item: month.revenue_generating_item
          });
        });

        res.send({
          total_sales:{total_sales:total_sales.total_sales,total_money_generated:total_sales.total_money_generated,sales:Object.values(total_item_sales)},
          monthly_sales:sales,
          monthy_popular_item:popular,
          revenue_generated_item: revenue,
          popular_item_analysis:popular_item_analysis
        });
     });

     app.all('*', function(req, res) {
      res.redirect("/"); 
    });
       

       fs.readFile(path.join(__dirname, `/assets/Assignment.txt`), 'utf8', function (err, data) {
         var dataArray = data.split(/\r?\n/);

         for(let j=1;j<dataArray.length;j++){
            let line = dataArray[j].split(",");
             let sale = {
              date: line[0],
              SKU: line[1],
              unit_price: parseInt(line[2], 10),
              quantity: parseInt(line[3], 10),
              total_price: parseInt(line[4], 10)
            }
            tempArray.push(sale);
            if(most_popular_item[`${sale.SKU}`] != undefined){
              most_popular_item[`${sale.SKU}`].total_price +=sale.total_price;
              most_popular_item[`${sale.SKU}`].quantity +=sale.quantity;
              most_popular_item[`${sale.SKU}`].total_sales +=1;
          }
          else{
            most_popular_item[`${sale.SKU}`]={
                  name:sale.SKU,
                  total_sales:1,
                  quantity : sale.quantity,
                  unit_price : sale.unit_price,
                  total_price : sale.total_price
              }
          }
            most_popular_item[`${sale.SKU}`].name =sale.SKU;
            most_popular_item[`${sale.SKU}`].unit_price =sale.unit_price;
            most_popular_item[`${sale.SKU}`].total_price +=sale.total_price;
            most_popular_item[`${sale.SKU}`].quantity +=sale.quantity;
            
            monthlySale(sale);
          }
          // console.log(total_sales.monthly_sales)
        monthlyPopularItem();
        overall_popular_item();

     
       });
       
       app.listen(port, () => {
           console.log(`Example app listening on port ${port}!`)
       });

}

function monthlySale(sale){

    total_sales.total_sales +=1;
    total_sales.total_money_generated += sale.total_price;

    if(total_item_sales[`${sale.SKU}`] != undefined){
      total_item_sales[`${sale.SKU}`].quantity +=sale.quantity;  
      total_item_sales[`${sale.SKU}`].total_collected +=sale.total_price;  
      total_item_sales[`${sale.SKU}`].sales +=1;
    }
    else{
      total_item_sales[`${sale.SKU}`]={
            total_collected:sale.total_price,
            quantity:sale.quantity,
            sales:1,
            name:sale.SKU,
            unit_price:sale.unit_price
        }

    }


    let month = sale.date.split("-")[1];
    if(total_sales.monthly_sales[`${month}`] != undefined){
        total_sales.monthly_sales[`${month}`].total_collected += sale.total_price;
        total_sales.monthly_sales[`${month}`].quantity += sale.quantity;
        total_sales.monthly_sales[`${month}`].sales += 1;
    }
    else{
        total_sales.monthly_sales[`${month}`]={
            total_collected:sale.total_price,
            quantity:sale.quantity,
            sales:1,
            items:[]
        }

    }
    if(total_sales.monthly_sales[`${month}`].items[`${sale.SKU}`] != undefined){
        total_sales.monthly_sales[`${month}`].items[`${sale.SKU}`].total_sales += 1;
        total_sales.monthly_sales[`${month}`].items[`${sale.SKU}`].quantity += sale.quantity;
        total_sales.monthly_sales[`${month}`].items[`${sale.SKU}`].unit_price = sale.unit_price;
        total_sales.monthly_sales[`${month}`].items[`${sale.SKU}`].total_price += sale.total_price;
    }
    else{
        
        total_sales.monthly_sales[`${month}`].items[`${sale.SKU}`]={
            name:sale.SKU,
            total_sales:1,
            quantity : sale.quantity,
            unit_price : sale.unit_price,
            total_price : sale.total_price
        }
    }

}

function monthlyPopularItem(){

  let monthly_sales = total_sales.monthly_sales;

    for(let i=0;i<Object.keys(monthly_sales).length;i++){

      let popular_item = {name:'',quantity:0,total_sales:0,unit_price:0,total_price:0};
      let revenue_generating_item = {name:'',quantity:0,total_sales:0,unit_price:0,total_price:0};

      let items_length = Object.keys(monthly_sales[`${Object.keys(monthly_sales)[i]}`].items).length;
      
      for(j=0;j<items_length;j++){
        let item_data = Object.values(monthly_sales[`${Object.keys(monthly_sales)[i]}`].items)[j];
        if(popular_item.quantity < item_data.quantity){
          popular_item.name = item_data.name;
          popular_item.quantity = item_data.quantity;
          popular_item.total_sales =item_data.total_sales;
          popular_item.unit_price =item_data.unit_price;
          popular_item.total_price = item_data.total_price;
        }

        if(revenue_generating_item.total_price < item_data.total_price){
          revenue_generating_item.name = item_data.name;
          revenue_generating_item.quantity = item_data.quantity;
          revenue_generating_item.total_sales =item_data.total_sales;
          revenue_generating_item.unit_price =item_data.unit_price;
          revenue_generating_item.total_price = item_data.total_price;
        }
      }
     total_sales.monthly_sales[Object.keys(monthly_sales)[i]].popular_item = popular_item;
     total_sales.monthly_sales[Object.keys(monthly_sales)[i]].revenue_generating_item = revenue_generating_item;
    }

}

function overall_popular_item(){

  let arr_length = Object.keys(most_popular_item).length;
  let arr_body = Object.values(most_popular_item);

  for(let i=0;i<arr_length;i++){
    if(popular_item.total_sales<arr_body[i].total_sales){
      popular_item.name=arr_body[i].name;
      popular_item.quantity=arr_body[i].quantity;
      popular_item.total_sales=arr_body[i].total_sales;
      popular_item.total_revenue=arr_body[i].total_price;
      popular_item.unit_price=arr_body[i].unit_price;
    }
  }

  let month_keys_length = Object.keys(total_sales.monthly_sales).length;
    
    for(let i=0;i<month_keys_length;i++){
      let month_data1 = Object.values(total_sales.monthly_sales)[i].items;
      let month_data = Object.values(month_data1);
      let found ={};
      month_data.find(element => {
        
        if(element.name == popular_item.name){
        found =element;
        }
      });
      
        if(popular_item_analysis.min.total_sales == 0 || popular_item_analysis.min.total_sales > found.total_sales){
          popular_item_analysis.min.month = parseInt(Object.keys(total_sales.monthly_sales)[i]);
          popular_item_analysis.min.name = found.name; 
          popular_item_analysis.min.total_sales =found.total_sales;
          popular_item_analysis.min.quantity = found.quantity;
          popular_item_analysis.min.unit_price = found.unit_price;
          popular_item_analysis.min.total_revenue = found.total_price;
        }

        if(popular_item_analysis.max.total_sales == 0 || popular_item_analysis.max.total_sales < found.total_sales){
          popular_item_analysis.max.month = parseInt(Object.keys(total_sales.monthly_sales)[i]);
          popular_item_analysis.max.name = found.name; 
          popular_item_analysis.max.total_sales =found.total_sales;
          popular_item_analysis.max.quantity = found.quantity;
          popular_item_analysis.max.unit_price = found.unit_price;
          popular_item_analysis.max.total_revenue = found.total_price;
        }

        if( popular_item_analysis.average.total_sales == 0 || 
            (popular_item_analysis.max.total_sales < found.total_sales 
              && 
              popular_item_analysis.min.total_sales > found.total_sales  )){
          popular_item_analysis.average.month = parseInt(Object.keys(total_sales.monthly_sales)[i]);
          popular_item_analysis.average.name = found.name;    
          popular_item_analysis.average.total_sales =found.total_sales;
          popular_item_analysis.average.quantity = found.quantity;
          popular_item_analysis.average.unit_price = found.unit_price;
          popular_item_analysis.average.total_revenue = found.total_price;
        }
    }
}

function normalizePort(val) {
   var port = parseInt(val, 10);
 
   if (isNaN(port)) {
     return val;
   }
   if (port >= 0) {
     return port;
   }

}   

app_init();