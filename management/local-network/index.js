const {
  deployHotelIndex,
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
  deployHotelIndex,
  deployFullHotel,
  deployAirlineDirectory,
  deployFullAirline,
  deployLifToken,
  deployCuratedListTrustClue,
  deployLifDepositTrustClue,
};
