const helpers = require("./helpers");

describe("getSeriesEpisodeSeasonAndEpisodeNumbersFromName", () => {
  test("parse 'My Series S01E01'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S01E01")).toEqual({
      $Series_Season: 1,
      $Series_Episodes_First: 1,
      $Series_Episodes_Complete: [1],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S01E01 Some Episode Name 1337'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S01E01")).toEqual({
      $Series_Season: 1,
      $Series_Episodes_First: 1,
      $Series_Episodes_Complete: [1],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S01E01E02E05'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S01E01E02E05")).toEqual({
      $Series_Season: 1,
      $Series_Episodes_First: 1,
      $Series_Episodes_Complete: [1, 2, 5],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S05E03-E06'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S05E03-E06")).toEqual({
      $Series_Season: 5,
      $Series_Episodes_First: 3,
      $Series_Episodes_Complete: [3, 4, 5, 6],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S5E3-6'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S5E3-6")).toEqual({
      $Series_Season: 5,
      $Series_Episodes_First: 3,
      $Series_Episodes_Complete: [3, 4, 5, 6],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series E004'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series E004")).toEqual({
      $Series_Season: 1,
      $Series_Episodes_First: 4,
      $Series_Episodes_Complete: [4],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series Ep07'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series Ep07")).toEqual({
      $Series_Season: 1,
      $Series_Episodes_First: 7,
      $Series_Episodes_Complete: [7],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series 9x6'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series 9x6")).toEqual({
      $Series_Season: 9,
      $Series_Episodes_First: 6,
      $Series_Episodes_Complete: [6],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S03B02'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S03B02")).toEqual({
      $Series_Season: 3,
      $Series_Episodes_First: null,
      $Series_Episodes_Complete: null,
      $Series_Bonus_Number: 2,
    });
  });

  test("parse 'My Series B05'", () => {
    expect(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series B05")).toEqual({
      $Series_Season: 1,
      $Series_Episodes_First: null,
      $Series_Episodes_Complete: null,
      $Series_Bonus_Number: 5,
    });
  });
});
