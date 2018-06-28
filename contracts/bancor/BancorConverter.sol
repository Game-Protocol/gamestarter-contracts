pragma solidity ^0.4.24;

import "./SmartTokenController.sol";
import "./Managed.sol";
import "./interfaces/ITokenConverter.sol";
import "./interfaces/ISmartToken.sol";
import "./interfaces/IBancorConverterExtensions.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/*
    Bancor Converter v0.8

    The Bancor version of the token converter, allows conversion between a smart token and other ERC20 tokens and between different ERC20 tokens and themselves.

    ERC20 connector balance can be virtual, meaning that the calculations are based on the virtual balance instead of relying on
    the actual connector balance. This is a security mechanism that prevents the need to keep a very large (and valuable) balance in a single contract.

    The converter is upgradable (just like any SmartTokenController).

    WARNING: It is NOT RECOMMENDED to use the converter with Smart Tokens that have less than 8 decimal digits
             or with very small numbers because of precision loss


    Open issues:
    - Front-running attacks are currently mitigated by the following mechanisms:
        - minimum return argument for each conversion provides a way to define a minimum/maximum price for the transaction
        - gas price limit prevents users from having control over the order of execution
      Other potential solutions might include a commit/reveal based schemes
    - Possibly add getters for the connector fields so that the client won't need to rely on the order in the struct
