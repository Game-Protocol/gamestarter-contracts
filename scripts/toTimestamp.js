function getTimeStamp(input) {
  var parts = input.trim().split(' ');
  var date = parts[0].split('-');
  var time = (parts[1] ? parts[1] : '00:00:00').split(':');

  // NOTE:: Month: 0 = January - 11 = December.
  var d = Date.UTC(date[0], date[1] - 1, date[2], time[0], time[1], time[2]);
  return d / 1000;
}

function getTimeStampMinutesFromNow(minutes) {
  var minutesLater = new Date();
  minutesLater.setMinutes(minutesLater.getMinutes() + minutes);
  return minutesLater / 1000;
}

module.exports = {
  getTimeStamp: getTimeStamp,
  getTimeStampMinutesFromNow: getTimeStampMinutesFromNow
};