const { GoogleGenerativeAI } = require("@google/generative-ai");
const api_key="AIzaSyC39GGsr_O3019CMtapvRa_H7KHr6Fd50Q"

const genAI = new GoogleGenerativeAI(api_key);

module.exports={
    run:(p)=>{
        return new Promise(async(resolve,reject)=>{
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = p;
            const result = await model.generateContent(prompt);
            resolve(result.response.text());
        })
    }
}