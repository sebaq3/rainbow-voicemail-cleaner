var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/dotenv/package.json
var require_package = __commonJS({
  "node_modules/dotenv/package.json"(exports2, module2) {
    module2.exports = {
      name: "dotenv",
      version: "17.0.0",
      description: "Loads environment variables from .env file",
      main: "lib/main.js",
      types: "lib/main.d.ts",
      exports: {
        ".": {
          types: "./lib/main.d.ts",
          require: "./lib/main.js",
          default: "./lib/main.js"
        },
        "./config": "./config.js",
        "./config.js": "./config.js",
        "./lib/env-options": "./lib/env-options.js",
        "./lib/env-options.js": "./lib/env-options.js",
        "./lib/cli-options": "./lib/cli-options.js",
        "./lib/cli-options.js": "./lib/cli-options.js",
        "./package.json": "./package.json"
      },
      scripts: {
        "dts-check": "tsc --project tests/types/tsconfig.json",
        lint: "standard",
        pretest: "npm run lint && npm run dts-check",
        test: "tap run --allow-empty-coverage --disable-coverage --timeout=60000",
        "test:coverage": "tap run --show-full-coverage --timeout=60000 --coverage-report=text --coverage-report=lcov",
        prerelease: "npm test",
        release: "standard-version"
      },
      repository: {
        type: "git",
        url: "git://github.com/motdotla/dotenv.git"
      },
      homepage: "https://github.com/motdotla/dotenv#readme",
      funding: "https://dotenvx.com",
      keywords: [
        "dotenv",
        "env",
        ".env",
        "environment",
        "variables",
        "config",
        "settings"
      ],
      readmeFilename: "README.md",
      license: "BSD-2-Clause",
      devDependencies: {
        "@types/node": "^18.11.3",
        decache: "^4.6.2",
        sinon: "^14.0.1",
        standard: "^17.0.0",
        "standard-version": "^9.5.0",
        tap: "^19.2.0",
        typescript: "^4.8.4"
      },
      engines: {
        node: ">=12"
      },
      browser: {
        fs: false
      }
    };
  }
});

// node_modules/dotenv/lib/main.js
var require_main = __commonJS({
  "node_modules/dotenv/lib/main.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var crypto = require("crypto");
    var packageJson = require_package();
    var version = packageJson.version;
    var LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
    function parse(src) {
      const obj = {};
      let lines = src.toString();
      lines = lines.replace(/\r\n?/mg, "\n");
      let match;
      while ((match = LINE.exec(lines)) != null) {
        const key = match[1];
        let value = match[2] || "";
        value = value.trim();
        const maybeQuote = value[0];
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        if (maybeQuote === '"') {
          value = value.replace(/\\n/g, "\n");
          value = value.replace(/\\r/g, "\r");
        }
        obj[key] = value;
      }
      return obj;
    }
    function _parseVault(options) {
      options = options || {};
      const vaultPath = _vaultPath(options);
      options.path = vaultPath;
      const result = DotenvModule.configDotenv(options);
      if (!result.parsed) {
        const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
        err.code = "MISSING_DATA";
        throw err;
      }
      const keys = _dotenvKey(options).split(",");
      const length = keys.length;
      let decrypted;
      for (let i = 0; i < length; i++) {
        try {
          const key = keys[i].trim();
          const attrs = _instructions(result, key);
          decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
          break;
        } catch (error) {
          if (i + 1 >= length) {
            throw error;
          }
        }
      }
      return DotenvModule.parse(decrypted);
    }
    function _warn(message) {
      console.error(`[dotenv@${version}][WARN] ${message}`);
    }
    function _debug(message) {
      console.log(`[dotenv@${version}][DEBUG] ${message}`);
    }
    function _log(message) {
      console.log(`[dotenv@${version}] ${message}`);
    }
    function _dotenvKey(options) {
      if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
      }
      if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
      }
      return "";
    }
    function _instructions(result, dotenvKey) {
      let uri;
      try {
        uri = new URL(dotenvKey);
      } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
          const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        }
        throw error;
      }
      const key = uri.password;
      if (!key) {
        const err = new Error("INVALID_DOTENV_KEY: Missing key part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environment = uri.searchParams.get("environment");
      if (!environment) {
        const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
        err.code = "INVALID_DOTENV_KEY";
        throw err;
      }
      const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
      const ciphertext = result.parsed[environmentKey];
      if (!ciphertext) {
        const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
        err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
        throw err;
      }
      return { ciphertext, key };
    }
    function _vaultPath(options) {
      let possibleVaultPath = null;
      if (options && options.path && options.path.length > 0) {
        if (Array.isArray(options.path)) {
          for (const filepath of options.path) {
            if (fs.existsSync(filepath)) {
              possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
            }
          }
        } else {
          possibleVaultPath = options.path.endsWith(".vault") ? options.path : `${options.path}.vault`;
        }
      } else {
        possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
      }
      if (fs.existsSync(possibleVaultPath)) {
        return possibleVaultPath;
      }
      return null;
    }
    function _resolveHome(envPath) {
      return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
    }
    function _configVault(options) {
      const debug = Boolean(options && options.debug);
      const quiet = Boolean(options && options.quiet);
      if (debug || !quiet) {
        _log("Loading env from encrypted .env.vault");
      }
      const parsed = DotenvModule._parseVault(options);
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsed, options);
      return { parsed };
    }
    function configDotenv(options) {
      const dotenvPath = path.resolve(process.cwd(), ".env");
      let encoding = "utf8";
      const debug = Boolean(options && options.debug);
      const quiet = Boolean(options && options.quiet);
      if (options && options.encoding) {
        encoding = options.encoding;
      } else {
        if (debug) {
          _debug("No encoding is specified. UTF-8 is used by default");
        }
      }
      let optionPaths = [dotenvPath];
      if (options && options.path) {
        if (!Array.isArray(options.path)) {
          optionPaths = [_resolveHome(options.path)];
        } else {
          optionPaths = [];
          for (const filepath of options.path) {
            optionPaths.push(_resolveHome(filepath));
          }
        }
      }
      let lastError;
      const parsedAll = {};
      for (const path2 of optionPaths) {
        try {
          const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
          DotenvModule.populate(parsedAll, parsed, options);
        } catch (e) {
          if (debug) {
            _debug(`Failed to load ${path2} ${e.message}`);
          }
          lastError = e;
        }
      }
      let processEnv = process.env;
      if (options && options.processEnv != null) {
        processEnv = options.processEnv;
      }
      DotenvModule.populate(processEnv, parsedAll, options);
      if (debug || !quiet) {
        const keysCount = Object.keys(parsedAll).length;
        const shortPaths = [];
        for (const filePath of optionPaths) {
          try {
            const relative = path.relative(process.cwd(), filePath);
            shortPaths.push(relative);
          } catch (e) {
            if (debug) {
              _debug(`Failed to load ${filePath} ${e.message}`);
            }
            lastError = e;
          }
        }
        _log(`injecting env (${keysCount}) from ${shortPaths.join(",")} \u2013 \u{1F510} encrypt with dotenvx: https://dotenvx.com`);
      }
      if (lastError) {
        return { parsed: parsedAll, error: lastError };
      } else {
        return { parsed: parsedAll };
      }
    }
    function config(options) {
      if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
      }
      const vaultPath = _vaultPath(options);
      if (!vaultPath) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
      }
      return DotenvModule._configVault(options);
    }
    function decrypt(encrypted, keyStr) {
      const key = Buffer.from(keyStr.slice(-64), "hex");
      let ciphertext = Buffer.from(encrypted, "base64");
      const nonce = ciphertext.subarray(0, 12);
      const authTag = ciphertext.subarray(-16);
      ciphertext = ciphertext.subarray(12, -16);
      try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
      } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
          const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
          err.code = "INVALID_DOTENV_KEY";
          throw err;
        } else if (decryptionFailed) {
          const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
          err.code = "DECRYPTION_FAILED";
          throw err;
        } else {
          throw error;
        }
      }
    }
    function populate(processEnv, parsed, options = {}) {
      const debug = Boolean(options && options.debug);
      const override = Boolean(options && options.override);
      if (typeof parsed !== "object") {
        const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
        err.code = "OBJECT_REQUIRED";
        throw err;
      }
      for (const key of Object.keys(parsed)) {
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
          if (override === true) {
            processEnv[key] = parsed[key];
          }
          if (debug) {
            if (override === true) {
              _debug(`"${key}" is already defined and WAS overwritten`);
            } else {
              _debug(`"${key}" is already defined and was NOT overwritten`);
            }
          }
        } else {
          processEnv[key] = parsed[key];
        }
      }
    }
    var DotenvModule = {
      configDotenv,
      _configVault,
      _parseVault,
      config,
      decrypt,
      parse,
      populate
    };
    module2.exports.configDotenv = DotenvModule.configDotenv;
    module2.exports._configVault = DotenvModule._configVault;
    module2.exports._parseVault = DotenvModule._parseVault;
    module2.exports.config = DotenvModule.config;
    module2.exports.decrypt = DotenvModule.decrypt;
    module2.exports.parse = DotenvModule.parse;
    module2.exports.populate = DotenvModule.populate;
    module2.exports = DotenvModule;
  }
});

