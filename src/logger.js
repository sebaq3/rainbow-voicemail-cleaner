require('dotenv').config();
const fs = require('fs');
const path = require('path');
const dgram = require('dgram');

const logFilePath = path.join(__dirname, 'app.log');

// Leer config del .env
const SYSLOG_HOST = process.env.SYSLOG_HOST || '127.0.0.1';
const SYSLOG_PORT = parseInt(process.env.SYSLOG_PORT || '514');
const HOSTNAME = process.env.SYSLOG_HOSTNAME || 'voicemail-cleaner';
const TAG = process.env.SYSLOG_TAG || 'puppeteer';

function sendToSyslog(message, level = 'info') {
  const levels = {
    emerg: 0, alert: 1, crit: 2, err: 3,
    warning: 4, notice: 5, info: 6, debug: 7
  };

  const facility = 1; // user-level messages
  const priority = facility * 8 + (levels[level] || levels.info);

  const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  const syslogMsg = `<${priority}>${timestamp} ${HOSTNAME} ${TAG}: ${message}`;

  const client = dgram.createSocket('udp4');
  const buffer = Buffer.from(syslogMsg);

  client.send(buffer, 0, buffer.length, SYSLOG_PORT, SYSLOG_HOST, (err) => {
    if (err) {
      console.error(`Error enviando a syslog: ${err.message}`);
    }
    client.close();
  });
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const formattedMsg = `[${timestamp}] ${message}`;

  // Log en consola
  if (level === 'error') {
    console.error(formattedMsg);
  } else {
    console.log(formattedMsg);
  }

  // Log en archivo
  try {
    fs.appendFileSync(logFilePath, formattedMsg + '\n');
  } catch (err) {
    console.error(`Error escribiendo log local: ${err.message}`);
  }

  // Log por syslog UDP
  sendToSyslog(message, level);
}

module.exports = { log };
