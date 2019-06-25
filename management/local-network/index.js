const {
  deployHotelDirectory,
  deployFullHotel,
} = require('./hotels');
const {
  deployAirlineDirectory,
  deployFullAirline,
} = require('./airlines');
const {
  deployLifToken,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
} = require('./trust-clues');

module.exports = {
  deployHotelDirectory,
  deployFullHotel,
  deployAirlineDirectory,
  deployFullAirline,
  deployLifToken,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
};
