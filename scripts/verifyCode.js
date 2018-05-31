var fs = require('fs');
var abi = require('ethereumjs-abi');
var exec = require('child_process').exec;

// 1. flatten function - function that flattens all contracts in contracts/ folder
// saves the flattened contracts to the out folder
function flatten() {
  var command = 'sh scripts/flattener.sh';
  execute(command);
}

// 2. constructor abi - function that gets a list of parameter types and a 
// list of parameter values and saves to out folder an abi encoded string
function toABI(file, types, params) {
  var parameterValues = [];
  for (let i = 0; i < params.length; i++) {
    parameterValues[i] = params[i].toString();
  }
  var encoded = abi.rawEncode(types, parameterValues);
  saveToFile(file, encoded.toString('hex'));
}

async function execute(cmd) {
  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      console.log('err: ' + err);
      return;
    }

    // // the *entire* stdout and stderr (buffered)
    // console.log('stdout: ${stdout}');
    // console.log('stderr: ${stderr}');
  });
}

function saveToFile(file, content) {
  fs.writeFile("./out/" + file, content, function (err) {
    if (err) {
      return console.log(err);
    }
  });
}

String.prototype.format = function () {
  var args = [].slice.call(arguments);
  return this.replace(/(\{\d+\})/g, function (a) {
    return args[+(a.substr(1, a.length - 2)) || 0];
  });
};

module.exports = {
  flatten: flatten,
  toABI: toABI,
};