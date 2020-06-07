exports.Servers = {
  INTERNATIONAL: {
    amqp: 'api.chatwars.me:5673',
    kafka: 'digest-api.chtwrs.com:9092',
    topicPrefix: 'cw2-'
  },
  CW3: {
    amqp: 'api.chtwrs.com:5673',
    kafka: 'digest-api.chtwrs.com:9092',
    topicPrefix: 'cw3-'
  }
}

exports.Topics = {
  AUCTION: 'au_digest',
  DEALS: 'deals',
  DUELS: 'duels',
  OFFERS: 'offers',
  SEX: 'sex_digest',
  YP: 'yellow_pages'
}

exports.Actions = {
  AUTH: 'createAuthCode',
  GRANT: 'grantToken',
  AUTH_ADDITIONAL: 'authAdditionalOperation',
  GRANT_ADDITIONAL: 'grantAdditionalOperation',
  AUTH_PAYMENT: 'authorizePayment',
  PAY: 'pay',
  PAYOUT: 'payout',
  BASIC: 'requestBasicInfo',
  PROFILE: 'requestProfile',
  STOCK: 'requestStock',
  GEAR: 'requestGearInfo',
  CRAFTBOOK: 'viewCraftbook',
  GUILD: 'guildInfo',
  WTB: 'wantToBuy',
  APP: 'getInfo'
}

exports.Operations = {
  BASIC: 'GetBasicInfo',
  PROFILE: 'GetUserProfile',
  STOCK: 'GetStock',
  GEAR: 'GetGearInfo',
  CRAFTBOOK: 'ViewCraftbook',
  GUILD: 'GuildInfo',
  TRADE: 'TradeTerminal'
}

exports.Results = {
  // Everything is Ok
  OK: 'Ok',
  // Amount is either less than or equal to zero
  BAD_AMOUNT: 'BadAmount',
  // The currency you specified is not permitted to be used in this request
  BAD_CURRENCY: 'BadCurrency',
  // Message format is bad. It could be an invalid javascript, or types are wrong, or not all fields are sane
  BAD_FORMAT: 'BadFormat',
  // The action you have requested is absent. Check spelling
  WRONG_ACTION: 'ActionNotFound',
  // UserID is wrong, or user became inactive
  WRONG_USER_ID: 'NoSuchUser',
  // Your app is not yet registered. You must request access to this feature separately
  NOT_REGISTERED: 'NotRegistered',
  // Authorization code is incorrect
  INVALID_CODE: 'InvalidCode',
  // Requested operation not exists
  WRONG_OPERATION: 'NoSuchOperation',
  // Try again if we have some technical difficulties, or bug and are willing for you to repeat request
  TRY_AGAIN: 'TryAgain',
  // Some field of transaction is bad or confirmation code is wrong
  AUTHORIZATION_FAILED: 'AuthorizationFailed',
  // The player or application balance is insufficient
  INSUFFICIENT_FUNDS: 'InsufficientFunds',
  // The player is not a high enough level to do this action
  LEVEL_IS_LOW: 'LevelIsLow',
  // The player is not in implied guild
  NOT_IN_GUILD: 'NotInGuild',
  // No such token, might be revoked?
  INVALID_TOKEN: 'InvalidToken',
  // Your app has no rights to execute this action with this token
  FORBIDDEN: 'Forbidden',
  // There are no offers on the market or the price is too low. Are you sure you need the `exactPrice` parameter?
  NO_OFFERS: 'NoOffersFoundByPrice',
  // The player is busy with something that prevents him to execute requested action
  USER_IS_BUSY: 'UserIsBusy',
  // If you look at the clock there are only a few minutes left before the battle
  BATTLE_IS_NEAR: 'BattleIsNear'
}
