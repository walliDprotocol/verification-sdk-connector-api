"use strict";

const express = require("express");
const axios = require("axios");
const router = new express.Router();
const crypto = require("crypto");
const { TwitterApi } = require("twitter-api-v2");

console.log("reddit clientID: ", process.env.REDDIT_CLIEND_ID);
console.log("reddit secret: ", process.env.REDDIT_CLIENT_SECRET);

const clientId = process.env.REDDIT_CLIEND_ID;
const clientSecret = process.env.REDDIT_CLIENT_SECRET;
//const redirectUri = "https://sdk-iframe.herokuapp.com";

/**
 * Samples
 * https://fusebit.io/blog/reddit-oauth/?utm_source=www.google.com&utm_medium=referral&utm_campaign=none
 *
 */
router.post("/login", async (request, response) => {
  try {
    //console.log("Get auth code discord ", request.query);
    if (!(request.body && request.body.clientId)) {
      throw "You should supply clientId!";
    }
    if (!(request.body && request.body.clientSecret)) {
      throw "You should supply clientSecret!";
    }

    response.json({ data: { token: crypto.randomBytes(32).toString("hex") } });
  } catch (ex) {
    console.error("/reddit/requestURL/", ex);
    response.status(500).json({ error: ex });
  }
});

module.exports = router;