// node_modules/node-cron/dist/cjs/create-id.js
var require_create_id = __commonJS({
  "node_modules/node-cron/dist/cjs/create-id.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.createID = createID;
    var node_crypto_1 = __importDefault(require("node:crypto"));
    function createID(prefix = "", length = 16) {
      const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const values = node_crypto_1.default.randomBytes(length);
      const id = Array.from(values, (v) => charset[v % charset.length]).join("");
      return prefix ? `${prefix}-${id}` : id;
    }
  }
});

// node_modules/node-cron/dist/cjs/logger.js
var require_logger = __commonJS({
  "node_modules/node-cron/dist/cjs/logger.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var levelColors = {
      INFO: "\x1B[36m",
      WARN: "\x1B[33m",
      ERROR: "\x1B[31m",
      DEBUG: "\x1B[35m"
    };
    var GREEN = "\x1B[32m";
    var RESET = "\x1B[0m";
    function log2(level, message, extra) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const color = levelColors[level] ?? "";
      const prefix = `[${timestamp}] [PID: ${process.pid}] ${GREEN}[NODE-CRON]${GREEN} ${color}[${level}]${RESET}`;
      const output = `${prefix} ${message}`;
      switch (level) {
        case "ERROR":
          console.error(output, extra ?? "");
          break;
        case "DEBUG":
          console.debug(output, extra ?? "");
          break;
        case "WARN":
          console.warn(output);
          break;
        case "INFO":
        default:
          console.info(output);
          break;
      }
    }
    var logger = {
      info(message) {
        log2("INFO", message);
      },
      warn(message) {
        log2("WARN", message);
      },
      error(message, err) {
        if (message instanceof Error) {
          log2("ERROR", message.message, message);
        } else {
          log2("ERROR", message, err);
        }
      },
      debug(message, err) {
        if (message instanceof Error) {
          log2("DEBUG", message.message, message);
        } else {
          log2("DEBUG", message, err);
        }
      }
    };
    exports2.default = logger;
  }
});

// node_modules/node-cron/dist/cjs/promise/tracked-promise.js
var require_tracked_promise = __commonJS({
  "node_modules/node-cron/dist/cjs/promise/tracked-promise.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TrackedPromise = void 0;
    var TrackedPromise = class {
      promise;
      error;
      state;
      value;
      constructor(executor) {
        this.state = "pending";
        this.promise = new Promise((resolve, reject) => {
          executor((value) => {
            this.state = "fulfilled";
            this.value = value;
            resolve(value);
          }, (error) => {
            this.state = "rejected";
            this.error = error;
            reject(error);
          });
        });
      }
      getPromise() {
        return this.promise;
      }
      getState() {
        return this.state;
      }
      isPending() {
        return this.state === "pending";
      }
      isFulfilled() {
        return this.state === "fulfilled";
      }
      isRejected() {
        return this.state === "rejected";
      }
      getValue() {
        return this.value;
      }
      getError() {
        return this.error;
      }
      then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
      }
      catch(onrejected) {
        return this.promise.catch(onrejected);
      }
      finally(onfinally) {
        return this.promise.finally(onfinally);
      }
    };
    exports2.TrackedPromise = TrackedPromise;
  }
});

