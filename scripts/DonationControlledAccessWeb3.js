// Addresses
var contractAddress = "0xContractAddress";
var userAddress = "0xUserAddress";

// Message to sign : contract address + address to give access
var message = web3.sha3(contractAddress.substr(2) + userAddress.substr(2), {encoding: 'hex'})

// Signing message (with "\x19Ethereum Signed Message:\n32" as prefix by default)
web3.personal.sign(message, web3.eth.defaultAccount, (err, res) => sign = res)



// //Extracting ECDSA variables
// var r = sign.substr(0, 66);
// var s = '0x' + sign.substr(66, 64);
// var v = '0x' + sign.substr(130,2);

async function sighTest(contractAddress, userAddress, account) {

    var message = web3.sha3(contractAddress.substr(2) + userAddress.substr(2), {encoding: 'hex'});

    const signature = await web3.eth.sign(account, message);
    const { v, r, s } = ethUtil.fromRpcSig(signature);
}