const advanceBlock = require('../helpers/advanceToBlock');
const increaseTime = require('../helpers/increaseTime');
const latestTime = require('../helpers/latestTime');
const ether = require('../helpers/ether');
const EVMRevert = "revert";

const BigNumber = web3.BigNumber;

const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(BigNumber))
    .should();

const SmartToken = artifacts.require('SmartToken.sol');
const TestERC20Token = artifacts.require('TestERC20Token.sol');
const MockGameToken = artifacts.require('MockGameToken.sol');
const BancorFormula = artifacts.require('BancorFormula.sol');
const BancorGasPriceLimit = artifacts.require('BancorGasPriceLimit.sol');
const BancorQuickConverter = artifacts.require('BancorQuickConverter.sol');
const BancorConverterExtensions = artifacts.require('BancorConverterExtensions.sol');
const BancorConverter = artifacts.require('BancorConverter.sol');

// 1. Smart Token  `params=(name, symbol, decimals)`
// 2. BancorFormula, BancorGasPriceLimit, BancorQuickConverter `params=()`
// 3. BancorConverterExtensions using (3)  `params=(bancorFormula, bancorGasPriceLimit, bancorQuickConverter)`
// 4. BancorConverter using (1) , (4)  `params=(token, bancorConverterExtensions)`
// 5. 2 test Tokens for connectors  `params=()`

const weight10Percent = 100000;
const gasPrice = 22000000000;
const gasPriceBadHigh = 22000000001;

function verifyConnector(connector, isSet, isEnabled, weight, isVirtualBalanceEnabled, virtualBalance) {
    assert.equal(connector[0], virtualBalance);
    assert.equal(connector[1], weight);
    assert.equal(connector[2], isVirtualBalanceEnabled);
    assert.equal(connector[3], isEnabled);
    assert.equal(connector[4], isSet);
}