// node_modules/node-cron/dist/cjs/scheduler/runner.js
var require_runner = __commonJS({
  "node_modules/node-cron/dist/cjs/scheduler/runner.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Runner = void 0;
    var create_id_1 = require_create_id();
    var logger_1 = __importDefault(require_logger());
    var tracked_promise_1 = require_tracked_promise();
    function emptyOnFn() {
    }
    function emptyHookFn() {
      return true;
    }
    function defaultOnError(date, error) {
      logger_1.default.error("Task failed with error!", error);
    }
    var Runner = class {
      timeMatcher;
      onMatch;
      noOverlap;
      maxExecutions;
      maxRandomDelay;
      runCount;
      running;
      heartBeatTimeout;
      onMissedExecution;
      onOverlap;
      onError;
      beforeRun;
      onFinished;
      onMaxExecutions;
      constructor(timeMatcher, onMatch, options) {
        this.timeMatcher = timeMatcher;
        this.onMatch = onMatch;
        this.noOverlap = options == void 0 || options.noOverlap === void 0 ? false : options.noOverlap;
        this.maxExecutions = options?.maxExecutions;
        this.maxRandomDelay = options?.maxRandomDelay || 0;
        this.onMissedExecution = options?.onMissedExecution || emptyOnFn;
        this.onOverlap = options?.onOverlap || emptyOnFn;
        this.onError = options?.onError || defaultOnError;
        this.onFinished = options?.onFinished || emptyHookFn;
        this.beforeRun = options?.beforeRun || emptyHookFn;
        this.onMaxExecutions = options?.onMaxExecutions || emptyOnFn;
        this.runCount = 0;
        this.running = false;
      }
      start() {
        this.running = true;
        let lastExecution;
        let expectedNextExecution;
        const scheduleNextHeartBeat = (currentDate) => {
          if (this.running) {
            clearTimeout(this.heartBeatTimeout);
            this.heartBeatTimeout = setTimeout(heartBeat, getDelay(this.timeMatcher, currentDate));
          }
        };
        const runTask = (date) => {
          return new Promise(async (resolve) => {
            const execution = {
              id: (0, create_id_1.createID)("exec"),
              reason: "scheduled"
            };
            const shouldExecute = await this.beforeRun(date, execution);
            const randomDelay = Math.floor(Math.random() * this.maxRandomDelay);
            if (shouldExecute) {
              setTimeout(async () => {
                try {
                  this.runCount++;
                  execution.startedAt = /* @__PURE__ */ new Date();
                  const result = await this.onMatch(date, execution);
                  execution.finishedAt = /* @__PURE__ */ new Date();
                  execution.result = result;
                  this.onFinished(date, execution);
                  if (this.maxExecutions && this.runCount >= this.maxExecutions) {
                    this.onMaxExecutions(date);
                    this.stop();
                  }
                } catch (error) {
                  execution.finishedAt = /* @__PURE__ */ new Date();
                  execution.error = error;
                  this.onError(date, error, execution);
                }
                resolve(true);
              }, randomDelay);
            }
          });
        };
        const checkAndRun = (date) => {
          return new tracked_promise_1.TrackedPromise(async (resolve, reject) => {
            try {
              if (this.timeMatcher.match(date)) {
                await runTask(date);
              }
              resolve(true);
            } catch (err) {
              reject(err);
            }
          });
        };
        const heartBeat = async () => {
          const currentDate = nowWithoutMs();
          if (expectedNextExecution && expectedNextExecution.getTime() < currentDate.getTime()) {
            while (expectedNextExecution.getTime() < currentDate.getTime()) {
              logger_1.default.warn(`missed execution at ${expectedNextExecution}! Possible blocking IO or high CPU user at the same process used by node-cron.`);
              expectedNextExecution = this.timeMatcher.getNextMatch(expectedNextExecution);
              runAsync(this.onMissedExecution, expectedNextExecution, defaultOnError);
            }
          }
          if (lastExecution && lastExecution.getState() === "pending") {
            runAsync(this.onOverlap, currentDate, defaultOnError);
            if (this.noOverlap) {
              logger_1.default.warn("task still running, new execution blocked by overlap prevention!");
              expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
              scheduleNextHeartBeat(currentDate);
              return;
            }
          }
          lastExecution = checkAndRun(currentDate);
          expectedNextExecution = this.timeMatcher.getNextMatch(currentDate);
          scheduleNextHeartBeat(currentDate);
        };
        this.heartBeatTimeout = setTimeout(() => {
          heartBeat();
        }, getDelay(this.timeMatcher, nowWithoutMs()));
      }
      nextRun() {
        return this.timeMatcher.getNextMatch(/* @__PURE__ */ new Date());
      }
      stop() {
        this.running = false;
        if (this.heartBeatTimeout) {
          clearTimeout(this.heartBeatTimeout);
          this.heartBeatTimeout = void 0;
        }
      }
      isStarted() {
        return !!this.heartBeatTimeout && this.running;
      }
      isStopped() {
        return !this.isStarted();
      }
      async execute() {
        const date = /* @__PURE__ */ new Date();
        const execution = {
          id: (0, create_id_1.createID)("exec"),
          reason: "invoked"
        };
        try {
          const shouldExecute = await this.beforeRun(date, execution);
          if (shouldExecute) {
            this.runCount++;
            execution.startedAt = /* @__PURE__ */ new Date();
            const result = await this.onMatch(date, execution);
            execution.finishedAt = /* @__PURE__ */ new Date();
            execution.result = result;
            this.onFinished(date, execution);
          }
        } catch (error) {
          execution.finishedAt = /* @__PURE__ */ new Date();
          execution.error = error;
          this.onError(date, error, execution);
        }
      }
    };
    exports2.Runner = Runner;
    async function runAsync(fn, date, onError) {
      try {
        await fn(date);
      } catch (error) {
        onError(date, error);
      }
    }
    function getDelay(timeMatcher, currentDate) {
      const maxDelay = 864e5;
      const nextRun = timeMatcher.getNextMatch(currentDate);
      const now = /* @__PURE__ */ new Date();
      const delay = nextRun.getTime() - now.getTime();
      if (delay > maxDelay) {
        return maxDelay;
      }
      return Math.max(0, delay);
    }
    function nowWithoutMs() {
      const date = /* @__PURE__ */ new Date();
      date.setMilliseconds(0);
      return date;
    }
  }
});

// node_modules/node-cron/dist/cjs/pattern/convertion/month-names-conversion.js
var require_month_names_conversion = __commonJS({
  "node_modules/node-cron/dist/cjs/pattern/convertion/month-names-conversion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = /* @__PURE__ */ (() => {
      const months = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december"
      ];
      const shortMonths = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec"
      ];
      function convertMonthName(expression, items) {
        for (let i = 0; i < items.length; i++) {
          expression = expression.replace(new RegExp(items[i], "gi"), i + 1);
        }
        return expression;
      }
      function interprete(monthExpression) {
        monthExpression = convertMonthName(monthExpression, months);
        monthExpression = convertMonthName(monthExpression, shortMonths);
        return monthExpression;
      }
      return interprete;
    })();
  }
});

// node_modules/node-cron/dist/cjs/pattern/convertion/week-day-names-conversion.js
var require_week_day_names_conversion = __commonJS({
  "node_modules/node-cron/dist/cjs/pattern/convertion/week-day-names-conversion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = /* @__PURE__ */ (() => {
      const weekDays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday"
      ];
      const shortWeekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
      function convertWeekDayName(expression, items) {
        for (let i = 0; i < items.length; i++) {
          expression = expression.replace(new RegExp(items[i], "gi"), i);
        }
        return expression;
      }
      function convertWeekDays(expression) {
        expression = expression.replace("7", "0");
        expression = convertWeekDayName(expression, weekDays);
        return convertWeekDayName(expression, shortWeekDays);
      }
      return convertWeekDays;
    })();
  }
});

// node_modules/node-cron/dist/cjs/pattern/convertion/asterisk-to-range-conversion.js
var require_asterisk_to_range_conversion = __commonJS({
  "node_modules/node-cron/dist/cjs/pattern/convertion/asterisk-to-range-conversion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = /* @__PURE__ */ (() => {
      function convertAsterisk(expression, replecement) {
        if (expression.indexOf("*") !== -1) {
          return expression.replace("*", replecement);
        }
        return expression;
      }
      function convertAsterisksToRanges(expressions) {
        expressions[0] = convertAsterisk(expressions[0], "0-59");
        expressions[1] = convertAsterisk(expressions[1], "0-59");
        expressions[2] = convertAsterisk(expressions[2], "0-23");
        expressions[3] = convertAsterisk(expressions[3], "1-31");
        expressions[4] = convertAsterisk(expressions[4], "1-12");
        expressions[5] = convertAsterisk(expressions[5], "0-6");
        return expressions;
      }
      return convertAsterisksToRanges;
    })();
  }
});

