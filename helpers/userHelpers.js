const { promise } = require("bcrypt/promises");
let db = require("../config/db");
let collections = require("../config/db_collections");
let bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
//const { default: ObjectID } = require("bson-objectid");
let objectId = require("mongodb").ObjectId;
const Razorpay=require("razorpay");
const crypto=require('crypto')

//razorpay key
var instance = new Razorpay(
  { key_id: 'rzp_test_pxesEGDrhbZPaE',
   key_secret: 'AJNlFoCKb2pIORvIwl5ERT4J' })

module.exports = {
  doSignUp: (UserData) => {
    return new Promise(async (resolve, reject) => {
      //password in encrypted before saving into database
      UserData.Password = await bcrypt.hash(UserData.Password, 10);
      db.get()
        .collection(collections.USERS)
        .insertOne(UserData)
        .then((data) => {
          resolve(data);
        });
    });
  },
  doLogIn: (userData) => {
    //console.log(userData)
    return new Promise(async (resolve, recject) => {
      let loginStatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collections.USERS)
        .findOne({ Email: userData.Email });
      if (!user) {
        response.loginStatus = false;
      } else {
        let passwordEcry = await bcrypt.compare(
          userData.Password,
          user.Password
        );
        // in compare() first argument should be data and second should be hash. check docs(ctr on compare())
        if (!passwordEcry) {
          response.loginStatus = false;
        } else {
          response.loginStatus = true;
          response.user = user;
        }
      }
      resolve(response);
    });
  },
  add_to_cart: (product_id, user_id) => {
    return new Promise(async (resolve, reject) => {
      let product_object_id = await new objectId(product_id);
      let user_object_id = await new objectId(user_id);
      let product_object = {
        item: product_object_id,
        quantity: 1,
      };

      let cart = await db
        .get()
        .collection(collections.CART)
        .findOne({ user: user_object_id });
      if (cart) {
        //use == in product.item==product_id as === will compare the datatype also
        let product_exist = await cart.products.findIndex(
          (product) => product.item == product_id
        );
        //console.log(product_exist);
        if (product_exist != -1) {
          let quantity_update = await db
            .get()
            .collection(collections.CART)
            .updateOne(
              { user: user_object_id, "products.item": product_object_id },
              { $inc: { "products.$.quantity": 1 } }
            );
          //console.log(quantity_update);
          resolve(quantity_update);
        } else {
          let push_new_product = await db
            .get() 
            .collection(collections.CART)
            .updateOne(
              { user: user_object_id },
              {
                $push: { products: product_object },
              }
            );
          //console.log(push_new_product);
          resolve(push_new_product);
        }
      } else {
        let cart_obj = {
          user: user_object_id,
          products: [product_object],
        };
        let create_cart = await db
          .get()
          .collection(collections.CART)
          .insertOne(cart_obj);
       // console.log(create_cart);
        resolve(create_cart);
      }
    });
  },
  get_cart_products: (user_id) => {
    return new Promise(async (resolve) => {
      let user_id_object = await new ObjectId(user_id);
      let cart_items = await db
        .get()
        .collection(collections.CART)
        .aggregate([
          {
            $match: { user: user_id_object },
          },
          {
            $unwind: "$products",
          },
          {
            //project is similar to select product.item as item in SQL
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(cart_items);
    });
  },

  cart_count: (user_id) => {
    return new Promise(async (resolve, reject) => {
      let user_object_id = await new objectId(user_id);
      let cart = await db
        .get()
        .collection(collections.CART)
        .findOne({ user: user_object_id });
      if (cart) {
        let count = await cart.products.length; //built in function to find length of array
        resolve(count);
      } else { 
        resolve(0);
      }
    });
  },
  change_product_quantity: async (details) => {
    //console.log(details);
    details.quantity = parseInt(details.quantity);
    details.count = parseInt(details.count);
    let cart_object_id = await new objectId(details.cart);
    let product_object_id = await new objectId(details.product);

    return new Promise(async (resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        let remove_product = await db
          .get()
          .collection(collections.CART)
          .updateOne(
            { _id: cart_object_id },
            { $pull: { products: { item: product_object_id } } }
          );
        //resolve({ remove_product: true });
        //response will be false if product is removed
        resolve({status:false,product_removed:true})
      } else {
        let quantity_update = await db
          .get()
          .collection(collections.CART)
          .updateOne(
            { _id: cart_object_id, "products.item": product_object_id },
            { $inc: { "products.$.quantity": details.count } }
          );
        // resolve(quantity_update)
        resolve({ status: true });
        // this resolve is in obj as we need to append total in response of then in routes
      }
    });
  },
  total_amount: (user_id) => {
    return new Promise(async (resolve, reject) => {
      let user_id_object = await new ObjectId(user_id);
    
      let total = await db
        .get()
        .collection(collections.CART)
        .aggregate([
          {
            $match: { user: user_id_object },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
        resolve(total[0])//object { _id: null, total: 50000 } is returned in total[0]
    });
  },
  get_product_list:(user_id)=>{
   return new Promise(async(resolve,reject)=>{
    let user_object_id= await new objectId(user_id) 
    let product_list= await db.get().collection(collections.CART).findOne({user:user_object_id})
    resolve(product_list.products)
   })
  },
  place_order:(order_details,product_details,total_amount)=>{
    return new Promise(async(resolve,reject)=>{
      let user_object_id= await new objectId(order_details.user_id)
      let status= order_details.payment_method==='COD'?'Placed':'Pending'
      order_object={
        user:user_object_id,
        products:product_details,
        total_amount:total_amount,
        payment_method:order_details.payment_method,
        status:status,
        date:new Date(),
        delivery_details:{
          address:order_details.address,
          pin_code:order_details.pincode,
          mobile_number:order_details.mobilenumber 
        }
      }
      let insert_order_data=await db.get().collection(collections.ORDERS).insertOne(order_object)
      let clear_cart= await db.get().collection(collections.CART).deleteOne({user:user_object_id})
      resolve(insert_order_data.insertedId)
    })
  },
  orders_of_user:(user_id)=>{
    return new Promise(async(resolve,reject)=>{
      let user_object_id= await new objectId(user_id) 
      let orders=db.get().collection(collections.ORDERS).find({user:user_object_id}).toArray()
      console.log('userhelper 274',orders);
      resolve(orders)
    })
  },
  ordered_products_list:(order_id)=>{
    return new Promise(async(resolve,reject)=>{
      let order_id_object = await new objectId(order_id)
      let products = await db
        .get()
        .collection(collections.ORDERS)
        .aggregate([
          {
            $match: {_id:order_id_object},
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collections.PRODUCT,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
        ])
        .toArray();
      resolve(products);
      
    })
  },
  generate_razorpay:(order_id,total_amount)=>{
    return new Promise(async(resolve,reject)=>{
    var options = {
      amount: total_amount*100,//*100 as amount will be saved in paise by razorpay 
      currency: "INR",
      receipt: ""+order_id// remeber this trick of ""+order_id
    };
    instance.orders.create(options, function(err, order) {
      if(err){
        //console.log('userhelpers:334',err);
      }else{
      //console.log("userhelper:335 ",order);
      resolve(order)
      }
      })
    })
  },
  payment_verification:(details)=>{
    //this function is to verify function by comparing hmc with order signature
    return new Promise((resolve,reject)=>{
      let hmac=crypto.createHmac('sha256','AJNlFoCKb2pIORvIwl5ERT4J')// second one is razorpay secret key
      hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
      hmac.digest('hex')// to convert to hex string
      if(hmac==details['payment[razorpay_signature]']){
        resolve({status:true})
      }else{
        //reject({status:false})
        resolve({status:false})

      }
    })

  },
  change_payment_status:(order_id)=>{
    return new Promise(async(resolve,reject)=>{
      let order_id_object= await new objectId(order_id)
      let status= await db.get().collection(collections.ORDERS).updateOne(
        {_id:order_id_object},
        {$set:{status:'Placed'}}
        )
        resolve(true)
    })

  },

};