const {
  deployHotelIndex,
  deployFullHotel
} = require('./hotels');
const {
  deployAirlineIndex,
  deployFullAirline
} = require('./airlines');
const {
  deployCuratedListTrustClue,
  deployLifDepositTrustClue
} = require('./trust-clues');

module.exports = {
  deployHotelIndex,
  deployFullHotel,
  deployAirlineIndex,
  deployFullAirline,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
};