// node_modules/node-cron/dist/cjs/pattern/convertion/range-conversion.js
var require_range_conversion = __commonJS({
  "node_modules/node-cron/dist/cjs/pattern/convertion/range-conversion.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.default = /* @__PURE__ */ (() => {
      function replaceWithRange(expression, text, init, end, stepTxt) {
        const step = parseInt(stepTxt);
        const numbers = [];
        let last = parseInt(end);
        let first = parseInt(init);
        if (first > last) {
          last = parseInt(init);
          first = parseInt(end);
        }
        for (let i = first; i <= last; i += step) {
          numbers.push(i);
        }
        return expression.replace(new RegExp(text, "i"), numbers.join());
      }
      function convertRange(expression) {
        const rangeRegEx = /(\d+)-(\d+)(\/(\d+)|)/;
        let match = rangeRegEx.exec(expression);
        while (match !== null && match.length > 0) {
          expression = replaceWithRange(expression, match[0], match[1], match[2], match[4] || "1");
          match = rangeRegEx.exec(expression);
        }
        return expression;
      }
      function convertAllRanges(expressions) {
        for (let i = 0; i < expressions.length; i++) {
          expressions[i] = convertRange(expressions[i]);
        }
        return expressions;
      }
      return convertAllRanges;
    })();
  }
});

// node_modules/node-cron/dist/cjs/pattern/convertion/index.js
var require_convertion = __commonJS({
  "node_modules/node-cron/dist/cjs/pattern/convertion/index.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var month_names_conversion_1 = __importDefault(require_month_names_conversion());
    var week_day_names_conversion_1 = __importDefault(require_week_day_names_conversion());
    var asterisk_to_range_conversion_1 = __importDefault(require_asterisk_to_range_conversion());
    var range_conversion_1 = __importDefault(require_range_conversion());
    exports2.default = /* @__PURE__ */ (() => {
      function appendSeccondExpression(expressions) {
        if (expressions.length === 5) {
          return ["0"].concat(expressions);
        }
        return expressions;
      }
      function removeSpaces(str) {
        return str.replace(/\s{2,}/g, " ").trim();
      }
      function normalizeIntegers(expressions) {
        for (let i = 0; i < expressions.length; i++) {
          const numbers = expressions[i].split(",");
          for (let j = 0; j < numbers.length; j++) {
            numbers[j] = parseInt(numbers[j]);
          }
          expressions[i] = numbers;
        }
        return expressions;
      }
      function interprete(expression) {
        let expressions = removeSpaces(`${expression}`).split(" ");
        expressions = appendSeccondExpression(expressions);
        expressions[4] = (0, month_names_conversion_1.default)(expressions[4]);
        expressions[5] = (0, week_day_names_conversion_1.default)(expressions[5]);
        expressions = (0, asterisk_to_range_conversion_1.default)(expressions);
        expressions = (0, range_conversion_1.default)(expressions);
        expressions = normalizeIntegers(expressions);
        return expressions;
      }
      return interprete;
    })();
  }
});

// node_modules/node-cron/dist/cjs/time/localized-time.js
var require_localized_time = __commonJS({
  "node_modules/node-cron/dist/cjs/time/localized-time.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.LocalizedTime = void 0;
    var LocalizedTime = class {
      timestamp;
      parts;
      timezone;
      constructor(date, timezone) {
        this.timestamp = date.getTime();
        this.timezone = timezone;
        this.parts = buildDateParts(date, timezone);
      }
      toDate() {
        return new Date(this.timestamp);
      }
      toISO() {
        const gmt = this.parts.gmt.replace(/^GMT/, "");
        const offset = gmt ? gmt : "Z";
        const pad = (n) => String(n).padStart(2, "0");
        return `${this.parts.year}-${pad(this.parts.month)}-${pad(this.parts.day)}T${pad(this.parts.hour)}:${pad(this.parts.minute)}:${pad(this.parts.second)}.${String(this.parts.milisecond).padStart(3, "0")}` + offset;
      }
      getParts() {
        return this.parts;
      }
      set(field, value) {
        this.parts[field] = value;
        const newDate = new Date(this.toISO());
        this.timestamp = newDate.getTime();
        this.parts = buildDateParts(newDate, this.timezone);
      }
    };
    exports2.LocalizedTime = LocalizedTime;
    function buildDateParts(date, timezone) {
      const dftOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        weekday: "short",
        hour12: false
      };
      if (timezone) {
        dftOptions.timeZone = timezone;
      }
      const dateFormat = new Intl.DateTimeFormat("en-US", dftOptions);
      const parts = dateFormat.formatToParts(date).filter((part) => {
        return part.type !== "literal";
      }).reduce((acc, part) => {
        acc[part.type] = part.value;
        return acc;
      }, {});
      return {
        day: parseInt(parts.day),
        month: parseInt(parts.month),
        year: parseInt(parts.year),
        hour: parts.hour === "24" ? 0 : parseInt(parts.hour),
        minute: parseInt(parts.minute),
        second: parseInt(parts.second),
        milisecond: date.getMilliseconds(),
        weekday: parts.weekday,
        gmt: getTimezoneGMT(date, timezone)
      };
    }
    function getTimezoneGMT(date, timezone) {
      const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
      const tzDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
      let offsetInMinutes = (utcDate.getTime() - tzDate.getTime()) / 6e4;
      const sign = offsetInMinutes <= 0 ? "+" : "-";
      offsetInMinutes = Math.abs(offsetInMinutes);
      if (offsetInMinutes === 0)
        return "Z";
      const hours = Math.floor(offsetInMinutes / 60).toString().padStart(2, "0");
      const minutes = Math.floor(offsetInMinutes % 60).toString().padStart(2, "0");
      return `GMT${sign}${hours}:${minutes}`;
    }
  }
});

