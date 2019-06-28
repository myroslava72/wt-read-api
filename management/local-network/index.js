const {
  deployFullHotel,
} = require('./hotels');
const {
  deployFullAirline,
} = require('./airlines');
const {
  deployLifToken,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
} = require('./trust-clues');
const {
  deployHotelApp,
  deployAirlineApp,
} = require('./utils');

module.exports = {
  deployFullHotel,
  deployFullAirline,
  deployLifToken,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
  deployHotelApp,
  deployAirlineApp,
};