*/
contract BancorConverter is ITokenConverter, SmartTokenController, Managed {
    using SafeMath for uint256;
    uint32 private constant MAX_WEIGHT = 1000000;
    uint32 private constant MAX_CONVERSION_FEE = 1000000;

    struct Connector {
        uint256 virtualBalance;         // connector virtual balance
        uint32 weight;                  // connector weight, represented in ppm, 1-1000000
        bool isVirtualBalanceEnabled;   // true if virtual balance is enabled, false if not
        bool isPurchaseEnabled;         // is purchase of the smart token enabled with the connector, can be set by the owner
        bool isSet;                     // used to tell if the mapping element is defined
    }

    string public version = "0.1";
    string public converterType = "game_protocol";

    IBancorConverterExtensions public extensions;       // bancor converter extensions contract
    ERC20[] public connectorTokens;               // ERC20 standard token addresses
    ERC20[] public quickBuyPath;                  // conversion path that's used in order to buy the token with ETH
    mapping (address => Connector) public connectors;   // connector token addresses -> connector data
    uint32 private totalConnectorWeight = 0;            // used to efficiently prevent increasing the total connector weight above 100%
    uint32 public maxConversionFee = 0;                 // maximum conversion fee for the lifetime of the contract, represented in ppm,
                                                        // 0...1000000 (0 = no fee, 100 = 0.01%, 1000000 = 100%)
    uint32 public conversionFee = 0;                    // current conversion fee, represented in ppm, 0...maxConversionFee
    bool public conversionsEnabled = true;              // true if token conversions is enabled, false if not
    ERC20[] private convertPath;

    // triggered when a conversion between two tokens occurs (TokenConverter event)
    event Conversion(
        address indexed _fromToken,
        address indexed _toToken, 
        address indexed _trader, 
        uint256 _amount, 
        uint256 _return, 
        int256 _conversionFee, 
        uint256 _currentPriceN, 
        uint256 _currentPriceD
    );
    // triggered when the conversion fee is updated
    event ConversionFeeUpdate(uint32 _prevFee, uint32 _newFee);

    /**
        @dev constructor

        @param  _token              smart token governed by the converter
        @param  _extensions         address of a bancor converter extensions contract
        @param  _maxConversionFee   maximum conversion fee, represented in ppm
        @param  _connectorToken     optional, initial connector, allows defining the first connector at deployment time
        @param  _connectorWeight    optional, weight for the initial connector
    */
    constructor(
        ISmartToken _token, 
        IBancorConverterExtensions _extensions, 
        uint32 _maxConversionFee, 
        ERC20 _connectorToken, 
        uint32 _connectorWeight
    )
        public
        SmartTokenController(_token)
        validMaxConversionFee(_maxConversionFee)
    {
        require(_extensions != address(0));
        extensions = _extensions;
        maxConversionFee = _maxConversionFee;

        if (_connectorToken != address(0))
            addConnector(_connectorToken, _connectorWeight, false);
    }

    // validates a connector token address - verifies that the address belongs to one of the connector tokens
    modifier validConnector(ERC20 _address) {
        require(connectors[_address].isSet);
        _;
    }

    // validates a token address - verifies that the address belongs to one of the convertible tokens
    modifier validToken(ERC20 _address) {
        require(_address == token || connectors[_address].isSet);
        _;
    }

    // validates maximum conversion fee
    modifier validMaxConversionFee(uint32 _conversionFee) {
        require(_conversionFee >= 0 && _conversionFee <= MAX_CONVERSION_FEE);
        _;
    }

    // validates conversion fee
    modifier validConversionFee(uint32 _conversionFee) {
        require(_conversionFee >= 0 && _conversionFee <= maxConversionFee);
        _;
    }

    // validates connector weight range
    modifier validConnectorWeight(uint32 _weight) {
        require(_weight > 0 && _weight <= MAX_WEIGHT);
        _;
    }

    // validates a conversion path - verifies that the number of elements is odd and that maximum number of 'hops' is 10
    modifier validConversionPath(ERC20[] _path) {
        require(_path.length > 2 && _path.length <= (1 + 2 * 10) && _path.length % 2 == 1);
        _;
    }

    // allows execution only when conversions aren't disabled
    modifier conversionsAllowed {
        assert(conversionsEnabled);
        _;
    }

    // allows execution only for owner or manager
    modifier ownerOrManagerOnly {
        require(msg.sender == owner || msg.sender == manager);
        _;
    }

    // allows execution only for quick convreter
    modifier quickConverterOnly {
        require(msg.sender == address(extensions.quickConverter()));
        _;
    }

    /**
        @dev returns the number of connector tokens defined

        @return number of connector tokens
    */
    function connectorTokenCount() public view returns (uint16) {
        return uint16(connectorTokens.length);
    }

    /**
        @dev returns the number of convertible tokens supported by the contract
        note that the number of convertible tokens is the number of connector token, plus 1 (that represents the smart token)

        @return number of convertible tokens
    */
    function convertibleTokenCount() public view returns (uint16) {
        return connectorTokenCount() + 1;
    }

    /**
        @dev given a convertible token index, returns its contract address

        @param _tokenIndex  convertible token index

        @return convertible token address
    */
    function convertibleToken(uint16 _tokenIndex) public view returns (address) {
        if (_tokenIndex == 0)
            return token;
        return connectorTokens[_tokenIndex - 1];
    }

    /*
        @dev allows the owner to update the extensions contract address

        @param _extensions    address of a bancor converter extensions contract
    */
    function setExtensions(IBancorConverterExtensions _extensions)
        public
        onlyOwner
    {
        require(_extensions != address(0));
        require(_extensions != address(this));
        extensions = _extensions;
    }

    /*
        @dev allows the manager to update the quick buy path

        @param _path    new quick buy path, see conversion path format in the BancorQuickConverter contract
    */
    function setQuickBuyPath(ERC20[] _path)
        public
        onlyOwner
        validConversionPath(_path)
    {
        quickBuyPath = _path;
    }

    /*
        @dev allows the manager to clear the quick buy path
    */
    function clearQuickBuyPath() public onlyOwner {
        quickBuyPath.length = 0;
    }

    /**
        @dev returns the length of the quick buy path array

        @return quick buy path length
    */
    function getQuickBuyPathLength() public view returns (uint256) {
        return quickBuyPath.length;
    }

    /**
        @dev disables the entire conversion functionality
        this is a safety mechanism in case of a emergency
        can only be called by the manager

        @param _disable true to disable conversions, false to re-enable them
    */
    function disableConversions(bool _disable) public ownerOrManagerOnly {
        conversionsEnabled = !_disable;
    }

    /**
        @dev updates the current conversion fee
        can only be called by the manager

        @param _conversionFee new conversion fee, represented in ppm
    */
    function setConversionFee(uint32 _conversionFee)
        public
        ownerOrManagerOnly
        validConversionFee(_conversionFee)
    {
        emit ConversionFeeUpdate(conversionFee, _conversionFee);
        conversionFee = _conversionFee;
    }

    /*
        @dev returns the conversion fee amount for a given return amount

        @return conversion fee amount
    */
    function getConversionFeeAmount(uint256 _amount) public view returns (uint256) {
        return _amount.mul(conversionFee).div(MAX_CONVERSION_FEE);
    }

    /**
        @dev defines a new connector for the token
        can only be called by the owner while the converter is inactive

        @param _token                  address of the connector token
        @param _weight                 constant connector weight, represented in ppm, 1-1000000
        @param _enableVirtualBalance   true to enable virtual balance for the connector, false to disable it
    */
    function addConnector(ERC20 _token, uint32 _weight, bool _enableVirtualBalance)
        public
        onlyOwner
        inactive
        validConnectorWeight(_weight)
    {
        require(_token != address(0));
        require(_token != address(this));
        require(_token != token && !connectors[_token].isSet && totalConnectorWeight + _weight <= MAX_WEIGHT); // validate input

        connectors[_token].virtualBalance = 0;
        connectors[_token].weight = _weight;
        connectors[_token].isVirtualBalanceEnabled = _enableVirtualBalance;
        connectors[_token].isPurchaseEnabled = true;
        connectors[_token].isSet = true;
        connectorTokens.push(_token);
        totalConnectorWeight += _weight;
    }

    /**
        @dev updates one of the token connectors
        can only be called by the owner

        @param _connectorToken         address of the connector token
        @param _weight                 constant connector weight, represented in ppm, 1-1000000
        @param _enableVirtualBalance   true to enable virtual balance for the connector, false to disable it
        @param _virtualBalance         new connector's virtual balance
    */
    function updateConnector(ERC20 _connectorToken, uint32 _weight, bool _enableVirtualBalance, uint256 _virtualBalance)
        public
        onlyOwner
        validConnector(_connectorToken)
        validConnectorWeight(_weight)
    {
        Connector storage connector = connectors[_connectorToken];
        require(totalConnectorWeight - connector.weight + _weight <= MAX_WEIGHT); // validate input

        totalConnectorWeight = totalConnectorWeight - connector.weight + _weight;
        connector.weight = _weight;
        connector.isVirtualBalanceEnabled = _enableVirtualBalance;
        connector.virtualBalance = _virtualBalance;
    }

    /**
        @dev disables purchasing with the given connector token in case the connector token got compromised
        can only be called by the owner
        note that selling is still enabled regardless of this flag and it cannot be disabled by the owner

        @param _connectorToken  connector token contract address
        @param _disable         true to disable the token, false to re-enable it
    */
    function disableConnectorPurchases(ERC20 _connectorToken, bool _disable)
        public
        onlyOwner
        validConnector(_connectorToken)
    {
        connectors[_connectorToken].isPurchaseEnabled = !_disable;
    }

    /**
        @dev returns the connector's virtual balance if one is defined, otherwise returns the actual balance

        @param _connectorToken  connector token contract address

        @return connector balance
    */
    function getConnectorBalance(ERC20 _connectorToken)
        public
        view
        validConnector(_connectorToken)
        returns (uint256)
    {
        Connector storage connector = connectors[_connectorToken];
        return connector.isVirtualBalanceEnabled ? connector.virtualBalance : _connectorToken.balanceOf(this);
    }

    /**
        @dev returns the expected return for converting a specific amount of _fromToken to _toToken

        @param _fromToken  ERC20 token to convert from
        @param _toToken    ERC20 token to convert to
        @param _amount     amount to convert, in fromToken

        @return expected conversion return amount
    */
    function getReturn(ERC20 _fromToken, ERC20 _toToken, uint256 _amount) public view returns (uint256) {
        require(_fromToken != _toToken); // validate input

        // conversion between the token and one of its connectors
        if (_toToken == token)
            return getPurchaseReturn(_fromToken, _amount);
        else if (_fromToken == token)
            return getSaleReturn(_toToken, _amount);

        // conversion between 2 connectors
        uint256 purchaseReturnAmount = getPurchaseReturn(_fromToken, _amount);
        return getSaleReturn(_toToken, purchaseReturnAmount, token.totalSupply().add(purchaseReturnAmount));
    }

    /**
        @dev returns the expected return for buying the token for a connector token

        @param _connectorToken  connector token contract address
        @param _depositAmount   amount to deposit (in the connector token)

        @return expected purchase return amount
    */
    function getPurchaseReturn(ERC20 _connectorToken, uint256 _depositAmount)
        public
        view
        active
        validConnector(_connectorToken)
        returns (uint256)
    {
        Connector storage connector = connectors[_connectorToken];
        require(connector.isPurchaseEnabled); // validate input

        uint256 tokenSupply = token.totalSupply();
        uint256 connectorBalance = getConnectorBalance(_connectorToken);
        uint256 amount = extensions.formula().calculatePurchaseReturn(tokenSupply, connectorBalance, connector.weight, _depositAmount);

        // deduct the fee from the return amount
        uint256 feeAmount = getConversionFeeAmount(amount);
        return amount.sub(feeAmount);
    }

    /**
        @dev returns the expected return for selling the token for one of its connector tokens

        @param _connectorToken  connector token contract address
        @param _sellAmount      amount to sell (in the smart token)

        @return expected sale return amount
    */
    function getSaleReturn(ERC20 _connectorToken, uint256 _sellAmount) public view returns (uint256) {
        return getSaleReturn(_connectorToken, _sellAmount, token.totalSupply());
    }

    /**
        @dev converts a specific amount of _fromToken to _toToken

        @param _fromToken  ERC20 token to convert from
        @param _toToken    ERC20 token to convert to
        @param _amount     amount to convert, in fromToken
        @param _minReturn  if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero

        @return conversion return amount
    */
    function convertInternal(
        ERC20 _fromToken, 
        ERC20 _toToken, 
        uint256 _amount, 
        uint256 _minReturn
    ) 
        public 
        quickConverterOnly 
        returns (uint256) 
    {
        require(_fromToken != _toToken); // validate input

        // conversion between the token and one of its connectors
        if (_toToken == token)
            return buy(_fromToken, _amount, _minReturn);
        else if (_fromToken == token)
            return sell(_toToken, _amount, _minReturn);

        // conversion between 2 connectors
        uint256 purchaseAmount = buy(_fromToken, _amount, 1);
        return sell(_toToken, purchaseAmount, _minReturn);
    }

    /**
        @dev converts a specific amount of _fromToken to _toToken

        @param _fromToken  ERC20 token to convert from
        @param _toToken    ERC20 token to convert to
        @param _amount     amount to convert, in fromToken
        @param _minReturn  if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero

        @return conversion return amount
    */
    function convert(ERC20 _fromToken, ERC20 _toToken, uint256 _amount, uint256 _minReturn) public returns (uint256) {
        convertPath = [_fromToken, token, _toToken];
        return quickConvert(convertPath, _amount, _minReturn);
    }

    /**
        @dev buys the token by depositing one of its connector tokens

        @param _connectorToken  connector token contract address
        @param _depositAmount   amount to deposit (in the connector token)
        @param _minReturn       if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero

        @return buy return amount
    */
    function buy(ERC20 _connectorToken, uint256 _depositAmount, uint256 _minReturn)
        internal
        conversionsAllowed
        returns (uint256)
    {
        require(_minReturn > 0);
        uint256 amount = getPurchaseReturn(_connectorToken, _depositAmount);
        require(amount != 0 && amount >= _minReturn); // ensure the trade gives something in return and meets the minimum requested amount

        // update virtual balance if relevant
        Connector storage connector = connectors[_connectorToken];
        if (connector.isVirtualBalanceEnabled)
            connector.virtualBalance = connector.virtualBalance.add(_depositAmount);

        // transfer _depositAmount funds from the caller in the connector token
        assert(_connectorToken.transferFrom(msg.sender, this, _depositAmount));
        // issue new funds to the caller in the smart token
        token.issue(msg.sender, amount);

        dispatchConversionEvent(_connectorToken, _depositAmount, amount, true);
        return amount;
    }

    /**
        @dev sells the token by withdrawing from one of its connector tokens

        @param _connectorToken  connector token contract address
        @param _sellAmount      amount to sell (in the smart token)
        @param _minReturn       if the conversion results in an amount smaller the minimum return - it is cancelled, must be nonzero

        @return sell return amount
    */
    function sell(ERC20 _connectorToken, uint256 _sellAmount, uint256 _minReturn)
        internal
        conversionsAllowed
        returns (uint256)
    {
        require(_minReturn > 0);
        require(_sellAmount <= token.balanceOf(msg.sender)); // validate input

        uint256 amount = getSaleReturn(_connectorToken, _sellAmount);
        require(amount != 0 && amount >= _minReturn); // ensure the trade gives something in return and meets the minimum requested amount

        uint256 tokenSupply = token.totalSupply();
        uint256 connectorBalance = getConnectorBalance(_connectorToken);
        // ensure that the trade will only deplete the connector if the total supply is depleted as well
        assert(amount < connectorBalance || (amount == connectorBalance && _sellAmount == tokenSupply));

        // update virtual balance if relevant
        Connector storage connector = connectors[_connectorToken];
        if (connector.isVirtualBalanceEnabled)
            connector.virtualBalance = connector.virtualBalance.sub(amount);

        // destroy _sellAmount from the caller's balance in the smart token
        token.destroy(msg.sender, _sellAmount);
        // transfer funds to the caller in the connector token
        // the transfer might fail if the actual connector balance is smaller than the virtual balance
        assert(_connectorToken.transfer(msg.sender, amount));

        dispatchConversionEvent(_connectorToken, _sellAmount, amount, false);
        return amount;
    }

    /**
        @dev converts the token to any other token in the bancor network by following a predefined conversion path
        note that when converting from an ERC20 token (as opposed to a smart token), allowance must be set beforehand

        @param _path        conversion path, see conversion path format in the BancorQuickConverter contract
        @param _amount      amount to convert from (in the initial source token)
        @param _minReturn   if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero

        @return tokens issued in return
    */
    function quickConvert(ERC20[] _path, uint256 _amount, uint256 _minReturn)
        public
        payable
        validConversionPath(_path)
        returns (uint256)
    {
        return quickConvertPrioritized(_path, _amount, _minReturn, 0x0, 0x0, 0x0, 0x0, 0x0);
    }

    /**
        @dev converts the token to any other token in the bancor network by following a predefined conversion path
        note that when converting from an ERC20 token (as opposed to a smart token), allowance must be set beforehand

        @param _path        conversion path, see conversion path format in the BancorQuickConverter contract
        @param _amount      amount to convert from (in the initial source token)
        @param _minReturn   if the conversion results in an amount smaller than the minimum return - it is cancelled, must be nonzero
        @param _block       if the current block exceeded the given parameter - it is cancelled
        @param _nonce       the nonce of the sender address
        @param _v           parameter that can be parsed from the transaction signature
        @param _r           parameter that can be parsed from the transaction signature
        @param _s           parameter that can be parsed from the transaction signature

        @return tokens issued in return
    */
    function quickConvertPrioritized(
        ERC20[] _path, 
        uint256 _amount, 
        uint256 _minReturn, 
        uint256 _block, 
        uint256 _nonce, 
        uint8 _v, 
        bytes32 _r, 
        bytes32 _s
    )
        public
        payable
        validConversionPath(_path)
        returns (uint256)
    {
        ERC20 fromToken = _path[0];
        IBancorQuickConverter quickConverter = extensions.quickConverter();

        // we need to transfer the source tokens from the caller to the quick converter,
        // so it can execute the conversion on behalf of the caller
        if (msg.value == 0) {
            // not ETH, send the source tokens to the quick converter
            // if the token is the smart token, no allowance is required - destroy the tokens from the caller and issue them to the quick converter
            if (fromToken == token) {
                token.destroy(msg.sender, _amount); // destroy _amount tokens from the caller's balance in the smart token
                token.issue(quickConverter, _amount); // issue _amount new tokens to the quick converter
            } else {
                // otherwise, we assume we already have allowance, transfer the tokens directly to the quick converter
                assert(fromToken.transferFrom(msg.sender, quickConverter, _amount));
            }
        }

        // execute the conversion and pass on the ETH with the call
        return quickConverter.convertForPrioritized.value(msg.value)(_path, _amount, _minReturn, msg.sender, _block, _nonce, _v, _r, _s);
    }

    // deprecated, backward compatibility
    function change(ERC20 _fromToken, ERC20 _toToken, uint256 _amount, uint256 _minReturn) public returns (uint256) {
        return convertInternal(_fromToken, _toToken, _amount, _minReturn);
    }

    /**
        @dev utility, returns the expected return for selling the token for one of its connector tokens, given a total supply override

        @param _connectorToken  connector token contract address
        @param _sellAmount      amount to sell (in the smart token)
        @param _totalSupply     total token supply, overrides the actual token total supply when calculating the return

        @return sale return amount
    */
    function getSaleReturn(ERC20 _connectorToken, uint256 _sellAmount, uint256 _totalSupply)
        private
        view
        active
        validConnector(_connectorToken)
        returns (uint256)
    {
        require(_totalSupply > 0);
        Connector storage connector = connectors[_connectorToken];
        uint256 connectorBalance = getConnectorBalance(_connectorToken);
        uint256 amount = extensions.formula().calculateSaleReturn(_totalSupply, connectorBalance, connector.weight, _sellAmount);

        // deduct the fee from the return amount
        uint256 feeAmount = getConversionFeeAmount(amount);
        return amount.sub(feeAmount);
    }

    /**
        @dev helper, dispatches the Conversion event
        The function also takes the tokens' decimals into account when calculating the current price

        @param _connectorToken  connector token contract address
        @param _amount          amount purchased/sold (in the source token)
        @param _returnAmount    amount returned (in the target token)
        @param isPurchase       true if it's a purchase, false if it's a sale
    */
    function dispatchConversionEvent(ERC20 _connectorToken, uint256 _amount, uint256 _returnAmount, bool isPurchase) private {
        Connector storage connector = connectors[_connectorToken];

        // calculate the new price using the simple price formula
        // price = connector balance / (supply * weight)
        // weight is represented in ppm, so multiplying by 1000000
        uint256 connectorAmount = getConnectorBalance(_connectorToken).mul(MAX_WEIGHT);
        uint256 tokenAmount = token.totalSupply().mul(connector.weight);

        // normalize values
        uint8 tokenDecimals = DetailedERC20(token).decimals();
        uint8 connectorTokenDecimals = DetailedERC20(_connectorToken).decimals();
        if (tokenDecimals != connectorTokenDecimals) {
            if (tokenDecimals > connectorTokenDecimals)
                connectorAmount = connectorAmount.mul(10 ** uint256(tokenDecimals - connectorTokenDecimals));
            else
                tokenAmount = tokenAmount.mul(10 ** uint256(connectorTokenDecimals - tokenDecimals));
        }

        uint256 feeAmount = getConversionFeeAmount(_returnAmount);
        // ensure that the fee is capped at 255 bits to prevent overflow when converting it to a signed int
        assert(feeAmount <= 2 ** 255);

        if (isPurchase)
            emit Conversion(_connectorToken, token, msg.sender, _amount, _returnAmount, int256(feeAmount), connectorAmount, tokenAmount);
        else
            emit Conversion(token, _connectorToken, msg.sender, _amount, _returnAmount, int256(feeAmount), tokenAmount, connectorAmount);
    }

    /**
        @dev fallback, buys the smart token with ETH
        note that the purchase will use the price at the time of the purchase
    */
    function() payable public {
        quickConvert(quickBuyPath, msg.value, 1);
    }
}