// node_modules/node-cron/dist/cjs/time/matcher-walker.js
var require_matcher_walker = __commonJS({
  "node_modules/node-cron/dist/cjs/time/matcher-walker.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MatcherWalker = void 0;
    var convertion_1 = __importDefault(require_convertion());
    var localized_time_1 = require_localized_time();
    var time_matcher_1 = require_time_matcher();
    var week_day_names_conversion_1 = __importDefault(require_week_day_names_conversion());
    var MatcherWalker = class {
      cronExpression;
      baseDate;
      pattern;
      expressions;
      timeMatcher;
      timezone;
      constructor(cronExpression, baseDate, timezone) {
        this.cronExpression = cronExpression;
        this.baseDate = baseDate;
        this.timeMatcher = new time_matcher_1.TimeMatcher(cronExpression, timezone);
        this.timezone = timezone;
        this.expressions = (0, convertion_1.default)(cronExpression);
      }
      isMatching() {
        return this.timeMatcher.match(this.baseDate);
      }
      matchNext() {
        const findNextDateIgnoringWeekday = () => {
          const baseDate = new Date(this.baseDate.getTime());
          baseDate.setMilliseconds(0);
          const localTime = new localized_time_1.LocalizedTime(baseDate, this.timezone);
          const dateParts = localTime.getParts();
          const date2 = new localized_time_1.LocalizedTime(localTime.toDate(), this.timezone);
          const seconds = this.expressions[0];
          const nextSecond = availableValue(seconds, dateParts.second);
          if (nextSecond) {
            date2.set("second", nextSecond);
            if (this.timeMatcher.match(date2.toDate())) {
              return date2;
            }
          }
          date2.set("second", seconds[0]);
          const minutes = this.expressions[1];
          const nextMinute = availableValue(minutes, dateParts.minute);
          if (nextMinute) {
            date2.set("minute", nextMinute);
            if (this.timeMatcher.match(date2.toDate())) {
              return date2;
            }
          }
          date2.set("minute", minutes[0]);
          const hours = this.expressions[2];
          const nextHour = availableValue(hours, dateParts.hour);
          if (nextHour) {
            date2.set("hour", nextHour);
            if (this.timeMatcher.match(date2.toDate())) {
              return date2;
            }
          }
          date2.set("hour", hours[0]);
          const days = this.expressions[3];
          const nextDay = availableValue(days, dateParts.day);
          if (nextDay) {
            date2.set("day", nextDay);
            if (this.timeMatcher.match(date2.toDate())) {
              return date2;
            }
          }
          date2.set("day", days[0]);
          const months = this.expressions[4];
          const nextMonth = availableValue(months, dateParts.month);
          if (nextMonth) {
            date2.set("month", nextMonth);
            if (this.timeMatcher.match(date2.toDate())) {
              return date2;
            }
          }
          date2.set("year", date2.getParts().year + 1);
          date2.set("month", months[0]);
          return date2;
        };
        const date = findNextDateIgnoringWeekday();
        const weekdays = this.expressions[5];
        let currentWeekday = parseInt((0, week_day_names_conversion_1.default)(date.getParts().weekday));
        while (!(weekdays.indexOf(currentWeekday) > -1)) {
          date.set("year", date.getParts().year + 1);
          currentWeekday = parseInt((0, week_day_names_conversion_1.default)(date.getParts().weekday));
        }
        return date;
      }
    };
    exports2.MatcherWalker = MatcherWalker;
    function availableValue(values, currentValue) {
      const availableValues = values.sort((a, b) => a - b).filter((s) => s > currentValue);
      if (availableValues.length > 0)
        return availableValues[0];
      return false;
    }
  }
});

// node_modules/node-cron/dist/cjs/time/time-matcher.js
var require_time_matcher = __commonJS({
  "node_modules/node-cron/dist/cjs/time/time-matcher.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TimeMatcher = void 0;
    var index_1 = __importDefault(require_convertion());
    var week_day_names_conversion_1 = __importDefault(require_week_day_names_conversion());
    var localized_time_1 = require_localized_time();
    var matcher_walker_1 = require_matcher_walker();
    function matchValue(allowedValues, value) {
      return allowedValues.indexOf(value) !== -1;
    }
    var TimeMatcher = class {
      timezone;
      pattern;
      expressions;
      constructor(pattern, timezone) {
        this.timezone = timezone;
        this.pattern = pattern;
        this.expressions = (0, index_1.default)(pattern);
      }
      match(date) {
        const localizedTime = new localized_time_1.LocalizedTime(date, this.timezone);
        const parts = localizedTime.getParts();
        const runOnSecond = matchValue(this.expressions[0], parts.second);
        const runOnMinute = matchValue(this.expressions[1], parts.minute);
        const runOnHour = matchValue(this.expressions[2], parts.hour);
        const runOnDay = matchValue(this.expressions[3], parts.day);
        const runOnMonth = matchValue(this.expressions[4], parts.month);
        const runOnWeekDay = matchValue(this.expressions[5], parseInt((0, week_day_names_conversion_1.default)(parts.weekday)));
        return runOnSecond && runOnMinute && runOnHour && runOnDay && runOnMonth && runOnWeekDay;
      }
      getNextMatch(date) {
        const walker = new matcher_walker_1.MatcherWalker(this.pattern, date, this.timezone);
        const next = walker.matchNext();
        return next.toDate();
      }
    };
    exports2.TimeMatcher = TimeMatcher;
  }
});

// node_modules/node-cron/dist/cjs/tasks/state-machine.js
var require_state_machine = __commonJS({
  "node_modules/node-cron/dist/cjs/tasks/state-machine.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.StateMachine = void 0;
    var allowedTransitions = {
      "stopped": ["stopped", "idle", "destroyed"],
      "idle": ["idle", "running", "stopped", "destroyed"],
      "running": ["running", "idle", "stopped", "destroyed"],
      "destroyed": ["destroyed"]
    };
    var StateMachine = class {
      state;
      constructor(initial = "stopped") {
        this.state = initial;
      }
      changeState(state) {
        if (allowedTransitions[this.state].includes(state)) {
          this.state = state;
        } else {
          throw new Error(`invalid transition from ${this.state} to ${state}`);
        }
      }
    };
    exports2.StateMachine = StateMachine;
  }
});

// node_modules/node-cron/dist/cjs/tasks/inline-scheduled-task.js
var require_inline_scheduled_task = __commonJS({
  "node_modules/node-cron/dist/cjs/tasks/inline-scheduled-task.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.InlineScheduledTask = void 0;
    var events_1 = __importDefault(require("events"));
    var runner_1 = require_runner();
    var time_matcher_1 = require_time_matcher();
    var create_id_1 = require_create_id();
    var state_machine_1 = require_state_machine();
    var logger_1 = __importDefault(require_logger());
    var localized_time_1 = require_localized_time();
    var TaskEmitter = class extends events_1.default {
    };
    var InlineScheduledTask = class {
      emitter;
      cronExpression;
      timeMatcher;
      runner;
      id;
      name;
      stateMachine;
      timezone;
      constructor(cronExpression, taskFn, options) {
        this.emitter = new TaskEmitter();
        this.cronExpression = cronExpression;
        this.id = (0, create_id_1.createID)("task", 12);
        this.name = options?.name || this.id;
        this.timezone = options?.timezone;
        this.timeMatcher = new time_matcher_1.TimeMatcher(cronExpression, options?.timezone);
        this.stateMachine = new state_machine_1.StateMachine();
        const runnerOptions = {
          timezone: options?.timezone,
          noOverlap: options?.noOverlap,
          maxExecutions: options?.maxExecutions,
          maxRandomDelay: options?.maxRandomDelay,
          beforeRun: (date, execution) => {
            if (execution.reason === "scheduled") {
              this.changeState("running");
            }
            this.emitter.emit("execution:started", this.createContext(date, execution));
            return true;
          },
          onFinished: (date, execution) => {
            if (execution.reason === "scheduled") {
              this.changeState("idle");
            }
            this.emitter.emit("execution:finished", this.createContext(date, execution));
            return true;
          },
          onError: (date, error, execution) => {
            logger_1.default.error(error);
            this.emitter.emit("execution:failed", this.createContext(date, execution));
            this.changeState("idle");
          },
          onOverlap: (date) => {
            this.emitter.emit("execution:overlap", this.createContext(date));
          },
          onMissedExecution: (date) => {
            this.emitter.emit("execution:missed", this.createContext(date));
          },
          onMaxExecutions: (date) => {
            this.emitter.emit("execution:maxReached", this.createContext(date));
            this.destroy();
          }
        };
        this.runner = new runner_1.Runner(this.timeMatcher, (date, execution) => {
          return taskFn(this.createContext(date, execution));
        }, runnerOptions);
      }
      getNextRun() {
        if (this.stateMachine.state !== "stopped") {
          return this.runner.nextRun();
        }
        return null;
      }
      changeState(state) {
        if (this.runner.isStarted()) {
          this.stateMachine.changeState(state);
        }
      }
      start() {
        if (this.runner.isStopped()) {
          this.runner.start();
          this.stateMachine.changeState("idle");
          this.emitter.emit("task:started", this.createContext(/* @__PURE__ */ new Date()));
        }
      }
      stop() {
        if (this.runner.isStarted()) {
          this.runner.stop();
          this.stateMachine.changeState("stopped");
          this.emitter.emit("task:stopped", this.createContext(/* @__PURE__ */ new Date()));
        }
      }
      getStatus() {
        return this.stateMachine.state;
      }
      destroy() {
        if (this.stateMachine.state === "destroyed")
          return;
        this.stop();
        this.stateMachine.changeState("destroyed");
        this.emitter.emit("task:destroyed", this.createContext(/* @__PURE__ */ new Date()));
      }
      execute() {
        return new Promise((resolve, reject) => {
          const onFail = (context) => {
            this.off("execution:finished", onFail);
            reject(context.execution?.error);
          };
          const onFinished = (context) => {
            this.off("execution:failed", onFail);
            resolve(context.execution?.result);
          };
          this.once("execution:finished", onFinished);
          this.once("execution:failed", onFail);
          this.runner.execute();
        });
      }
      on(event, fun) {
        this.emitter.on(event, fun);
      }
      off(event, fun) {
        this.emitter.off(event, fun);
      }
      once(event, fun) {
        this.emitter.once(event, fun);
      }
      createContext(executionDate, execution) {
        const localTime = new localized_time_1.LocalizedTime(executionDate, this.timezone);
        const ctx = {
          date: localTime.toDate(),
          dateLocalIso: localTime.toISO(),
          triggeredAt: /* @__PURE__ */ new Date(),
          task: this,
          execution
        };
        return ctx;
      }
    };
    exports2.InlineScheduledTask = InlineScheduledTask;
  }
});

