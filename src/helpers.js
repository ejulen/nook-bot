const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "numeric",
  minute: "numeric",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

class Lock {
  constructor() {
    this.promise = Promise.resolve();
  }

  acquire(callback) {
    this.promise = this.promise.then(callback).catch(err => console.error(err));
    return this.promise;
  }
}

module.exports = { dateFormatter, Lock };
