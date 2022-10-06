const urlModel = require("../model/urlModel");

const shortid = require("shortid");
const axios =require('axios')

const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  15432,
  "redis-15432.c212.ap-south-1-1.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("Jsq2dv5p4Vn1tUKz8DlwXWEK6sgWd5XE", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const createUrl = async function (req, res) {
  try {
    const longUrl = req.body.longUrl;

    const baseUrl = "http://localhost:3000/";

    if (!longUrl)
      return res.status(400).send({ status: false, message: "please provide LongUrl." });

    
      let cacheUrl = await GET_ASYNC(`${longUrl}`)// we are getting in string format
      let checkUrl = JSON.parse(cacheUrl)
      if (checkUrl) return res.status(400).send({ status: false, message: `LongUrl already used - ${checkUrl.shortUrl}` })

      let regex =/(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
    if (!regex.test(longUrl))  //This is Package Method for URL Validation
      return res
        .status(400)
        .send({ status: false, message: "please provide valid LongUrl." });
    
    let obj = {
      method: "get",
      url: longUrl
  }

  let urlFound = false;
  await axios(obj)
      .then((res) => {
          if (res.status == 201 || res.status == 200) urlFound = true;
      })
      .catch((err) => { });
  if (!urlFound) {
      return res.status(400).send({ status: false, message: "Please provide valid LongUrl" })
  }


    const checkUrlInDb = await urlModel.findOne({ longUrl: longUrl }) 
    if(checkUrlInDb)await SET_ASYNC(`${longUrl}`, JSON.stringify(checkUrlInDb), 'PX', 60000)
    if (checkUrlInDb) return res.status(400).send({ status: false, message: `LongUrl already used - ${checkUrlInDb.shortUrl}` })

    const urlCode = shortid.generate(longUrl);  //This is Package Method to generate ShortLink
    const shortUrl = baseUrl + urlCode;

    const url = { longUrl: longUrl, urlCode: urlCode, shortUrl: shortUrl };

    const createUrlData = await urlModel.create(url)
    await SET_ASYNC(`${longUrl}`, JSON.stringify(createUrlData), 'PX', 60000)

    return res.status(201).send({ status: true, data: createUrlData });
  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
};

//get url

const getUrl = async function (req, res) {
  try {
    const urlCode = req.params.urlCode
    if (!urlCode) return res.status(400).send({ status: false, message: 'Please provide UrlCode' })

    if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: 'Please provide valid UrlCode' })

    let cacheUrl = await GET_ASYNC(`${urlCode}`)// we are getting in string format
    let objCache = JSON.parse(cacheUrl)// converting into object format  


    if (objCache) {
      return res.status(302).redirect(objCache.longUrl)
    }

    const checkUrlCode = await urlModel.findOne({ urlCode: urlCode })

    if (!checkUrlCode) return res.status(404).send({ status: false, message: 'UrlCode not found' })
    await SET_ASYNC(`${urlCode}`, JSON.stringify(checkUrlCode), 'PX', 20000)
    return res.status(302).redirect(checkUrlCode.longUrl)

  }
  catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }

}

module.exports = { createUrl, getUrl };