// node_modules/node-cron/dist/cjs/task-registry.js
var require_task_registry = __commonJS({
  "node_modules/node-cron/dist/cjs/task-registry.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.TaskRegistry = void 0;
    var tasks = /* @__PURE__ */ new Map();
    var TaskRegistry = class {
      add(task) {
        if (this.has(task.id)) {
          throw Error(`task ${task.id} already registred!`);
        }
        tasks.set(task.id, task);
        task.on("task:destroyed", () => {
          this.remove(task);
        });
      }
      get(taskId) {
        return tasks.get(taskId);
      }
      remove(task) {
        if (this.has(task.id)) {
          task?.destroy();
          tasks.delete(task.id);
        }
      }
      all() {
        return Array.from(tasks.values());
      }
      has(taskId) {
        return tasks.has(taskId);
      }
      killAll() {
        this.all().forEach((id) => this.remove(id));
      }
    };
    exports2.TaskRegistry = TaskRegistry;
  }
});

// node_modules/node-cron/dist/cjs/pattern/validation/pattern-validation.js
var require_pattern_validation = __commonJS({
  "node_modules/node-cron/dist/cjs/pattern/validation/pattern-validation.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var index_1 = __importDefault(require_convertion());
    var validationRegex = /^(?:\d+|\*|\*\/\d+)$/;
    function isValidExpression(expression, min, max) {
      const options = expression;
      for (const option of options) {
        const optionAsInt = parseInt(option, 10);
        if (!Number.isNaN(optionAsInt) && (optionAsInt < min || optionAsInt > max) || !validationRegex.test(option))
          return false;
      }
      return true;
    }
    function isInvalidSecond(expression) {
      return !isValidExpression(expression, 0, 59);
    }
    function isInvalidMinute(expression) {
      return !isValidExpression(expression, 0, 59);
    }
    function isInvalidHour(expression) {
      return !isValidExpression(expression, 0, 23);
    }
    function isInvalidDayOfMonth(expression) {
      return !isValidExpression(expression, 1, 31);
    }
    function isInvalidMonth(expression) {
      return !isValidExpression(expression, 1, 12);
    }
    function isInvalidWeekDay(expression) {
      return !isValidExpression(expression, 0, 7);
    }
    function validateFields(patterns, executablePatterns) {
      if (isInvalidSecond(executablePatterns[0]))
        throw new Error(`${patterns[0]} is a invalid expression for second`);
      if (isInvalidMinute(executablePatterns[1]))
        throw new Error(`${patterns[1]} is a invalid expression for minute`);
      if (isInvalidHour(executablePatterns[2]))
        throw new Error(`${patterns[2]} is a invalid expression for hour`);
      if (isInvalidDayOfMonth(executablePatterns[3]))
        throw new Error(`${patterns[3]} is a invalid expression for day of month`);
      if (isInvalidMonth(executablePatterns[4]))
        throw new Error(`${patterns[4]} is a invalid expression for month`);
      if (isInvalidWeekDay(executablePatterns[5]))
        throw new Error(`${patterns[5]} is a invalid expression for week day`);
    }
    function validate(pattern) {
      if (typeof pattern !== "string")
        throw new TypeError("pattern must be a string!");
      const patterns = pattern.split(" ");
      const executablePatterns = (0, index_1.default)(pattern);
      if (patterns.length === 5)
        patterns.unshift("0");
      validateFields(patterns, executablePatterns);
    }
    exports2.default = validate;
  }
});

