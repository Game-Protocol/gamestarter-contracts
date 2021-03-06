# Game Protocol Contracts

Game Protocol crowdsale and token contracts, using OpenZeppelin v1.12.0

## Testing

- truffle : v4.1.14
- solidity : v0.4.24
- ganache-cli : v6.1.0
- ganache : v1.2.1

To run test

```sol
npm test
```

## Deploying

Migrate single deploy file

```sh
truffle migrate --network ropsten -f 3 --to 3 --reset
```

## Game Starter

GameStarter is a one-stop crowdfunding platform based on the blockchain for new game projects.

## Short Use Case

1. Initial registration and verification.
   - Registeration of the game/company on the GameStarter section of the website.
   - Verification of the account by the Game Protocol team.
2. Deployment of contracts.
   - Deployment of the token for the project after the creator selects the token type and fills in the required constructor parameters.
   - Deployment of the crowdsale contract for the token.
   - Add Connector to the GXT converter with the newly created token.
3. After the end of the crowdsale, as we finalize the crowdsale, funds will be transfered from the crowdsale to the connector liquidity pool so the token could be converted with GXT and all other Bancor platform tokens.

## Sequence of events

1. Deploy GXToken - `params=()`
2. Deploy GXTCrowdsale - `params=(openTime, closeTime, rate, wallet, gameSupport, bounty, advisors, team, token)`
3. Deploy Converter - `params=(GXToken, IBancorConverterExtensions, _maxConversionFee)`
4. Deploy GameStarterFactory - `params=(GXToken, Converter, feeWallet)`

5. For every new game, call createGame function from GameStarterFactory - params=(owner, tokenName, tokenSymbol, openTime, closeTime, rate) inside the function the following will happen:
   - Deploy SubToken - `params=(tokenName, tokenSymbol)`
   - Deploy Crowdsale for the sub token - `params=(openTime, closeTime, rate, owner, feeWallet, SubToken)`
   - Call addConnector function in Convertor - `params=(SubToken, weight, enableVirtualBalance)`
   - Call updateConnector function in Convertor - `params=(SubToken, weight, enableVirtualBalance, virtualBalance)`

## Tokens Graph

![tokens_graph](images/tokens_graph.svg)

## Crowdsale contract types

1. Basic crowdsale will be mintable and refundable.
2. Bonus crowdsale will add to the Basic crowdsale bonuses depending on the time invested.
3. ...

## Deploying website - front checklist

- Run ganache cli or client - `ganache-cli --defaultBalanceEther 1000000`
- Open metamsk and make sure the chain is local and balance is correct
- Migrate contract to local chain - `truffle migrate --reset`
- Symlink the build to front/src - `cd front/src/build && ln -s ../../../build/contracts contracts && cd ../../..`
- Run website - `npm start`
