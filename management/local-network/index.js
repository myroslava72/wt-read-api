const { deployHotelIndex,
  deployFullHotel } = require('./hotels');
const { deployAirlineIndex,
  deployFullAirline } = require('./airlines');
const {
  deployCuratedListTrustClue } = require('./trust-clues');

module.exports = {
  deployHotelIndex,
  deployFullHotel,
  deployAirlineIndex,
  deployFullAirline,
  deployCuratedListTrustClue,
};