// node_modules/node-cron/dist/cjs/tasks/background-scheduled-task/background-scheduled-task.js
var require_background_scheduled_task = __commonJS({
  "node_modules/node-cron/dist/cjs/tasks/background-scheduled-task/background-scheduled-task.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    var path_1 = require("path");
    var child_process_1 = require("child_process");
    var create_id_1 = require_create_id();
    var stream_1 = require("stream");
    var state_machine_1 = require_state_machine();
    var localized_time_1 = require_localized_time();
    var logger_1 = __importDefault(require_logger());
    var time_matcher_1 = require_time_matcher();
    var daemonPath = (0, path_1.resolve)(__dirname, "daemon.js");
    var TaskEmitter = class extends stream_1.EventEmitter {
    };
    var BackgroundScheduledTask = class {
      emitter;
      id;
      name;
      cronExpression;
      taskPath;
      options;
      forkProcess;
      stateMachine;
      constructor(cronExpression, taskPath, options) {
        this.cronExpression = cronExpression;
        this.taskPath = taskPath;
        this.options = options;
        this.id = (0, create_id_1.createID)("task");
        this.name = options?.name || this.id;
        this.emitter = new TaskEmitter();
        this.stateMachine = new state_machine_1.StateMachine("stopped");
        this.on("task:stopped", () => {
          this.forkProcess?.kill();
          this.forkProcess = void 0;
          this.stateMachine.changeState("stopped");
        });
        this.on("task:destroyed", () => {
          this.forkProcess?.kill();
          this.forkProcess = void 0;
          this.stateMachine.changeState("destroyed");
        });
      }
      getNextRun() {
        if (this.stateMachine.state !== "stopped") {
          const timeMatcher = new time_matcher_1.TimeMatcher(this.cronExpression, this.options?.timezone);
          return timeMatcher.getNextMatch(/* @__PURE__ */ new Date());
        }
        return null;
      }
      start() {
        return new Promise((resolve, reject) => {
          if (this.forkProcess) {
            return resolve(void 0);
          }
          const timeout = setTimeout(() => {
            reject(new Error("Start operation timed out"));
          }, 5e3);
          try {
            this.forkProcess = (0, child_process_1.fork)(daemonPath);
            this.forkProcess.on("error", (err) => {
              clearTimeout(timeout);
              reject(new Error(`Error on daemon: ${err.message}`));
            });
            this.forkProcess.on("exit", (code, signal) => {
              if (code !== 0 && signal !== "SIGTERM") {
                const erro = new Error(`node-cron daemon exited with code ${code || signal}`);
                logger_1.default.error(erro);
                clearTimeout(timeout);
                reject(erro);
              }
            });
            this.forkProcess.on("message", (message) => {
              if (message.jsonError) {
                if (message.context?.execution) {
                  message.context.execution.error = deserializeError(message.jsonError);
                  delete message.jsonError;
                }
              }
              if (message.context?.task?.state) {
                this.stateMachine.changeState(message.context?.task?.state);
              }
              if (message.context) {
                const execution = message.context?.execution;
                delete execution?.hasError;
                const context = this.createContext(new Date(message.context.date), execution);
                this.emitter.emit(message.event, context);
              }
            });
            this.once("task:started", () => {
              this.stateMachine.changeState("idle");
              clearTimeout(timeout);
              resolve(void 0);
            });
            this.forkProcess.send({
              command: "task:start",
              path: (0, path_1.resolve)(this.taskPath),
              cron: this.cronExpression,
              options: this.options
            });
          } catch (error) {
            reject(error);
          }
        });
      }
      stop() {
        return new Promise((resolve, reject) => {
          if (!this.forkProcess) {
            return resolve(void 0);
          }
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            reject(new Error("Stop operation timed out"));
          }, 5e3);
          const cleanupAndResolve = () => {
            clearTimeout(timeoutId);
            this.off("task:stopped", onStopped);
            this.forkProcess = void 0;
            resolve(void 0);
          };
          const onStopped = () => {
            cleanupAndResolve();
          };
          this.once("task:stopped", onStopped);
          this.forkProcess.send({
            command: "task:stop"
          });
        });
      }
      getStatus() {
        return this.stateMachine.state;
      }
      destroy() {
        return new Promise((resolve, reject) => {
          if (!this.forkProcess) {
            return resolve(void 0);
          }
          const timeoutId = setTimeout(() => {
            clearTimeout(timeoutId);
            reject(new Error("Destroy operation timed out"));
          }, 5e3);
          const onDestroy = () => {
            clearTimeout(timeoutId);
            this.off("task:destroyed", onDestroy);
            resolve(void 0);
          };
          this.once("task:destroyed", onDestroy);
          this.forkProcess.send({
            command: "task:destroy"
          });
        });
      }
      execute() {
        return new Promise((resolve, reject) => {
          if (!this.forkProcess) {
            return reject(new Error("Cannot execute background task because it hasn't been started yet. Please initialize the task using the start() method before attempting to execute it."));
          }
          const timeoutId = setTimeout(() => {
            cleanupListeners();
            reject(new Error("Execution timeout exceeded"));
          }, 5e3);
          const cleanupListeners = () => {
            clearTimeout(timeoutId);
            this.off("execution:finished", onFinished);
            this.off("execution:failed", onFail);
          };
          const onFinished = (context) => {
            cleanupListeners();
            resolve(context.execution?.result);
          };
          const onFail = (context) => {
            cleanupListeners();
            reject(context.execution?.error || new Error("Execution failed without specific error"));
          };
          this.once("execution:finished", onFinished);
          this.once("execution:failed", onFail);
          this.forkProcess.send({
            command: "task:execute"
          });
        });
      }
      on(event, fun) {
        this.emitter.on(event, fun);
      }
      off(event, fun) {
        this.emitter.off(event, fun);
      }
      once(event, fun) {
        this.emitter.once(event, fun);
      }
      createContext(executionDate, execution) {
        const localTime = new localized_time_1.LocalizedTime(executionDate, this.options?.timezone);
        const ctx = {
          date: localTime.toDate(),
          dateLocalIso: localTime.toISO(),
          triggeredAt: /* @__PURE__ */ new Date(),
          task: this,
          execution
        };
        return ctx;
      }
    };
    function deserializeError(str) {
      const data = JSON.parse(str);
      const Err = globalThis[data.name] || Error;
      const err = new Err(data.message);
      if (data.stack) {
        err.stack = data.stack;
      }
      Object.keys(data).forEach((key) => {
        if (!["name", "message", "stack"].includes(key)) {
          err[key] = data[key];
        }
      });
      return err;
    }
    exports2.default = BackgroundScheduledTask;
  }
});

// node_modules/node-cron/dist/cjs/node-cron.js
var require_node_cron = __commonJS({
  "node_modules/node-cron/dist/cjs/node-cron.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.nodeCron = void 0;
    exports2.schedule = schedule;
    exports2.createTask = createTask;
    exports2.validate = validate;
    var inline_scheduled_task_1 = require_inline_scheduled_task();
    var task_registry_1 = require_task_registry();
    var pattern_validation_1 = __importDefault(require_pattern_validation());
    var background_scheduled_task_1 = __importDefault(require_background_scheduled_task());
    var path_1 = __importDefault(require("path"));
    var registry = new task_registry_1.TaskRegistry();
    function schedule(expression, func, options) {
      const task = createTask(expression, func, options);
      task.start();
      return task;
    }
    function createTask(expression, func, options) {
      let task;
      if (func instanceof Function) {
        task = new inline_scheduled_task_1.InlineScheduledTask(expression, func, options);
      } else {
        const taskPath = solvePath(func);
        task = new background_scheduled_task_1.default(expression, taskPath, options);
      }
      registry.add(task);
      return task;
    }
    function solvePath(filePath) {
      if (path_1.default.isAbsolute(filePath))
        return filePath;
      const stackLines = new Error().stack?.split("\n");
      if (stackLines) {
        stackLines?.shift();
        const callerLine = stackLines?.find((line) => {
          return line.indexOf(__filename) === -1;
        });
        const match = callerLine?.match(/(file:\/\/|)(\/.+):\d+:\d+/);
        if (match) {
          const dir = path_1.default.dirname(match[2]);
          return path_1.default.resolve(dir, filePath);
        }
      }
      throw new Error(`Could not locate task file ${filePath}`);
    }
    function validate(expression) {
      try {
        (0, pattern_validation_1.default)(expression);
        return true;
      } catch (e) {
        return false;
      }
    }
    exports2.nodeCron = {
      schedule,
      createTask,
      validate
    };
    exports2.default = exports2.nodeCron;
  }
});

