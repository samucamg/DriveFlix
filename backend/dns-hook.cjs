const dns = require("node:dns");

const HOSTS = {
  "tail.developers.workers.dev": "104.21.5.179",
};

const originalLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  if (HOSTS[hostname]) {
    const ip = HOSTS[hostname];
    if (options && options.all) {
      return callback(null, [{ address: ip, family: 4 }]);
    }
    return callback(null, ip, 4);
  }
  return originalLookup.call(this, hostname, options, callback);
};

if (dns.promises && dns.promises.lookup) {
  const originalPromiseLookup = dns.promises.lookup;
  dns.promises.lookup = async function (hostname, options) {
    if (HOSTS[hostname]) {
      const ip = HOSTS[hostname];
      if (options && options.all) {
        return [{ address: ip, family: 4 }];
      }
      return { address: ip, family: 4 };
    }
    return originalPromiseLookup.call(this, hostname, options);
  };
}
