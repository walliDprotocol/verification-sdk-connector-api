const config = require("$config");
const startMongo = require("./mongo");
const startRedis = require("./redis");
const MySql = require("./mysql");
const MySqlInstance = new MySql();
const logError = require("$core-services/logFunctionFactory").getErrorLogger();
const logDebug = require("$core-services/logFunctionFactory").getDebugLogger();

// console.log('MYSQL ', new MySql() );

//load config of database url from individual strings
if (!config.databaseURL) {
  let url = "mongodb+srv://";
  url += process.env.DB_USER + ":";
  url += process.env.DB_PASS + "@";
  url += process.env.DB_HOST + "/";
  // url += process.env.DB_PORT + '/';
  url += process.env.DB_NAME;
  // url += '?authSource=admin';
  //url += '?replicaSet=' + process.env.REPL_SET;
  url += process.env.COMPLEMENT;
  config.databaseURL = url;
}

logDebug("MONGO URI CONNECTED :  ", config.databaseURL);
let Mongo = {};

if (process.env.DB_USER && process.env.DB_USER.length > 2) {
  Mongo = startMongo(config.databaseURL);
} else {
  console.log("No MONGODB config");
}

const Redis = startRedis(config.redisUrl);
const RedisSubscribe = startRedis(config.redisUrl);

const Database = {
  createConfig: async (data, options) => {
    return await Mongo.config.create(data, options);
  },
  updateConfig: async (criteria, update, options) => {
    return await Mongo.config.findOneAndUpdate(criteria, update, options);
  },
  findConfig: async (filter, select, options) => {
    return await Mongo.config.find(filter, select, options);
  },

  createWorkSpace: async (data, options) => {
    return await Mongo.workspace.create(data, options);
  },
  findWorkspace: async (filter, select, options) => {
    return await Mongo.workspace.find(filter, select, options);
  },

  saveWalletMySQL: async (wallet) => {
    let insertInto = "INSERT INTO user_wallet (wa) VALUES ('" + wallet + "')";
    let res = await MySqlInstance.query(insertInto);
    return res && res.affectedRows > 0 ? true : false;
  },
  storeTodo: async (data, options) => {
    return await Mongo.todo.create(data, options);
  },
  findTodoAndUpdate: async (criteria, update, options) => {
    return await Mongo.todo.findOneAndUpdate(criteria, update, options);
  },
  findTodo: async (filter, select, options) => {
    return await Mongo.todo.find(filter, select, options);
  },
  deleteTodo: async (criteria) => {
    return await Mongo.todo.deleteOne(criteria);
  },

  /** Redis connection */
  cacheData: async (key, mgs) => {
    await Redis.set(key, mgs.toString());
  },
  getCachedData: async (key) => {
    return await Redis.get(key);
  },
  subscribe: (channel, handler) => {
    const listener = function (ch, message) {
      if (ch == channel) {
        handler(ch, message);
        RedisSubscribe.removeListener("message", listener);
      }
    };

    RedisSubscribe.on("message", listener);

    RedisSubscribe.subscribe(channel);
  },
  unsubscribe: async (channel) => {
    await RedisSubscribe.unsubscribe(channel);
  },
  saveToken: async (key, data, ttl) => {
    let sTtl = ttl || config.REDIS_AUTH_TTL;
    const result = await Redis.setex(key, sTtl, data);
    return result;
  },
  getToken: async (key) => {
    const token = await Redis.get(key);
    return token;
  },
};

module.exports = Database;