// src/logger.js
var require_logger2 = __commonJS({
  "src/logger.js"(exports2, module2) {
    require_main().config();
    var fs = require("fs");
    var path = require("path");
    var dgram = require("dgram");
    var logFilePath = path.join(__dirname, "app.log");
    var SYSLOG_HOST = process.env.SYSLOG_HOST || "127.0.0.1";
    var SYSLOG_PORT = parseInt(process.env.SYSLOG_PORT || "514");
    var HOSTNAME = process.env.SYSLOG_HOSTNAME || "voicemail-cleaner";
    var TAG = process.env.SYSLOG_TAG || "puppeteer";
    function sendToSyslog(message, level = "info") {
      const levels = {
        emerg: 0,
        alert: 1,
        crit: 2,
        err: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7
      };
      const facility = 1;
      const priority = facility * 8 + (levels[level] || levels.info);
      const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/T/, " ").replace(/\..+/, "");
      const syslogMsg = `<${priority}>${timestamp} ${HOSTNAME} ${TAG}: ${message}`;
      const client = dgram.createSocket("udp4");
      const buffer = Buffer.from(syslogMsg);
      client.send(buffer, 0, buffer.length, SYSLOG_PORT, SYSLOG_HOST, (err) => {
        if (err) {
          console.error(`Error enviando a syslog: ${err.message}`);
        }
        client.close();
      });
    }
    function log2(message, level = "info") {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      const formattedMsg = `[${timestamp}] ${message}`;
      if (level === "error") {
        console.error(formattedMsg);
      } else {
        console.log(formattedMsg);
      }
      try {
        fs.appendFileSync(logFilePath, formattedMsg + "\n");
      } catch (err) {
        console.error(`Error escribiendo log local: ${err.message}`);
      }
      sendToSyslog(message, level);
    }
    module2.exports = { log: log2 };
  }
});

// src/login.js
var require_login = __commonJS({
  "src/login.js"(exports2, module2) {
    var puppeteer = require("puppeteer");
    var { log: log2 } = require_logger2();
    async function login2() {
      console.log("Usando Chromium desde:", puppeteer.executablePath());
      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--single-process"
        ]
      });
      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        "Accept-Language": "es-ES,es;q=0.9"
      });
      page.setDefaultTimeout(9e4);
      page.setDefaultNavigationTimeout(9e4);
      try {
        log2("\u{1F310} Abriendo p\xE1gina de login...", "info");
        await page.goto("https://web.openrainbow.com/rb/2.149.26/index.html#/login", {
          waitUntil: "networkidle2"
        });
        await page.waitForSelector("#username", { timeout: 1e4 });
        log2("Encontro username ");
        await page.type("#username", process.env.RAINBOW_USER, { delay: 50 });
        await new Promise((resolve) => setTimeout(resolve, 8e3));
        await page.waitForSelector("span.c-button__label", { timeout: 5e4 });
        const continuarClick = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("span.c-button__label")).find((el) => ["Continuar", "Continue"].includes(el.textContent.trim()));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (!continuarClick) throw new Error('\u274C No se encontr\xF3 el bot\xF3n "Continuar"');
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        await page.waitForSelector("#authPwd", { timeout: 1e4 });
        await page.type("#authPwd", process.env.RAINBOW_PASS, { delay: 50 });
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        await page.waitForFunction(() => {
          return Array.from(document.querySelectorAll("span.c-button__label")).some((el) => ["Conectar", "Connect"].includes(el.textContent.trim()));
        }, { timeout: 5e3 });
        const conectarClick = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("span.c-button__label")).find((el) => ["Conectar", "Connect"].includes(el.textContent.trim()));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (!conectarClick) throw new Error('\u274C No se encontr\xF3 el bot\xF3n "Conectar"');
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        console.log("\u2705 Login exitoso.");
        log2("\u2705 Login exitoso.", "info");
        return { browser, page };
      } catch (error) {
        console.error("\u274C Error en login:", error.message);
        log2("\u274C Error en login: " + error.message, "error");
        await browser.close();
        return { browser, page: null };
      }
    }
    module2.exports = login2;
  }
});

// src/cleanupVoicemail.js
var require_cleanupVoicemail = __commonJS({
  "src/cleanupVoicemail.js"(exports2, module2) {
    var { log: log2 } = require_logger2();
    async function cleanupVoicemail2(page) {
      try {
        try {
          await new Promise((resolve) => setTimeout(resolve, 5e3));
          await page.waitForSelector("button.dummyRbButtonClass.c-button--secondary > span.c-button__label", {
            timeout: 3e3
          });
          const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll("button.dummyRbButtonClass.c-button--secondary > span.c-button__label"));
            const noBtnSpan = buttons.find((el) => el.textContent.trim() === "No");
            if (noBtnSpan) {
              noBtnSpan.parentElement.click();
              return true;
            }
            return false;
          });
          if (clicked) {
            console.log('\u2705 Popup detectado y bot\xF3n "No" clickeado.');
            log2('\u2705 Popup detectado y bot\xF3n "No" clickeado.', "info");
            await new Promise((resolve) => setTimeout(resolve, 3e3));
          }
        } catch {
          console.log('\u2139\uFE0F No apareci\xF3 popup para aceptar "No".');
          log2('\u2139\uFE0F No apareci\xF3 popup para aceptar "No".', "info");
        }
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        await page.waitForSelector("body > div.o-grid.p-layout > header > nav > menu > ul > li.nav-item_call_log > button", {
          timeout: 1e4
        });
        await page.click("body > div.o-grid.p-layout > header > nav > menu > ul > li.nav-item_call_log > button");
        console.log("\u2705 Click en men\xFA mensajes de voz realizado.");
        log2("\u2705 Click en men\xFA mensajes de voz realizado.", "info");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        await page.waitForSelector("#callLogs-delete-all > rb-svg-img > svg", { timeout: 1e4 });
        await page.click("#callLogs-delete-all > rb-svg-img > svg");
        console.log("\u2705 Click en bot\xF3n eliminar todos.");
        log2("\u2705 Click en bot\xF3n eliminar todos.", "info");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
        await page.waitForFunction(() => {
          const buttons = Array.from(document.querySelectorAll("span.c-button__label"));
          const eliminarBtn = buttons.find((el) => el.textContent.trim() === "Eliminar");
          if (eliminarBtn) {
            eliminarBtn.click();
            return true;
          }
          return false;
        }, { timeout: 1e4 });
        console.log("\u2705 Confirmaci\xF3n de eliminaci\xF3n realizada.");
        log2("\u2705 Confirmaci\xF3n de eliminaci\xF3n realizada.", "info");
        await new Promise((resolve) => setTimeout(resolve, 5e3));
      } catch (error) {
        console.error("\u274C Error durante limpieza de mensajes de voz:", error.message);
        log2("\u274C Error durante limpieza de mensajes de voz: " + error.message, "error");
      }
    }
    module2.exports = cleanupVoicemail2;
  }
});

// src/index.js
require_main().config();
var cron = require_node_cron();
var login = require_login();
var cleanupVoicemail = require_cleanupVoicemail();
var { log } = require_logger2();
async function runCleanup() {
  log(`Ejecutando limpieza...`, "info");
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] Ejecutando limpieza...`);
  const { browser, page } = await login();
  if (!page) {
    console.error("\u274C No se pudo iniciar sesi\xF3n.");
    log("\u274C No se pudo iniciar sesi\xF3n.", "error");
    await browser.close();
    return;
  }
  await cleanupVoicemail(page);
  await browser.close();
  console.log("\u2714\uFE0F Proceso terminado.");
  log("\u2714\uFE0F Proceso terminado.", "info");
}
runCleanup();
cron.schedule("0 0,12 * * *", runCleanup);
