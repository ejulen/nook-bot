const dateFormatter = new Intl.DateTimeFormat("sv-SE", {
  hour: "numeric",
  minute: "numeric",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

function quote(input) {
  return "> " + input.replace(/\n/g, "\n> ");
}

module.exports = { dateFormatter, quote };