contract('BancorConverter', (accounts) => {

    before(async function () {
        // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
        await advanceBlock.advanceBlock();
    });

    beforeEach(async function () {
        this.smartToken = await SmartToken.new('SmartToken', 'ST1', 18);
        this.connectorToken = await MockGameToken.new("Token1");
        this.connectorToken2 = await MockGameToken.new("Token2");

        let formula = await BancorFormula.new();
        let gasPriceLimit = await BancorGasPriceLimit.new(gasPrice);
        let quickConverter = await BancorQuickConverter.new();
        await quickConverter.setGasPriceLimit(gasPriceLimit.address);
        this.converterExtensions = await BancorConverterExtensions.new(formula.address, gasPriceLimit.address, quickConverter.address);
    });

    describe('converter', function () {
        it('verifies tokens', async function () {
            should.exist(this.smartToken);
            should.exist(this.connectorToken);
            should.exist(this.connectorToken2);
        });

        it('verifies converterExtensions', async function () {
            should.exist(this.converterExtensions);
        });

        it('verifies the converter data after construction', async function () {
            let converter = await BancorConverter.new(this.smartToken.address, this.converterExtensions.address, 0);
            let token = await converter.token.call();
            token.should.be.equal(this.smartToken.address);
            let extensions = await converter.extensions.call();
            extensions.should.be.equal(this.converterExtensions.address);
            let maxConversionFee = await converter.maxConversionFee.call();
            maxConversionFee.should.be.bignumber.equal(0);
            let conversionsEnabled = await converter.conversionsEnabled.call();
            conversionsEnabled.should.be.equal(true);
        });

        it('should throw when attempting to construct a converter with no token', async function () {
            await BancorConverter.new('0x0', this.converterExtensions, 0).should.be.rejected;
        });

        it('should throw when attempting to construct a converter with no converter extensions', async function () {
            await BancorConverter.new(this.smartToken.address, '0x0', 0).should.be.rejected;
        });

        it('should throw when attempting to construct a converter with invalid max fee', async function () {
            await BancorConverter.new(this.smartToken.address, this.converterExtensions, 1000000000).should.be.rejected;
        });
    });

    describe('updates', function () {

        beforeEach(async function () {
            this.converter = await BancorConverter.new(this.smartToken.address, this.converterExtensions.address, 200000);
        });

        it('verifies the owner can update the converter extensions contract address', async function () {
            await this.converter.setExtensions(accounts[3]).should.be.fulfilled;
            let extensions = await this.converter.extensions.call();
            extensions.should.not.be.equal(this.converterExtensions.address);
        });

        it('should throw when a non owner attempts update the converter extensions contract address', async function () {
            await this.converter.setExtensions(accounts[3], { from: accounts[1] }).should.be.rejected;
        });

        it('should throw when a non owner attempts update the converter extensions contract address with an invalid address', async function () {
            await this.converter.setExtensions('0x0', { from: accounts[1] }).should.be.rejected;
        });

        it('should throw when a non owner attempts update the converter extensions contract address with the converter address', async function () {
            await this.converter.setExtensions(this.converter.address, { from: accounts[1] }).should.be.rejected;
        });

        it('should throw when a non owner attempts update the converter extensions contract address with the same existing address', async function () {
            await this.converter.setExtensions(this.converterExtensions.address, { from: accounts[1] }).should.be.rejected;
        });

        describe('fee', function () {
            it('verifies the owner can update the fee', async function () {
                await this.converter.setConversionFee(30000);
                let conversionFee = await this.converter.conversionFee.call();
                conversionFee.should.be.bignumber.equal(30000);
            });

            it('verifies the manager can update the fee', async function () {
                await this.converter.transferManagement(accounts[4]);
                await this.converter.acceptManagement({ from: accounts[4] });

                await this.converter.setConversionFee(30000, { from: accounts[4] });
                let conversionFee = await this.converter.conversionFee.call();
                conversionFee.should.be.bignumber.equal(30000);
            });

            it('should throw when attempting to update the fee to an invalid value', async function () {
                await this.converter.setConversionFee(200001).should.be.rejected;
            });

            it('should throw when a non owner and non manager attempts to update the fee', async function () {
                await this.converter.setConversionFee(30000, { from: accounts[1] }).should.be.rejected;
            });

            it('verifies that getConversionFeeAmount returns the correct amount', async function () {
                await this.converter.setConversionFee(10000);
                let conversionFeeAmount = await this.converter.getConversionFeeAmount.call(500000);
                conversionFeeAmount.should.be.bignumber.equal(5000);
            });

            it('verifies that an event is fired when the owner update the fee', async function () {
                let watcher = this.converter.ConversionFeeUpdate();
                await this.converter.setConversionFee(30000);
                let events = await watcher.get();
                events[0].args._prevFee.valueOf().should.be.bignumber.equal(0);
                events[0].args._newFee.valueOf().should.be.bignumber.equal(30000);
            });

            it('verifies that an event is fired when the owner update the fee multiple times', async function () {
                let watcher = this.converter.ConversionFeeUpdate();
                let events;
                for (let i = 1; i <= 10; ++i) {
                    await this.converter.setConversionFee(10000 * i);
                    events = await watcher.get();
                    events[0].args._prevFee.valueOf().should.be.bignumber.equal(10000 * (i - 1));
                    events[0].args._newFee.valueOf().should.be.bignumber.equal(10000 * i);
                }
            });

            it('should not fire an event when attempting to update the fee to an invalid value', async function () {
                let watcher = this.converter.ConversionFeeUpdate();
                await this.converter.setConversionFee(200001).should.be.rejected;
                let events = await watcher.get();
                events.length.should.be.bignumber.equal(0);
            });

            it('should not fire an event when a non owner attempts to update the fee', async function () {
                let watcher = this.converter.ConversionFeeUpdate();
                await this.converter.setConversionFee(30000, { from: accounts[1] }).should.be.rejected;
                let events = await watcher.get();
                events.length.should.be.bignumber.equal(0);
            });
        });
    });

    describe('connectors', function () {
        beforeEach(async function () {
            this.converter = await BancorConverter.new(this.smartToken.address, this.converterExtensions.address, 0);
        });

        it('verifies the connector token count before / after adding a connector', async function () {
            let connectorTokenCount = await this.converter.connectorTokenCount.call();
            connectorTokenCount.should.be.bignumber.equal(0);
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false);
            connectorTokenCount = await this.converter.connectorTokenCount.call();
            connectorTokenCount.should.be.bignumber.equal(1);
        });

        it('verifies the convertible token count before / after adding a connector', async function () {
            let convertibleTokenCount = await this.converter.convertibleTokenCount.call();
            convertibleTokenCount.should.be.bignumber.equal(1);
            await this.converter.addConnector(this.connectorToken2.address, weight10Percent, false);
            convertibleTokenCount = await this.converter.convertibleTokenCount.call();
            convertibleTokenCount.should.be.bignumber.equal(2);
        });

        it('verifies the convertible token addresses', async function () {
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false);
            let convertibleTokenAddress = await this.converter.convertibleToken.call(0);
            convertibleTokenAddress.should.be.equal(this.smartToken.address);
            convertibleTokenAddress = await this.converter.convertibleToken.call(1);
            convertibleTokenAddress.should.be.equal(this.connectorToken.address);
        });

        it('verifies that 2 connectors are added correctly', async function () {
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false);
            let connector = await this.converter.connectors.call(this.connectorToken.address);
            verifyConnector(connector, true, true, weight10Percent, false, 0);
            await this.converter.addConnector(this.connectorToken2.address, 200000, false);
            connector = await this.converter.connectors.call(this.connectorToken2.address);
            verifyConnector(connector, true, true, 200000, false, 0);
        });

        it('should throw when a non owner attempts to add a connector', async function () {
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false, { from: accounts[1] }).should.be.rejected;
        });

        it('should throw when attempting to add a connector when the converter is active', async function () {
            this.smartToken.transferOwnership(this.converter.address);
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.rejected;
        });

        it('should throw when attempting to add a connector with invalid address', async function () {
            await this.converter.addConnector('0x0', weight10Percent, false).should.be.rejected;
        });

        it('should throw when attempting to add a connector with weight = 0', async function () {
            await this.converter.addConnector(this.connectorToken.address, 0, false).should.be.rejected;
        });

        it('should throw when attempting to add a connector with weight greater than 100%', async function () {
            await this.converter.addConnector(this.connectorToken.address, 1000001, false).should.be.rejected;
        });

        it('should throw when attempting to add the token as a connector', async function () {
            await this.converter.addConnector(this.smartToken.address, weight10Percent, false).should.be.rejected;
        });

        it('should throw when attempting to add the converter as a connector', async function () {
            await this.converter.addConnector(this.converter.address, weight10Percent, false).should.be.rejected;
        });

        it('should throw when attempting to add a connector that already exists', async function () {
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
            await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.rejected;
        });

        it('should throw when attempting to add multiple connectors with total weight greater than 100%', async function () {
            await this.converter.addConnector(this.connectorToken.address, 500000, false).should.be.fulfilled;
            await this.converter.addConnector(this.connectorToken2.address, 500001, false).should.be.rejected;
        });

        describe('update connector', function () {

            it('verifies that the owner can update a connector', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                let connector = await this.converter.connectors.call(this.connectorToken.address);
                verifyConnector(connector, true, true, weight10Percent, false, 0);
                await this.converter.updateConnector(this.connectorToken.address, 200000, true, 50);
                connector = await this.converter.connectors.call(this.connectorToken.address);
                verifyConnector(connector, true, true, 200000, true, 50);
            });

            it('should throw when a non owner attempts to update a connector', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                await this.converter.updateConnector(this.connectorToken.address, 200000, false, 0, { from: accounts[1] }).should.be.rejected;
            });

            it('should throw when attempting to update a connector that does not exist', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                await this.converter.updateConnector(this.connectorToken2.address, 200000, false, 0).should.be.rejected;
            });

            it('should throw when attempting to update a connector with weight = 0', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                await this.converter.updateConnector(this.connectorToken.address, 0, false, 0).should.be.rejected;
            });

            it('should throw when attempting to update a connector with weight greater than 100%', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                await this.converter.updateConnector(this.connectorToken.address, 1000001, false, 0).should.be.rejected;
            });

            it('should throw when attempting to update a connector that will result in total weight greater than 100%', async function () {
                await this.converter.addConnector(this.connectorToken.address, 500000, false).should.be.fulfilled;
                await this.converter.addConnector(this.connectorToken2.address, 400000, false).should.be.fulfilled;
                await this.converter.updateConnector(this.connectorToken2.address, 500001, false, 0).should.be.rejected;
            });
        });

        describe('disable / re-enable conversions', function () {
            it('verifies that the owner can disable / re-enable conversions', async function () {

                let conversionsEnabled = await this.converter.conversionsEnabled.call();
                conversionsEnabled.should.be.equal(true);

                await this.converter.disableConversions(true);
                conversionsEnabled = await this.converter.conversionsEnabled.call();
                conversionsEnabled.should.be.equal(false);

                await this.converter.disableConversions(false);
                conversionsEnabled = await this.converter.conversionsEnabled.call();
                conversionsEnabled.should.be.equal(true);
            });

            it('verifies that the manager can disable / re-enable conversions', async function () {
                await this.converter.transferManagement(accounts[4]);
                await this.converter.acceptManagement({ from: accounts[4] });

                let conversionsEnabled = await this.converter.conversionsEnabled.call();
                conversionsEnabled.should.be.equal(true);

                await this.converter.disableConversions(true, { from: accounts[4] });
                conversionsEnabled = await this.converter.conversionsEnabled.call();
                conversionsEnabled.should.be.equal(false);

                await this.converter.disableConversions(false, { from: accounts[4] });
                conversionsEnabled = await this.converter.conversionsEnabled.call();
                conversionsEnabled.should.be.equal(true);
            });

            it('should throw when a non owner attempts to disable conversions', async function () {
                await this.converter.disableConversions(true, { from: accounts[1] }).should.be.rejected;
            });
        });

        describe('disable / re-enable connector purchases', function () {
            it('verifies that the owner can disable / re-enable connector purchases', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                let connector = await this.converter.connectors.call(this.connectorToken.address);
                verifyConnector(connector, true, true, weight10Percent, false, 0);
                await this.converter.disableConnectorPurchases(this.connectorToken.address, true);
                connector = await this.converter.connectors.call(this.connectorToken.address);
                verifyConnector(connector, true, false, weight10Percent, false, 0);
                await this.converter.disableConnectorPurchases(this.connectorToken.address, false);
                connector = await this.converter.connectors.call(this.connectorToken.address);
                verifyConnector(connector, true, true, weight10Percent, false, 0);
            });
    
            it('should throw when a non owner attempts to disable connector purchases', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                await this.converter.disableConnectorPurchases(this.connectorToken.address, true, { from: accounts[1] }).should.be.rejected;
            });
    
            it('should throw when attempting to disable connector purchases for a connector that does not exist', async function () {
                await this.converter.addConnector(this.connectorToken.address, weight10Percent, false).should.be.fulfilled;
                await this.converter.disableConnectorPurchases(this.connectorToken2.address, true).should.be.rejected;
            });
        });
    });
});