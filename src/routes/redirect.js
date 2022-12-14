"use strict";

const express = require("express");
const getAppInfo = require("$core-services/getAppInfo");
const {
  deleteTodo,
  updateTodo,
  getTodo,
  createTodo,
} = require("$services/todo");

const router = new express.Router();
const axios = require("axios");
var querystring = require("querystring");
const { TwitterApi } = require("twitter-api-v2");

// DISCORD
// https://github.com/reboxer/discord-oauth2/issues/16

// https://discord.com/api/oauth2/authorize?response_type=token&client_id=947877511910527066&state=15773059ghq9183habn&scope=identify

// https://discord.com/api/oauth2/authorize?client_id=947877511910527066&redirect_uri=http%3A%2F%2F127.0.0.1%3A9000&response_type=code&scope=identify%20guilds

// https://github.com/feross/login-with-twitter
// https://developer.twitter.com/en/docs/authentication/guides/log-in-with-twitter#Browser

// router.get('/login/twitter', (req, res) => {
//     console.log('token secret 1' );

//     tw.login((err, tokenSecret, url) => {
//       if (err) {
//         // Handle the error your way
//         console.log('Error twitter login ', err )
//       }

//       console.log('Sessions : ',req.session )
//       // Save the OAuth token secret for use in your /twitter/callback route
//       req.session.tokenSecret = tokenSecret

//       console.log('token secret :' , tokenSecret);
//       console.log('token url :' , url);

//       console.log('[/login/twitter] will redirect')

//       // Redirect to the /twitter/callback route, with the OAuth responses as query params
//       res.json({tokenSecret, redirect : url })
//     })
// })

router.get("/login/twitter", (req, res) => {
  try {
    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.TWITTER_CALLBACK,
      { scope: ["tweet.read", "users.read", "follows.read", "offline.access"] }
    );
    console.log("URL  : ", url);
    console.log("codeVerifier :   ", codeVerifier);
    console.log("state  ", state);
    res.json({ codeVerifier, redirect: url, state });
  } catch (ex) {
    console.error("Error generate Oauth2 Link ", ex);
    response.status(500).json({ error: ex });
  }
});

router.post("/twitter", async (request, response) => {
  console.log("twitter app callback : ", request.body);
  try {
    let state = request.body.state;
    let code = request.body.code;
    let codeVerifier = request.body.codeVerifier;

    if (!code) {
      console.error("Should supply twitter code ", code);
      throw "Should supply twitter code";
    }
    if (!codeVerifier) {
      console.error("Should supply twitter codeVerifier ", codeVerifier);
      throw "Should supply twitter codeVerifier";
    }

    const client = new TwitterApi({
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    });

    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      //   expiresIn,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: process.env.TWITTER_CALLBACK,
    });

    // {loggedClient} is an authenticated client in behalf of some user
    // Store {accessToken} somewhere, it will be valid until {expiresIn} is hit.
    // If you want to refresh your token later, store {refreshToken} (it is present if 'offline.access' has been given as scope)

    console.log("accessToken : ", accessToken);
    console.log("refreshToken : ", refreshToken);

    // Example request
    const { data: userObject } = await loggedClient.v2.me();
    console.log("user data : ", userObject);
    response.json({
      accessToken,
      refreshToken,
      username: userObject.username,
      name: userObject.name,
      id: userObject.id,
    });
  } catch (ex) {
    console.error("Error twitter callback ", ex);
    response.status(500).json({ error: ex });
  }
});

router.put("/:id", async (request, response) => {
  try {
    const updated = await updateTodo(req.params.id, request.body);
    response.status(200).json(updated);
  } catch (ex) {
    console.error("get todo ", ex);
    response.status(500).json({ error: ex });
  }
});

router.delete("/:id", async (request, response) => {
  try {
    const del = await deleteTodo(req.params.id);
    response.status(200).json(del);
  } catch (ex) {
    console.error("get todo ", ex);
    response.status(500).json({ error: ex });
  }
});

module.exports = router;
