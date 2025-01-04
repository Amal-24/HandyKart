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

  },
}