const { log } = require("handlebars");
let db = require("../config/db");
let collections = require("../config/db_collections");
let objectId=require('mongodb').ObjectId


module.exports = {
  // to export without using variable for object
  addProduct: (product, callback) => {

    db.get()
      .collection(collections.PRODUCT)
      .insertOne(product)
      .then((data) => {
        //then() which is used here is the then() of insertOne() which has a promise in it. and data
        // has the resolve value ie true value of insertion.
        // and its called back as callback is used in fuction header
        //console.log(data);
        // let id=data.insertedId
        // let str=id.toString()
        // console.log(str)
        callback(data.insertedId);//use this insertid for image path
        // data has the values after inserting product in mongodb.eg:id_ops etc
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
    let ob_id= await  new objectId(id)//converting the id to objectid for using with mongodb
    db.get().collection(collections.PRODUCT).deleteOne({_id:ob_id})
  .then((resp) => {
    //console.log('Product deleted:', resp.deletedCount);
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
        {$set:{Name:productDetails.Name,Description:productDetails.Description
        ,Price:productDetails.Price,Category:productDetails.Category}})
        resolve(updatedProduct)
    })

  },
}