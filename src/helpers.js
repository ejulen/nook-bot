const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "numeric",
  minute: "numeric",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "Europe/Stockholm"
});

class Lock {
    constructor() {
        this.promise = Promise.resolve();
    }

    acquire(callback) {
        this.promise = this.promise.then(callback);
        return this.promise;
    }
}

module.exports = { dateFormatter, Lock };
