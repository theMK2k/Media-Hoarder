const assert = require("node:assert/strict");
const { describe, test } = require("node:test");
const helpers = require("./helpers.js");

describe("getSeriesEpisodeSeasonAndEpisodeNumbersFromName", () => {
  test("parse 'My Series S01E01'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S01E01"), {
      $Series_Season: 1,
      $Series_Episodes_First: 1,
      $Series_Episodes_Complete: [1],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S01E01 Some Episode Name 1337'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S01E01"), {
      $Series_Season: 1,
      $Series_Episodes_First: 1,
      $Series_Episodes_Complete: [1],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S01E01E02E05'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S01E01E02E05"), {
      $Series_Season: 1,
      $Series_Episodes_First: 1,
      $Series_Episodes_Complete: [1, 2, 5],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S05E03-E06'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S05E03-E06"), {
      $Series_Season: 5,
      $Series_Episodes_First: 3,
      $Series_Episodes_Complete: [3, 4, 5, 6],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S5E3-6'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S5E3-6"), {
      $Series_Season: 5,
      $Series_Episodes_First: 3,
      $Series_Episodes_Complete: [3, 4, 5, 6],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series E004'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series E004"), {
      $Series_Season: 1,
      $Series_Episodes_First: 4,
      $Series_Episodes_Complete: [4],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series Ep07'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series Ep07"), {
      $Series_Season: 1,
      $Series_Episodes_First: 7,
      $Series_Episodes_Complete: [7],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series 9x6'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series 9x6"), {
      $Series_Season: 9,
      $Series_Episodes_First: 6,
      $Series_Episodes_Complete: [6],
      $Series_Bonus_Number: null,
    });
  });

  test("parse 'My Series S03B02'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series S03B02"), {
      $Series_Season: 3,
      $Series_Episodes_First: null,
      $Series_Episodes_Complete: null,
      $Series_Bonus_Number: 2,
    });
  });

  test("parse 'My Series B05'", () => {
    assert.deepEqual(helpers.getSeriesEpisodeSeasonAndEpisodeNumbersFromName("My Series B05"), {
      $Series_Season: 1,
      $Series_Episodes_First: null,
      $Series_Episodes_Complete: null,
      $Series_Bonus_Number: 5,
    });
  });
});

describe("compare", () => {
  test("compare null with null", () => {
    assert.equal(helpers.compare(null, null), 0);
  });
  test("compare undefined with null", () => {
    assert.equal(helpers.compare(undefined, null), 0);
  });
  test("compare 123 with null", () => {
    assert.equal(helpers.compare(123, null), 1);
  });
  test("compare 123 with null (reverse)", () => {
    assert.equal(helpers.compare(123, null, true), -1);
  });
});
