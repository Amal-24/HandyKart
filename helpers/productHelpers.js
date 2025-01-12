const { log } = require("handlebars");
let db = require("../config/db");
let collections = require("../config/db_collections");
let objectId=require('mongodb').ObjectId


module.exports = {
  addProduct: (product, callback) => {

    db.get()
      .collection(collections.PRODUCT)
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });
  },
  viewProduct:()=>{
    return new Promise(async(resolve,reject)=>{
      let products= await db.get().collection(collections.PRODUCT).find().toArray()
      resolve(products)
    })

  },


   delete_product:(id)=>{
   return new Promise(async(resolve,reject)=>{
    let ob_id= await  new objectId(id)
    db.get().collection(collections.PRODUCT).deleteOne({_id:ob_id})
  .then((resp) => {
    resolve(resp);
  })
   })
  },
   
  getProductDetails:(id)=>{
    return new Promise(async(resolve,reject)=>{
      let ob_id= await new objectId(id)
      let resp= await db.get().collection(collections.PRODUCT).findOne({_id:ob_id})
      resolve(resp)
    })
  },

  updateProduct:(id,productDetails)=>{
    return new Promise(async(resolve,reject)=>{
      let obj_id= await new objectId(id)
      let updatedProduct= await db.get().collection(collections.PRODUCT).updateOne({_id:obj_id},
        {$set:{Name:productDetails.Name,Description:productDetails.Description,Color:productDetails.Color
        ,Price:productDetails.Price,Category:productDetails.Category}})
        resolve(updatedProduct)
    })

  },get_all_orders:()=>{
    return new Promise(async(resolve,reject)=>{
      let all_orders = await db.get().collection(collections.ORDERS).find().toArray()
      resolve(all_orders);
    })
  },get_user_details:async(user_id)=>{
    user_id= await new objectId(user_id)
    return new Promise(async(resolve,reject)=>{
      let user_details= await db.get().collection(collections.USERS).findOne({_id:user_id});
      resolve(user_details);
    })
  },change_order_status:async(order_id,new_status)=>{
    order_id= await new objectId(order_id);
    return new Promise(async(resolve,reject)=>{
     let change_status = await db.get().collection(collections.ORDERS).
     updateOne({_id:order_id},{$set:{status:new_status}})
     resolve(change_status);
    })
  },get_all_customers:()=>{
    return new Promise(async(resolve,reject)=>{
      let customers = await db.get().collection(collections.USERS).find().toArray()
      resolve(customers);
    })
  }
}