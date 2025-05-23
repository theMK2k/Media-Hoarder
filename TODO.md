# TODO

- [WIP] fix #90 Settings | Scan History graph shows 1970 date

- [ ] DB Backup

  - [ ] Settings:
    - [ ] set backup interval (every X scans, default = 5)
    - [ ] set retention volume (default = 3 db copies)
    - [ ] use data/backups folder to store the files

- [ ] Delete/Remove Media

  - provide choice between "Delete the media" and "Remove from library"

- [ ] VACUUM after scan

- [ ] create a top-list scoring
  - see https://chatgpt.com/c/680d6f2e-7be8-8012-9fcc-ee3b839a892e
  - https://help.imdb.com/article/imdb/featured-content/why-doesn-t-a-title-with-the-average-user-vote-of-9-4-appear-in-your-top-250-movies-or-tv-list/GTU67Q5QQ8W53RJT#

```text
      (WR) = (v ÷ (v+m)) × R + (m ÷ (v+m)) × C
    where:

        R = average for the movie (mean) = (Rating)
        v = number of votes for the movie = (votes)
        m = minimum votes required to be listed in the Top 250 (currently 25000)
        C = the mean vote across the whole report (currently 7.1)
```

- [ ] Scraper: scrapeIMDBCompaniesDataV3 - use the page to identify the categories (e.g. <https://www.imdb.com/title/tt0095327/companycredits/>)

- [ ] Scraper - Fix Trailer URL expectation

- [ ] BUG: "filter by this Language" does not work

- [ ] sidebar filters: a button per item to open the filter dialog (e.g. My Lists - SciFi Classics)

- [ ] series card doesn't show all release attributes (e.g. it should show "BD, WEB", but only shows "WEB" - see House of the Dragon)

- [ ] BUG: with a multi-episode, when clicking the episode in the IMDB Rating Dialog, the episode is opened multiple times (see: Star Trek Prodigy S01E01-E02)

- [ ] Episodes Heatmap:

  - [x] highlight watched episodes with a discreet background pattern
  - [x] highlight season and episode "headers" when hovering over the heatmap

- [ ] series episodes list
  - [ ] when sort by season and episode, provide button to scroll to last watched episode
  - [ ] highlight watched episodes, maybe highlight last watched episode differently as well

## Road to automatic sha256 calculation

see: data/devdocs/auto_sha256_graphql

### Example: Find Page Search

In Browser: <https://www.imdb.com/find/?q=the>

JS File: `find-f552dc800eee441e.js`

Operation Name: `FindPageSearch`

SHA: 038ff5315025edc006d874aa81178b17335fcae8fecc25bf7c2ce3f1b8085b60

In JS file:

```js
(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [3190],
  {
    45218: function (e, t) {
      "use strict";
      (t.t = self.atob.bind(self)), (t.r = self.btoa.bind(self));
    },
    94195: function (e, t, a) {
      (window.__NEXT_P = window.__NEXT_P || []).push([
        "/find",
        function () {
          return a(14399);
        },
      ]);
    },
    24667: function (e, t, a) {
      "use strict";
      a.d(t, {
        Ji: function () {
          return h;
        },
        BK: function () {
          return g;
        },
        vU: function () {
          return m;
        },
      });
      var s,
        i,
        r,
        n,
        l = a(2784),
        o = a(37213),
        c = a(84486),
        d = function (e, t) {
          var a = {};
          for (var s in e) Object.prototype.hasOwnProperty.call(e, s) && 0 > t.indexOf(s) && (a[s] = e[s]);
          if (null != e && "function" == typeof Object.getOwnPropertySymbols)
            for (var i = 0, s = Object.getOwnPropertySymbols(e); i < s.length; i++)
              0 > t.indexOf(s[i]) && Object.prototype.propertyIsEnumerable.call(e, s[i]) && (a[s[i]] = e[s[i]]);
          return a;
        };
      function p(e) {
        let t = (t) =>
          l.createElement(c._y.Consumer, null, (a) => {
            (0, o.lq)(a);
            let { value: s, children: i } = t,
              r = d(t, ["value", "children"]),
              n = "string" == typeof s ? new Date(s || 0) : s;
            return i("formatDate" === e ? a.formatDateToParts(n, r) : a.formatTimeToParts(n, r));
          });
        return (t.displayName = n[e]), t;
      }
      function u(e) {
        let t = (t) =>
          l.createElement(c._y.Consumer, null, (a) => {
            (0, o.lq)(a);
            let { value: s, children: i } = t,
              r = d(t, ["value", "children"]),
              n = a[e](s, r);
            if ("function" == typeof i) return i(n);
            let c = a.textComponent || l.Fragment;
            return l.createElement(c, null, n);
          });
        return (t.displayName = r[e]), t;
      }
      function m(e) {
        return e;
      }
      ((s = r || (r = {})).formatDate = "FormattedDate"),
        (s.formatTime = "FormattedTime"),
        (s.formatNumber = "FormattedNumber"),
        (s.formatList = "FormattedList"),
        (s.formatDisplayName = "FormattedDisplayName"),
        ((i = n || (n = {})).formatDate = "FormattedDateParts"),
        (i.formatTime = "FormattedTimeParts"),
        (i.formatNumber = "FormattedNumberParts"),
        (i.formatList = "FormattedListParts");
      let h = u("formatDate");
      u("formatTime");
      let g = u("formatNumber");
      u("formatList"), u("formatDisplayName"), p("formatDate"), p("formatTime");
    },
    51831: function (e, t, a) {
      "use strict";
      a.d(t, {
        _: function () {
          return r;
        },
      });
      var s = a(19596),
        i = a(91842);
      let r = s.default.div.withConfig({ componentId: "sc-f2e21260-0" })(
        [
          "align-items:center;justify-content:center;",
          "{padding-left:",
          ";}",
          "{padding-left:",
          ";}",
          "{padding-top:var(--ipc-pageSection-bottomMargin);}",
        ],
        i.mediaQueries.breakpoints.only.l,
        i.spacing.xs,
        i.mediaQueries.breakpoints.only.xl,
        i.spacing.s,
        i.mediaQueries.breakpoints.below.l
      );
    },
    14399: function (e, t, a) {
      "use strict";
      a.r(t),
        a.d(t, {
          __N_SSP: function () {
            return eJ;
          },
          default: function () {
            return eQ;
          },
        });
      var s = a(52322),
        i = a(2784),
        r = a(25436),
        n = a(88023),
        l = a(66898),
        o = a(19596),
        c = a(45103),
        d = a(51831),
        p = a(78597),
        u = a(98754),
        m = a(20780),
        h = a(83128),
        g = a(80978);
      function f(e) {
        return !e.searchTerm.trim();
      }
      var y = a(42951),
        x = a(91842),
        T = a(28827),
        _ = a(94098),
        C = a(51250),
        M = a(45218);
      let P = { [_.$G]: !1 },
        S = new Date(864e13),
        b = {
          getFromHeader(e) {
            let t = (0, C.rZ)(_.PX, e);
            return t ? JSON.parse((0, M.t)(t)) : P;
          },
          getFromDocument() {
            let e = (0, C.ZG)(_.PX);
            return e ? JSON.parse((0, M.t)(e)) : P;
          },
          setOnDocument(e) {
            (0, C.Ys)(_.PX, (0, M.r)(JSON.stringify(e)), S, "shared");
          },
        },
        N = {
          get: (e) => !!b.getFromHeader(e)[_.$G],
          set(e) {
            let t = b.getFromDocument();
            (t[_.$G] = e), b.setOnDocument(t);
          },
        };
      var E = a(25592),
        v = a(72814),
        j = a(2597),
        w = a(13433),
        I = a(30382),
        L = a.n(I);
      let k = L()`
    fragment CompanyResult on Company {
        __typename
        id
        companyText {
            text
        }
        companyTypes(limit: 1) {
            text
        }
        country {
            text
        }
    }
`,
        R = L()`
    fragment KeywordResult on Keyword {
        __typename
        id
        text {
            text
        }
        titles(first: 1) {
            total
        }
    }
`,
        A = L()`
    fragment NameResult on Name {
        __typename
        id
        nameText {
            text
        }
        disambiguator {
            text
        }
        primaryImage {
            url
            height
            width
            caption {
                plainText
            }
        }
        akas(first: 10) {
            edges {
                node {
                    displayableProperty {
                        value {
                            plainText
                        }
                    }
                }
            }
        }
        nickNames(limit: 10) {
            displayableProperty {
                value {
                    plainText
                }
            }
        }
        knownFor(first: 1) {
            edges {
                node {
                    title {
                        titleText {
                            text
                        }
                        originalTitleText {
                            text
                        }
                        releaseYear {
                            year
                            endYear
                        }
                        titleType {
                            id
                            text
                            canHaveEpisodes
                        }
                    }
                    summary {
                        principalCategory {
                            text
                        }
                    }
                }
            }
        }
    }
`,
        O = L()`
    fragment TitleResult on Title {
        __typename
        id
        meta {
            canonicalId
            publicationStatus
        }
        titleType {
            id
            canHaveEpisodes
            displayableProperty {
                value {
                    plainText
                }
            }
        }
        titleText {
            text
        }
        originalTitleText {
            text
        }
        releaseYear {
            year
            endYear
        }
        primaryImage {
            url
            height
            width
            caption {
                plainText
            }
        }
        principalCredits(filter: { categories: ["cast"] }) {
            credits {
                name {
                    nameText {
                        text
                    }
                }
            }
        }
        series {
            series {
                id
                titleText {
                    text
                }
                originalTitleText {
                    text
                }
                releaseYear {
                    year
                    endYear
                }
                titleType {
                    id
                    canHaveEpisodes
                    displayableProperty {
                        value {
                            plainText
                        }
                    }
                }
            }
            displayableEpisodeNumber {
                displayableSeason {
                    displayableProperty {
                        value {
                            plainText
                        }
                    }
                }
                episodeNumber {
                    displayableProperty {
                        value {
                            plainText
                        }
                    }
                }
            }
        }
    }
`,
        D = L()`
    fragment InterestResult on Interest {
        __typename
        id
        primaryText {
            text
        }
        secondaryText {
            text
        }
        primaryImage {
            url
            height
            width
            caption {
                plainText
            }
        }
    }
`,
        V = L()`
    query FindPageSearch(
        $skipHasExact: Boolean!
        $numResults: Int!
        $searchTerm: String!
        $includeAdult: Boolean!
        $isExactMatch: Boolean!
        $typeFilter: [MainSearchType!]
        $titleSearchOptions: TitleSearchOptions
        $after: String
    ) {
        results: mainSearch(
            first: $numResults
            after: $after
            options: {
                searchTerm: $searchTerm
                type: $typeFilter
                includeAdult: $includeAdult
                isExactMatch: $isExactMatch
                titleSearchOptions: $titleSearchOptions
            }
        ) {
            edges {
                node {
                    entity {
                        ... on Company {
                            ...CompanyResult
                        }
                        ... on Keyword {
                            ...KeywordResult
                        }
                        ... on Interest {
                            ...InterestResult
                        }
                        ... on Name {
                            ...NameResult
                        }
                        ... on Title {
                            ...TitleResult
                        }
                    }
                }
            }
            pageInfo {
                hasNextPage
                endCursor
            }
        }
        hasExact: mainSearch(
            first: 1
            options: {
                searchTerm: $searchTerm
                type: $typeFilter
                includeAdult: $includeAdult
                isExactMatch: true
                titleSearchOptions: $titleSearchOptions
            }
        ) {
            edges @skip(if: $skipHasExact) {
                node {
                    entity {
                        __typename
                    }
                }
            }
        }
    }
    ${k}
    ${D}
    ${R}
    ${A}
    ${O}
`;
      L()`
    query FindPageOrdering(
        $searchTerm: String!
        $includeAdult: Boolean!
        $isExactMatch: Boolean!
    ) {
        mainSearch(
            first: 1
            options: {
                searchTerm: $searchTerm
                type: [TITLE, NAME, INTEREST]
                includeAdult: $includeAdult
                isExactMatch: $isExactMatch
            }
        ) {
            edges {
                node {
                    entity {
                        __typename
                    }
                }
            }
        }
    }
`;
      let $ = (e) => {
          let { skipHasExact: t, typeFilter: a, findPageMeta: s, numResults: i, nextCursor: r } = e;
          return {
            query: V,
            variables: {
              skipHasExact: t,
              numResults: i,
              searchTerm: s.searchTerm,
              typeFilter: a,
              includeAdult: s.includeAdult,
              isExactMatch: s.isExactMatch,
              after: r,
              titleSearchOptions: s.titleSearchType ? { type: s.titleSearchType } : void 0,
            },
            context: { personalized: !1, serverSideCacheable: !0 },
          };
        },
        F = {
          [w.lg.Title]: "tt",
          [w.lg.Name]: "nm",
          [w.lg.Keyword]: "kw",
          [w.lg.Company]: "co",
          [w.lg.Interest]: "in",
        },
        q = {
          [w.Py.Movie]: "ft",
          [w.Py.Tv]: "tv",
          [w.Py.TvEpisode]: "ep",
          [w.Py.PodcastSeries]: "ps",
          [w.Py.PodcastEpisode]: "pe",
          [w.Py.MusicVideo]: "mu",
          [w.Py.VideoGame]: "vg",
        },
        K = (e) => {
          let t = { q: e.searchTerm };
          return (
            e.searchType && (t.s = F[e.searchType]),
            e.searchType === w.lg.Title && e.titleSearchType && (t.ttype = e.titleSearchType.map((e) => q[e])),
            e.isExactMatch && (t.exact = "true"),
            t
          );
        };
      var B = a(78187),
        H = a(64101),
        G = a(50926);
      let Y = (e) => {
          let { data: t, requestContext: a, findPageMeta: s } = e,
            i = { results: [] },
            r = t.results;
          return (
            r?.edges &&
              (i.results = r.edges.map((e) => {
                let {
                  node: { entity: t },
                } = e;
                switch (t.__typename) {
                  case "Company":
                    return {
                      id: t.id,
                      companyName: t.companyText?.text || "",
                      countryText: t.country?.text,
                      typeText: t.companyTypes?.length && t.companyTypes[0].text,
                    };
                  case "Interest":
                    return {
                      id: t.id,
                      imageType: "none",
                      interestPosterImageModel: (0, G.ff)({
                        caption: t.primaryImage?.caption?.plainText || void 0,
                        height: t.primaryImage?.height || void 0,
                        width: t.primaryImage?.width || void 0,
                        url: t.primaryImage?.url || void 0,
                      }),
                      primaryText: t.primaryText?.text || void 0,
                      secondaryText: t.secondaryText?.text || void 0,
                    };
                  case "Keyword":
                    return {
                      id: t.id,
                      keywordText: t.text?.text || "",
                      numTitles: t.titles?.total || 0,
                    };
                  case "Name":
                    return {
                      id: t.id,
                      displayNameText: t.nameText?.text,
                      knownForJobCategory:
                        t.knownFor?.edges.length && t.knownFor.edges[0].node.summary.principalCategory.text,
                      knownForTitleText:
                        t.knownFor?.edges.length &&
                        (0, H.L)(
                          a,
                          t.knownFor?.edges[0].node.title.originalTitleText,
                          t.knownFor?.edges[0].node.title.titleText
                        ),
                      knownForTitleYear:
                        t.knownFor?.edges.length &&
                        (0, B.y)(
                          t.knownFor?.edges[0].node.title.releaseYear,
                          t.knownFor?.edges[0].node.title.titleType?.canHaveEpisodes
                        ),
                      akaName: t.akas?.edges
                        .map((e) => e.node.displayableProperty.value.plainText)
                        .concat(t.nickNames?.map((e) => e.displayableProperty.value.plainText))
                        .filter(
                          (e) =>
                            e?.toLowerCase().includes(s.searchTerm) &&
                            !t.nameText?.text.toLowerCase().includes(s.searchTerm)
                        )
                        .shift(),
                      avatarImageModel: (0, G.ff)({
                        caption: t.primaryImage?.caption?.plainText || void 0,
                        height: t.primaryImage?.height || void 0,
                        width: t.primaryImage?.width || void 0,
                        url: t.primaryImage?.url || void 0,
                      }),
                    };
                  case "Title":
                    let i = [];
                    for (let e of t.principalCredits ?? [])
                      for (let t of e.credits) t.name?.nameText?.text && i.push(t.name.nameText.text);
                    return {
                      id: t.id,
                      titleNameText: (0, H.L)(a, t.originalTitleText, t.titleText),
                      titleReleaseText: (0, B.y)(t.releaseYear, t.titleType?.canHaveEpisodes),
                      titleTypeText: t.titleType?.displayableProperty.value.plainText,
                      titlePosterImageModel: (0, G.ff)({
                        caption: t.primaryImage?.caption?.plainText || void 0,
                        height: t.primaryImage?.height || void 0,
                        width: t.primaryImage?.width || void 0,
                        url: t.primaryImage?.url || void 0,
                      }),
                      seriesId: t.series?.series.id,
                      seriesNameText: (0, H.L)(a, t.series?.series.originalTitleText, t.series?.series.titleText),
                      seriesReleaseText: (0, B.y)(
                        t.series?.series.releaseYear,
                        t.series?.series.titleType?.canHaveEpisodes
                      ),
                      seriesTypeText: t.series?.series.titleType?.displayableProperty.value.plainText,
                      seriesSeasonText:
                        t.series?.displayableEpisodeNumber.displayableSeason.displayableProperty.value.plainText,
                      seriesEpisodeText:
                        t.series?.displayableEpisodeNumber.episodeNumber.displayableProperty.value.plainText,
                      topCredits: i.slice(0, 2),
                      imageType: t.titleType?.id,
                    };
                }
              })),
            r?.pageInfo.hasNextPage && r?.pageInfo.endCursor && (i.nextCursor = r.pageInfo.endCursor),
            t.hasExact?.edges && (i.hasExactMatches = t.hasExact.edges.length > 0),
            i
          );
        },
        U = o.default.div.withConfig({ componentId: "sc-9a8b3183-0" })(
          ["display:flex;flex-direction:row;gap:", ";padding:0;", " ", " ", " ", ""],
          x.pageMargin.xs,
          (0, x.setPropertyToSpacingVar)("padding-left", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("padding-right", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("padding-top", "ipt-pageMargin"),
          (0, x.setPropertyToColorVar)("color", "ipt-on-base-textSecondary-color")
        ),
        W = (0, o.default)(c.ChipList).withConfig({
          componentId: "sc-9a8b3183-1",
        })(
          ["padding:0;", " ", ""],
          (0, x.setPropertyToSpacingVar)("padding-left", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("padding-right", "ipt-pageMargin")
        ),
        J = (0, o.default)(c.PageSection).withConfig({
          componentId: "sc-9a8b3183-2",
        })(
          ["", " ", ""],
          (0, x.setPropertyToSpacingVar)("padding-left", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("padding-right", "ipt-pageMargin")
        ),
        Q = (e) => {
          let { findPageMeta: t, isLoggedIn: a } = e,
            i = (0, j.b)(),
            r = (0, j.b)(),
            {
              findLinkBuilder: n,
              interestAllLinkBuilder: l,
              registrationSignInLinkBuilder: o,
              searchCommonLinkBuilder: d,
              searchKeywordLinkBuilder: p,
              searchNameLinkBuilder: u,
              searchTitleLinkBuilder: m,
            } = (0, E.WO)(),
            h = (0, T.N)({
              id: "search_main_include_adult_login_link_text",
              defaultMessage: "Sign in to enable adult matches",
            }),
            g = (0, T.N)({
              id: "search_main_include_adult_enable_link_text",
              defaultMessage: "Enable adult matches",
            }),
            y = (0, T.N)({
              id: "search_main_include_adult_disable_link_text",
              defaultMessage: "Disable adult matches",
            }),
            x = n({ query: K(t), refSuffix: v.Cd.DISABLE_ADULT_MATCH }),
            _ = n({ query: K(t), refSuffix: v.Cd.ENABLE_ADULT_MATCH });
          return (0, s.jsxs)(s.Fragment, {
            children: [
              (0, s.jsxs)(c.PageSection, {
                "data-testid": "advanced-search-section",
                children: [
                  (0, s.jsx)(c.SectionTitle, {
                    description: (0, T.N)({
                      id: "search_main_advanced_search_section_title_description",
                      defaultMessage: "Create a more specific search using a variety of options and filters",
                    }),
                    children: (0, T.N)({
                      id: "search_main_advanced_search_section_title",
                      defaultMessage: "Advanced search",
                    }),
                  }),
                  (0, s.jsxs)(W, {
                    wrap: !0,
                    children: [
                      (0, s.jsx)(c.Chip, {
                        "data-testid": "advanced-search-chip-tt",
                        label: (0, T.N)({
                          id: "search_main_advanced_search_chip_tt",
                          defaultMessage: "Movies, TV & more",
                        }),
                        href: m({
                          refSuffix: [v.Cd.ADVANCED_SEARCH_RESULT, v.Cd.TITLE],
                        }),
                      }),
                      (0, s.jsx)(c.Chip, {
                        "data-testid": "advanced-search-chip-nm",
                        label: (0, T.N)({
                          id: "common_people",
                          defaultMessage: "People",
                        }),
                        href: u({
                          refSuffix: [v.Cd.ADVANCED_SEARCH_RESULT, v.Cd.NAME],
                        }),
                      }),
                      (0, s.jsx)(c.Chip, {
                        "data-testid": "advanced-search-chip-co",
                        label: (0, T.N)({
                          id: "common_collaborations",
                          defaultMessage: "Collaborations",
                        }),
                        href: d({
                          refSuffix: [v.Cd.ADVANCED_SEARCH_RESULT, v.Cd.COMMON],
                        }),
                      }),
                    ],
                  }),
                  (0, s.jsxs)(U, {
                    children: [
                      (0, s.jsx)("span", {
                        children: (0, T.N)({
                          id: "search_main_advanced_search_browse_header",
                          defaultMessage: "Browse",
                        }),
                      }),
                      (0, s.jsxs)(c.InlineList, {
                        showDividers: !0,
                        children: [
                          (0, s.jsx)(c.InlineListItem, {
                            children: (0, s.jsx)(c.TextLink, {
                              "data-testid": "advanced-search-link-genres",
                              href: l({
                                refSuffix: [v.Cd.ADVANCED_SEARCH_RESULT, v.Cd.GENRE],
                              }),
                              text: (0, T.N)({
                                id: "search_main_advanced_search_browse_genres_link_text",
                                defaultMessage: "Genres",
                              }),
                            }),
                          }),
                          (0, s.jsx)(c.InlineListItem, {
                            children: (0, s.jsx)(c.TextLink, {
                              "data-testid": "advanced-search-link-keywords",
                              href: p({
                                refSuffix: [v.Cd.ADVANCED_SEARCH_RESULT, v.Cd.KEYWORDS],
                              }),
                              text: (0, T.N)({
                                id: "search_main_advanced_search_browse_keywords_link_text",
                                defaultMessage: "Keywords",
                              }),
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              !f(t) &&
                (0, s.jsx)(J, {
                  children:
                    t.includeAdult && a
                      ? (0, s.jsx)(c.TextLink, {
                          "data-testid": "disable-include-adult-link",
                          text: y,
                          href: x,
                          onClick: (e) => {
                            e.preventDefault(), N.set(!1), r({ action: "fn-mature-disable" }), (location.href = x);
                          },
                        })
                      : (0, s.jsx)(c.TextLink, {
                          "data-testid": "enable-include-adult-link",
                          text: a ? g : h,
                          href: a ? _ : o({ refSuffix: v.Cd.ADULT, query: { u: _ } }),
                          onClick: (e) => {
                            a &&
                              (e.preventDefault(), N.set(!0), i({ action: "fn-mature-enable" }), (location.href = _));
                          },
                        }),
                }),
            ],
          });
        };
      var Z = a(51893);
      let z = (e) => {
        let { id: t, companyName: a, hasSearchType: i, index: r, countryText: n, typeText: l, className: o } = e,
          { searchTitleLinkBuilder: d } = (0, E.WO)(),
          p = d({
            refSuffix: [i ? Z.C.COMPANY : Z.C.ALL, { t: Z.C.COMPANY, n: r }],
            query: { companies: t },
          }),
          u = [];
        return (
          n && u.push(n),
          l && u.push(l),
          (0, s.jsx)(c.MetaDataListSummaryItem, {
            className: o,
            href: p,
            titleLink: p,
            title: a,
            subTextList: u.map((e) => ({ text: e })),
          })
        );
      };
      var X = a(67646),
        ee = a(4002),
        et = a(51442);
      let ea = () => {
          let e = (0, et.D9)(ee.$.FIND),
            t = (0, T.N)({
              id: "search_main_meta_title",
              defaultMessage: "Find - IMDb",
            }),
            a = (0, T.N)({
              id: "search_main_meta_description",
              defaultMessage: "IMDb's Find Results Page",
            });
          return (0, s.jsx)(X.ZP, {
            title: t,
            description: a,
            canonicalUrl: e,
          });
        },
        es = (e) => {
          let {
              id: t,
              hasSearchType: a,
              index: i,
              interestPosterImageModel: r,
              primaryText: n,
              secondaryText: l,
              imageType: o,
              className: d,
            } = e,
            { interestSingleLinkBuilder: p } = (0, E.WO)(),
            u = p({
              inconst: t,
              refSuffix: [a ? Z.C.INTEREST : Z.C.ALL, { t: Z.C.INTEREST, n: i }],
            }),
            m = [];
          return (
            l && m.push({ text: l }),
            (0, s.jsx)(c.MetaDataListSummaryItem, {
              className: d,
              href: u,
              titleLink: u,
              title: n,
              preElement: (0, s.jsx)(ei, {
                children: (0, s.jsx)(c.PosterImage, {
                  imageModel: r,
                  imageType: o,
                  size: 50,
                }),
              }),
              textList: m,
            })
          );
        },
        ei = o.default.div.withConfig({ componentId: "sc-d5634a83-0" })([
          "margin-right:0.5rem;flex-shrink:0;display:flex;",
        ]),
        er = (e) => {
          let { keywordText: t, numTitles: a, hasSearchType: i, index: r, className: n } = e,
            { searchTitleLinkBuilder: l } = (0, E.WO)(),
            o = l({
              refSuffix: [i ? Z.C.KEYWORDS : Z.C.ALL, { t: Z.C.KEYWORDS, n: r }],
              query: {
                keywords: t.replace(/\s{1}/g, "-"),
                explore: "keywords",
              },
            }),
            d = (0, T.N)(
              {
                id: "search_main_keyword_result_title_count_text",
                defaultMessage: "{numTitles, plural, one {{numTitles} title} other {{numTitles} titles}}",
              },
              { numTitles: a }
            );
          return (0, s.jsx)(c.MetaDataListSummaryItem, {
            className: n,
            href: o,
            title: t,
            titleLink: o,
            textList: [{ text: d }],
          });
        },
        en = {
          [w.lg.Title]: "tt",
          [w.lg.Name]: "nm",
          [w.lg.Company]: "co",
          [w.lg.Interest]: "in",
          [w.lg.Keyword]: "kw",
          [w.Py.Movie]: "ft",
          [w.Py.Tv]: "tv",
          [w.Py.TvEpisode]: "ep",
          [w.Py.PodcastSeries]: "ps",
          [w.Py.PodcastEpisode]: "pe",
          [w.Py.MusicVideo]: "mu",
          [w.Py.VideoGame]: "vg",
        },
        el = {
          [w.lg.Title]: {
            id: "search_main_title_results_section_label",
            defaultMessage: "{numTitles, plural, one {Title} other {Titles}}",
          },
          [w.lg.Name]: {
            id: "search_main_name_results_section_label",
            defaultMessage: "{numPeople, plural, one {Person} other {People}}",
          },
          [w.Py.Movie]: {
            id: "search_main_movie_results_section_label",
            defaultMessage: "{numTitles, plural, one {Movies} other {Movies}}",
          },
          [w.Py.Tv]: {
            id: "search_main_tv_results_section_label",
            defaultMessage: "TV",
          },
          [w.Py.TvEpisode]: {
            id: "search_main_tv_episode_results_section_label",
            defaultMessage: "{numTitles, plural, one {TV Episode} other {TV Episodes}}",
          },
          [w.Py.MusicVideo]: {
            id: "search_main_music_view_results_section_label",
            defaultMessage: "{numTitles, plural, one {Music Video} other {Music Videos}}",
          },
          [w.Py.PodcastSeries]: {
            id: "search_main_podcast_results_section_label",
            defaultMessage: "{numTitles, plural, one {Podcast} other {Podcasts}}",
          },
          [w.Py.PodcastEpisode]: {
            id: "searsearch_main_podcast_episode_results_section_label",
            defaultMessage: "{numTitles, plural, one {Podcast Episode} other {Podcast Episodes}}",
          },
          [w.Py.VideoGame]: {
            id: "search_main_video_game_results_section_label",
            defaultMessage: "{numTitles, plural, one {Video Game} other {Video Games}}",
          },
          [w.lg.Company]: {
            id: "search_main_company_results_section_label",
            defaultMessage: "{numCompanies, plural, one {Company} other {Companies}}",
          },
          [w.lg.Interest]: {
            id: "search_main_interest_results_section_label",
            defaultMessage: "{numInterests, plural, one {Interest} other {Interests}}",
          },
          [w.lg.Keyword]: {
            id: "search_main_keyword_results_section_label",
            defaultMessage: "{numKeywords, plural, one {Keyword} other {Keywords}}",
          },
        },
        eo = {
          allChip: "more-results-all-chip",
          ttChip: "more-results-tt-chip",
          nmChip: "more-results-nm-chip",
          ftChip: "more-results-ft-chip",
          tvChip: "more-results-tv-chip",
          epChip: "more-results-ep-chip",
          psChip: "more-results-ps-chip",
          peChip: "more-results-pe-chip",
          muChip: "more-results-mu-chip",
          vgChip: "more-results-vg-chip",
          coChip: "more-results-co-chip",
          kwChip: "more-results-kw-chip",
          quoteChip: "more-results-qu-chip",
          plotChip: "more-results-pl-chip",
          bioChip: "more-results-bi-chip",
          inChip: "more-results-in-chip",
        },
        ec = (0, o.default)(c.ChipList).withConfig({
          componentId: "sc-178f508-0",
        })(
          ["padding:0;", " ", ""],
          (0, x.setPropertyToSpacingVar)("padding-left", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("padding-right", "ipt-pageMargin")
        ),
        ed = (e) => {
          let { findPageMeta: t } = e,
            { findLinkBuilder: a, searchTitleLinkBuilder: i, searchNameLinkBuilder: r } = (0, E.WO)(),
            n = (0, T.N)(el[w.lg.Title], { numTitles: 2 }),
            l = (0, T.N)(el[w.lg.Name], { numPeople: 2 }),
            o = (0, T.N)(el[w.Py.Movie], { numTitles: 2 }),
            d = (0, T.N)(el[w.Py.Tv]),
            p = (0, T.N)(el[w.Py.TvEpisode], { numTitles: 2 }),
            u = (0, T.N)(el[w.Py.MusicVideo], { numTitles: 2 }),
            m = (0, T.N)(el[w.Py.PodcastSeries], { numTitles: 2 }),
            h = (0, T.N)(el[w.Py.PodcastEpisode], { numTitles: 2 }),
            g = (0, T.N)(el[w.Py.VideoGame], { numTitles: 2 }),
            f = (0, T.N)(el[w.lg.Company], { numCompanies: 2 }),
            y = (0, T.N)(el[w.lg.Keyword], { numKeywords: 2 }),
            x = (0, T.N)(el[w.lg.Interest], { numInterests: 2 }),
            _ = (0, T.N)({
              id: "search_main_more_results_chip_all",
              defaultMessage: "All",
            }),
            C = { ...t, searchType: void 0, isExactMatch: !1 },
            M = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: void 0,
              isExactMatch: !1,
            },
            P = { ...t, searchType: w.lg.Name, isExactMatch: !1 },
            S = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.Movie],
              isExactMatch: !1,
            },
            b = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.Tv],
              isExactMatch: !1,
            },
            N = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.TvEpisode],
              isExactMatch: !1,
            },
            v = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.PodcastSeries],
              isExactMatch: !1,
            },
            j = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.PodcastEpisode],
              isExactMatch: !1,
            },
            I = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.MusicVideo],
              isExactMatch: !1,
            },
            L = {
              ...t,
              searchType: w.lg.Title,
              titleSearchType: [w.Py.VideoGame],
              isExactMatch: !1,
            },
            k = { ...t, searchType: w.lg.Company, isExactMatch: !1 },
            R = { ...t, searchType: w.lg.Keyword, isExactMatch: !1 },
            A = { ...t, searchType: w.lg.Interest, isExactMatch: !1 };
          return (0, s.jsxs)(c.PageSection, {
            "data-testid": "more-results-section",
            children: [
              (0, s.jsx)(c.SectionTitle, {
                description: (0, T.N)(
                  {
                    id: "search_main_more_results_section_title_description",
                    defaultMessage: 'Search "{searchTerm}" within...',
                  },
                  { searchTerm: t.searchTerm }
                ),
                children: (0, T.N)({
                  id: "search_main_more_results_section_title",
                  defaultMessage: "More results",
                }),
              }),
              (0, s.jsxs)(ec, {
                wrap: !0,
                children: [
                  t.searchType &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.allChip,
                      label: _,
                      href: a({ query: K(C), refSuffix: [Z.C.ALL] }),
                    }),
                  t.searchType &&
                    (t.searchType !== w.lg.Title || t.titleSearchType) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.ttChip,
                      label: n,
                      href: a({ query: K(M), refSuffix: [Z.C.TITLE] }),
                    }),
                  t.searchType &&
                    t.searchType !== w.lg.Name &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.nmChip,
                      label: l,
                      href: a({ query: K(P), refSuffix: [Z.C.NAME] }),
                    }),
                  !t.titleSearchType?.includes(w.Py.Movie) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.ftChip,
                      label: o,
                      href: a({ query: K(S), refSuffix: [Z.C.MOVIE] }),
                    }),
                  !t.titleSearchType?.includes(w.Py.Tv) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.tvChip,
                      label: d,
                      href: a({ query: K(b), refSuffix: [Z.C.TV] }),
                    }),
                  !t.titleSearchType?.includes(w.Py.TvEpisode) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.epChip,
                      label: p,
                      href: a({ query: K(N), refSuffix: [Z.C.EPISODE] }),
                    }),
                  !t.titleSearchType?.includes(w.Py.MusicVideo) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.muChip,
                      label: u,
                      href: a({ query: K(I), refSuffix: [Z.C.MUSIC_VIDEO] }),
                    }),
                  !t.titleSearchType?.includes(w.Py.PodcastSeries) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.psChip,
                      label: m,
                      href: a({ query: K(v), refSuffix: [Z.C.PODCAST_SERIES] }),
                    }),
                  !t.titleSearchType?.includes(w.Py.PodcastEpisode) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.peChip,
                      label: h,
                      href: a({
                        query: K(j),
                        refSuffix: [Z.C.PODCAST_EPISODE],
                      }),
                    }),
                  !t.titleSearchType?.includes(w.Py.VideoGame) &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.vgChip,
                      label: g,
                      href: a({ query: K(L), refSuffix: [Z.C.VIDEO_GAME] }),
                    }),
                  t.searchType !== w.lg.Company &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.coChip,
                      label: f,
                      href: a({ query: K(k), refSuffix: [Z.C.COMPANY] }),
                    }),
                  t.searchType !== w.lg.Keyword &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.kwChip,
                      label: y,
                      href: a({ query: K(R), refSuffix: [Z.C.KEYWORDS] }),
                    }),
                  (0, s.jsx)(c.Chip, {
                    className: eo.quoteChip,
                    label: (0, T.N)({
                      id: "search_main_more_results_chip_quotes",
                      defaultMessage: "Quotes",
                    }),
                    href: i({
                      query: { quotes: t.searchTerm },
                      refSuffix: Z.C.QUOTES,
                    }),
                  }),
                  (0, s.jsx)(c.Chip, {
                    className: eo.plotChip,
                    label: (0, T.N)({
                      id: "search_main_more_results_chip_plot",
                      defaultMessage: "Plot Summaries",
                    }),
                    href: i({
                      query: { plot: t.searchTerm },
                      refSuffix: Z.C.PLOT,
                    }),
                  }),
                  (0, s.jsx)(c.Chip, {
                    className: eo.bioChip,
                    label: (0, T.N)({
                      id: "search_main_more_results_chip_bio",
                      defaultMessage: "Biographies",
                    }),
                    href: r({
                      query: { bio: t.searchTerm },
                      refSuffix: Z.C.BIO,
                    }),
                  }),
                  t.searchType &&
                    t.searchType !== w.lg.Interest &&
                    (0, s.jsx)(c.Chip, {
                      className: eo.inChip,
                      label: x,
                      href: a({ query: K(A), refSuffix: [Z.C.INTEREST] }),
                    }),
                ],
              }),
            ],
          });
        },
        ep = (e) => {
          let {
              id: t,
              displayNameText: a,
              hasSearchType: i,
              index: r,
              knownForJobCategory: n,
              knownForTitleText: l,
              knownForTitleYear: o,
              akaName: d,
              avatarImageModel: p,
              className: u,
            } = e,
            m = `${[n, [l, o && `(${o})`].filter(Boolean).join(" ")].filter(Boolean).join(", ")}`,
            h = (0, T.N)(
              {
                id: "search_main_name_result_aka_text",
                defaultMessage: 'aka "{akaName}"',
              },
              { akaName: d }
            );
          d && (m = h);
          let { nameMainLinkBuilder: g } = (0, E.WO)(),
            f = g({
              nconst: t,
              refSuffix: [i ? Z.C.NAME : Z.C.ALL, { t: Z.C.NAME, n: r }],
            });
          return (0, s.jsx)(c.MetaDataListSummaryItem, {
            className: u,
            href: f,
            titleLink: f,
            title: a,
            preElement: (0, s.jsx)(eu, {
              children: (0, s.jsx)(c.AvatarImage, { imageModel: p, size: 50 }),
            }),
            textList: [{ text: m }],
          });
        },
        eu = o.default.div.withConfig({ componentId: "sc-a783fda0-0" })([
          "margin-right:0.5rem;flex-shrink:0;display:flex;",
        ]),
        em = o.default.h1.withConfig({ componentId: "sc-f2794aa0-0" })(
          [
            "margin-bottom:",
            ";",
            " font-size:3rem;line-height:3.125rem;",
            "{",
            " font-weight:400;margin-bottom:",
            ";}",
          ],
          x.spacing.xs,
          (0, x.setTypographyType)("headline3"),
          x.mediaQueries.breakpoints.below.m,
          (0, x.setTypographyType)("headline4"),
          x.spacing.xxs
        ),
        eh = (0, o.default)(c.PageSection).withConfig({
          componentId: "sc-f2794aa0-1",
        })(["padding-left:", ";padding-right:", ";"], x.pageMargin.xl, x.pageMargin.xl),
        eg = {
          id: "search_main_top_heading",
          defaultMessage: 'Search "{searchTerm}"',
        },
        ef = {
          id: "search_main_empty_search_heading",
          defaultMessage: "Search IMDb",
        },
        ey = {
          id: "search_main_empty_message",
          defaultMessage: "Search IMDb by typing a word or phrase in the search box at the top of this page.",
        },
        ex = (e) => {
          let { findPageMeta: t } = e,
            a = (0, T.N)(eg, { searchTerm: t.searchTerm }),
            i = (0, T.N)(ef),
            r = (0, T.N)(ey),
            n = f(t);
          return (0, s.jsxs)(eh, {
            children: [(0, s.jsx)(em, { children: n ? i : a }), n && r],
          });
        };
      var eT = a(72779),
        e_ = a.n(eT);
      let eC = {
          seeMoreButton: "results-section-see-more-btn",
          exactMatchButton: "results-section-exact-match-btn",
          popularMatchButton: "results-section-popular-match-btn",
          emptyResultsMessage: "results-section-empty-results-msg",
        },
        eM = "find-result-item",
        eP = (0, o.default)(c.PageSection).withConfig({
          componentId: "sc-b03627f1-0",
        })(["", ""], (0, x.setPropertyToSpacingVar)("padding-bottom", "ipt-pageMargin")),
        eS = (0, o.default)(c.SectionTitle).withConfig({
          componentId: "sc-b03627f1-1",
        })(["", "{margin-bottom:0;}"], x.mediaQueries.breakpoints.below.l),
        eb = o.default.div.withConfig({ componentId: "sc-b03627f1-2" })(
          [
            "",
            " margin-bottom:0;",
            " border:1px solid ",
            ";",
            " ",
            "{margin:0;padding:0;",
            " border:none;}.",
            ":first-of-type{padding-top:0;}",
          ],
          (0, x.setPropertyToSpacingVar)("margin", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("padding", "ipt-pageMargin"),
          (0, x.getColorVar)("ipt-base-border-color"),
          (0, x.setPropertyToShapeVar)("border-radius", "ipt-cornerRadius"),
          x.mediaQueries.breakpoints.below.l,
          (0, x.setPropertyToSpacingVar)("padding-top", "ipt-pageMargin"),
          eM
        ),
        eN = (0, o.default)(c.MetaDataList).withConfig({
          componentId: "sc-b03627f1-3",
        })(
          ["margin:0;", "{", " ", "}"],
          x.mediaQueries.breakpoints.below.l,
          (0, x.setPropertyToSpacingVar)("margin-left", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("margin-right", "ipt-pageMargin")
        ),
        eE = o.default.div.withConfig({ componentId: "sc-b03627f1-4" })(
          ["margin:0;", " ", "{", " ", "}"],
          (0, x.setPropertyToSpacingVar)("margin-top", "ipt-pageMargin"),
          x.mediaQueries.breakpoints.below.l,
          (0, x.setPropertyToSpacingVar)("margin-left", "ipt-pageMargin"),
          (0, x.setPropertyToSpacingVar)("margin-right", "ipt-pageMargin")
        ),
        ev = o.default.div.withConfig({ componentId: "sc-b03627f1-5" })(
          ["text-align:center;padding:", " 0;", " ", "{text-align:left;padding:", ";}"],
          x.pageMargin.l,
          (0, x.setPropertyToColorVar)("color", "ipt-on-base-textSecondary-color"),
          x.mediaQueries.breakpoints.above.l,
          x.pageMargin.xl
        ),
        ej = (e) => `fn-${en[e]}-see-more`,
        ew = (e) => {
          let {
              resultType: t,
              findPageMeta: a,
              findPageResults: i,
              sectionHeadingText: r,
              loadMoreResults: n,
              ResultComponent: l,
            } = e,
            o = (0, j.b)(),
            { findLinkBuilder: d } = (0, E.WO)(),
            p = (0, T.N)({
              id: "search_main_more_popular_matches_button",
              defaultMessage: "More popular matches",
            }),
            u = (0, T.N)({
              id: "search_main_see_popular_matches_button",
              defaultMessage: "Popular matches",
            }),
            m = (0, T.N)({
              id: "search_main_more_exact_matches_button",
              defaultMessage: "More exact matches",
            }),
            h = (0, T.N)({
              id: "search_main_see_exact_matches_button",
              defaultMessage: "Exact matches",
            }),
            g = (0, T.N)(
              {
                id: "search_main_empty_results_message",
                defaultMessage: 'No results found for "{searchTerm}"',
              },
              { searchTerm: a.searchTerm }
            );
          return (0, s.jsxs)(eP, {
            "data-testid": `find-results-section-${t.toLowerCase()}`,
            children: [
              (0, s.jsx)(eS, {
                actions:
                  i.hasExactMatches &&
                  (a.isExactMatch
                    ? (0, s.jsx)(c.TextButton, {
                        href: d({
                          query: K({ ...a, isExactMatch: !1, searchType: t }),
                          refSuffix: [Z.C[t], Z.C.POPULAR],
                        }),
                        className: eC.popularMatchButton,
                        postIcon: "arrow-right",
                        onColor: "textSecondary",
                        children: u,
                      })
                    : (0, s.jsx)(c.TextButton, {
                        href: d({
                          query: K({ ...a, isExactMatch: !0, searchType: t }),
                          refSuffix: [Z.C[t], Z.C.EXACT],
                        }),
                        className: eC.exactMatchButton,
                        postIcon: "arrow-right",
                        onColor: "textSecondary",
                        children: h,
                      })),
                children: r,
              }),
              (0, s.jsx)(eb, {
                children: i.results.length
                  ? (0, s.jsxs)(s.Fragment, {
                      children: [
                        (0, s.jsx)(eN, {
                          dividers: "after",
                          children: i.results.map((e, i) =>
                            (0, s.jsx)(
                              l,
                              {
                                className: e_()(eM, `find-${t.toLowerCase()}-result`),
                                ...e,
                                hasSearchType: !!a.searchType,
                                index: i + 1,
                              },
                              e.id
                            )
                          ),
                        }),
                        (0, s.jsx)(eE, {
                          children:
                            i.nextCursor &&
                            (0, s.jsx)(c.SeeMoreButton, {
                              className: e_()(eC.seeMoreButton, `find-see-more-${t.toLowerCase()}-btn`),
                              text: a.isExactMatch ? m : p,
                              isLoading: i.newResultsPending,
                              onClick: () => {
                                o({ action: ej(t) }), n();
                              },
                            }),
                        }),
                      ],
                    })
                  : (0, s.jsx)(ev, {
                      "data-testid": eC.emptyResultsMessage,
                      children: g,
                    }),
              }),
            ],
          });
        },
        eI = (e) => {
          let { findPageMeta: t, companyResults: a, loadMoreCompanyResults: i } = e,
            r = (0, T.N)(el[w.lg.Company], { numCompanies: a.results.length });
          return (0, s.jsx)(ew, {
            resultType: w.lg.Company,
            findPageMeta: t,
            findPageResults: a,
            sectionHeadingText: r,
            loadMoreResults: i,
            ResultComponent: z,
          });
        },
        eL = (e) => {
          let { findPageMeta: t, interestResults: a, loadMoreInterestResults: i } = e,
            r = (0, T.N)(el[w.lg.Interest], { numInterests: a.results.length });
          return (0, s.jsx)(ew, {
            resultType: w.lg.Interest,
            findPageMeta: t,
            findPageResults: a,
            sectionHeadingText: r,
            loadMoreResults: i,
            ResultComponent: es,
          });
        },
        ek = (e) => {
          let { findPageMeta: t, keywordResults: a, loadMoreKeywordResults: i } = e,
            r = (0, T.N)(el[w.lg.Keyword], { numKeywords: a.results.length });
          return (0, s.jsx)(ew, {
            resultType: w.lg.Keyword,
            findPageMeta: t,
            findPageResults: a,
            sectionHeadingText: r,
            loadMoreResults: i,
            ResultComponent: er,
          });
        },
        eR = (e) => {
          let { findPageMeta: t, nameResults: a, loadMoreNameResults: i } = e,
            r = (0, T.N)(el[w.lg.Name], { numPeople: a.results.length });
          return (0, s.jsx)(ew, {
            resultType: w.lg.Name,
            findPageMeta: t,
            findPageResults: a,
            sectionHeadingText: r,
            loadMoreResults: i,
            ResultComponent: ep,
          });
        },
        eA = (e) => !Number.isNaN(Number.parseInt(e)),
        eO = (e) => {
          let {
              id: t,
              titleNameText: a,
              hasSearchType: i,
              index: r,
              titleReleaseText: n,
              titleTypeText: l,
              titlePosterImageModel: o,
              seriesId: d,
              seriesNameText: p,
              seriesReleaseText: u,
              seriesTypeText: m,
              seriesSeasonText: h,
              seriesEpisodeText: g,
              topCredits: f,
              imageType: y,
              className: x,
            } = e,
            T = [],
            { titleMainLinkBuilder: _ } = (0, E.WO)(),
            C = [i ? Z.C.TITLE : Z.C.ALL, { t: Z.C.TITLE, n: r }],
            M = _({ tconst: t, refSuffix: C });
          if (d && p && u && m && h && g) {
            let e = [],
              t = _({ tconst: d, refSuffix: C });
            return (
              eA(h) && e.push(`S${h}`),
              eA(g) && e.push(`E${g}`),
              n && T.push({ text: n }),
              e.length && T.push({ text: e.join(".") }),
              l && T.push({ text: l }),
              (0, s.jsx)(c.MetaDataListSummaryItem, {
                className: x,
                href: M,
                titleLink: M,
                title: a,
                preElement: (0, s.jsx)(eD, {
                  children: (0, s.jsx)(c.PosterImage, {
                    imageModel: o,
                    imageType: y,
                    size: 50,
                  }),
                }),
                textList: T,
                subTextList: [{ text: p, href: t }, { text: m }],
              })
            );
          }
          return (
            n && T.push({ text: n }),
            l && T.push({ text: l }),
            (0, s.jsx)(c.MetaDataListSummaryItem, {
              className: x,
              href: M,
              titleLink: M,
              title: a,
              preElement: (0, s.jsx)(eD, {
                children: (0, s.jsx)(c.PosterImage, {
                  imageModel: o,
                  imageType: y,
                  size: 50,
                }),
              }),
              textList: T,
              subTextList: f && [{ text: f?.join(", ") }],
            })
          );
        },
        eD = o.default.div.withConfig({ componentId: "sc-6c36cb0-0" })([
          "margin-right:0.5rem;flex-shrink:0;display:flex;",
        ]),
        eV = (e) => {
          let { findPageMeta: t, titleResults: a, loadMoreTitleResults: i } = e,
            r = (0, T.N)(el[w.lg.Title], { numTitles: 2 }),
            n = (0, T.N)(el[w.Py.Movie], { numTitles: 2 }),
            l = (0, T.N)(el[w.Py.Tv]),
            o = (0, T.N)(el[w.Py.TvEpisode], { numTitles: 2 }),
            c = (0, T.N)(el[w.Py.MusicVideo], { numTitles: 2 }),
            d = (0, T.N)(el[w.Py.PodcastSeries], { numTitles: 2 }),
            p = (0, T.N)(el[w.Py.PodcastEpisode], { numTitles: 2 }),
            u = (0, T.N)(el[w.Py.VideoGame], { numTitles: 2 }),
            m = r;
          switch (t.titleSearchType?.join()) {
            case w.Py.Movie:
              m = n;
              break;
            case w.Py.Tv:
              m = l;
              break;
            case w.Py.TvEpisode:
              m = o;
              break;
            case w.Py.MusicVideo:
              m = c;
              break;
            case w.Py.PodcastSeries:
              m = d;
              break;
            case w.Py.PodcastEpisode:
              m = p;
              break;
            case w.Py.VideoGame:
              m = u;
          }
          return (0, s.jsx)(ew, {
            resultType: w.lg.Title,
            findPageMeta: t,
            findPageResults: a,
            sectionHeadingText: m,
            loadMoreResults: i,
            ResultComponent: eO,
          });
        };
      var e$ = a(1502);
      let eF = [w.lg.Title, w.lg.Name, w.lg.Interest],
        eq = (e, t) => {
          if (e) {
            let a = t[e];
            if (a) return `${e$.tD}-${en[e]}-${a.toString()}`;
          } else {
            let e = 0,
              a = `${e$.tD}`;
            for (let s of eF) {
              let i = t[s] || 0;
              (a += `-${en[s]}-${i.toString()}`), (e += i);
            }
            if (e > 0) return a;
          }
          return `${e$.tD}-${e$.oh}`;
        };
      var eK = a(85767),
        eB = a(96446);
      let eH = (e) => {
          let { typeFilter: t, findPageMeta: a, initialResults: s, initialNextCursor: r, hasExactMatches: n } = e,
            l = (0, eK.B)().context,
            [o, c] = (0, i.useState)(!1),
            [d, p] = (0, i.useState)(s),
            [u, m] = (0, i.useState)(r),
            [{ data: h, error: g, fetching: f }] = (0, eB.E8)({
              ...$({
                skipHasExact: !0,
                typeFilter: t,
                findPageMeta: a,
                numResults: 25,
                nextCursor: u,
              }),
              pause: !o,
            });
          return (
            (0, i.useEffect)(() => {
              if (!h) return;
              let { results: e, nextCursor: t } = Y({
                data: h,
                requestContext: l,
                findPageMeta: a,
              });
              p((t) => [...t, ...e]), m(t), c(!1);
            }, [h, l]),
            [
              {
                results: d,
                nextCursor: u,
                newResultsPending: f,
                hasExactMatches: n,
              },
              () => {
                f || o || c(!0);
              },
            ]
          );
        },
        eG = (e) => {
          let {
              findPageMeta: t,
              nameResults: a,
              titleResults: r,
              companyResults: n,
              interestResults: l,
              keywordResults: o,
              resultsSectionOrder: c,
            } = e,
            [d, p] = eH({
              typeFilter: w.lg.Company,
              findPageMeta: t,
              initialResults: n.results,
              initialNextCursor: n.nextCursor,
              hasExactMatches: n.hasExactMatches,
            }),
            [u, m] = eH({
              typeFilter: w.lg.Interest,
              findPageMeta: t,
              initialResults: l.results,
              initialNextCursor: l.nextCursor,
              hasExactMatches: l.hasExactMatches,
            }),
            [h, g] = eH({
              typeFilter: w.lg.Keyword,
              findPageMeta: t,
              initialResults: o.results,
              initialNextCursor: o.nextCursor,
              hasExactMatches: o.hasExactMatches,
            }),
            [f, y] = eH({
              typeFilter: w.lg.Name,
              findPageMeta: t,
              initialResults: a.results,
              initialNextCursor: a.nextCursor,
              hasExactMatches: a.hasExactMatches,
            }),
            [x, T] = eH({
              typeFilter: w.lg.Title,
              findPageMeta: t,
              initialResults: r.results,
              initialNextCursor: r.nextCursor,
              hasExactMatches: r.hasExactMatches,
            }),
            _ = (0, j.b)();
          return (
            (0, i.useEffect)(() => {
              let e = {};
              (e[w.lg.Company] = d.results.length),
                (e[w.lg.Interest] = u.results.length),
                (e[w.lg.Keyword] = h.results.length),
                (e[w.lg.Name] = f.results.length),
                (e[w.lg.Title] = x.results.length),
                _({ action: eq(t.searchType, e), logQueryString: !0 });
            }, [d.results, u.results, h.results, f.results, x.results]),
            (0, s.jsx)(s.Fragment, {
              children: c.map((e) => {
                switch (e) {
                  case w.lg.Name:
                    return (0, s.jsx)(eR, {
                      findPageMeta: t,
                      nameResults: f,
                      loadMoreNameResults: y,
                    });
                  case w.lg.Title:
                    return (0, s.jsx)(eV, {
                      findPageMeta: t,
                      titleResults: x,
                      loadMoreTitleResults: T,
                    });
                  case w.lg.Company:
                    return (0, s.jsx)(eI, {
                      findPageMeta: t,
                      companyResults: d,
                      loadMoreCompanyResults: p,
                    });
                  case w.lg.Interest:
                    return (0, s.jsx)(eL, {
                      findPageMeta: t,
                      interestResults: u,
                      loadMoreInterestResults: m,
                    });
                  case w.lg.Keyword:
                    return (0, s.jsx)(ek, {
                      findPageMeta: t,
                      keywordResults: h,
                      loadMoreKeywordResults: g,
                    });
                }
              }),
            })
          );
        },
        eY = (e) => {
          let {
            findPageMeta: t,
            nameResults: a,
            titleResults: i,
            companyResults: r,
            interestResults: o,
            keywordResults: x,
            resultsSectionOrder: T,
            isLoggedIn: _,
          } = e;
          return (0, s.jsxs)(h.ZP, {
            children: [
              (0, s.jsx)(ea, {}),
              (0, s.jsx)(n.AdWrapBackground, {}),
              (0, s.jsx)(p.Z, {}),
              (0, s.jsx)(m.Z, {}),
              (0, s.jsx)(c.PageBackground, {
                baseColor: "baseAlt",
                className: g.R,
                children: (0, s.jsx)(c.PageContentContainer, {
                  children: (0, s.jsx)(u.ZP, {
                    name: n.AD_SLOT_NAMES.INLINE20,
                    nasConfig: { theme: n.NasTheme.DARK },
                  }),
                }),
              }),
              (0, s.jsx)(c.PageContentContainer, {
                children: (0, s.jsx)(eU, {
                  baseColor: "base",
                  children: (0, s.jsxs)(c.PageGrid, {
                    children: [
                      (0, s.jsx)(c.PageGrid.Item, {
                        span: 2,
                        children: (0, s.jsxs)("div", {
                          children: [
                            (0, s.jsx)(ex, { findPageMeta: t }),
                            (0, y.YN)(),
                            (0, s.jsx)(l.CSAPageATFScript, {}),
                            f(t)
                              ? (0, s.jsx)(Q, {
                                  findPageMeta: t,
                                  isLoggedIn: _,
                                })
                              : (0, s.jsx)(eG, {
                                  findPageMeta: t,
                                  nameResults: a,
                                  titleResults: i,
                                  companyResults: r,
                                  interestResults: o,
                                  keywordResults: x,
                                  resultsSectionOrder: T,
                                }),
                          ],
                        }),
                      }),
                      (0, s.jsx)(c.PageGrid.Item, {
                        span: 1,
                        children: (0, s.jsxs)("div", {
                          children: [
                            (0, s.jsx)(u.ZP, {
                              name: n.AD_SLOT_NAMES.INLINE40,
                            }),
                            !f(t) &&
                              (0, s.jsxs)(d._, {
                                children: [
                                  (0, s.jsx)(ed, { findPageMeta: t }),
                                  (0, s.jsx)(Q, {
                                    findPageMeta: t,
                                    isLoggedIn: _,
                                  }),
                                ],
                              }),
                          ],
                        }),
                      }),
                    ],
                  }),
                }),
              }),
            ],
          });
        },
        eU = (0, o.default)(c.PageBackground).withConfig({
          componentId: "sc-f2176668-0",
        })(["position:relative;"]);
      var eW = a(70071),
        eJ = !0,
        eQ = (e) =>
          (0, s.jsx)(eW.Z, {
            baseColor: "base",
            orientContent: "full",
            cti: r.CTIS.SEARCH_MAIN_CTI,
            children: (0, s.jsx)(eY, { ...e }, JSON.stringify(e.findPageMeta)),
          });
    },
    98042: function (e, t, a) {
      "use strict";
      t.h6 = void 0;
      var s = a(20150);
      Object.defineProperty(t, "h6", {
        enumerable: !0,
        get: function () {
          return s.jsonLdScriptProps;
        },
      });
    },
    20150: function (e, t, a) {
      "use strict";
      var s =
        (this && this.__assign) ||
        function () {
          return (s =
            Object.assign ||
            function (e) {
              for (var t, a = 1, s = arguments.length; a < s; a++)
                for (var i in (t = arguments[a])) Object.prototype.hasOwnProperty.call(t, i) && (e[i] = t[i]);
              return e;
            }).apply(this, arguments);
        };
      Object.defineProperty(t, "__esModule", { value: !0 }),
        (t.helmetJsonLdProp = t.jsonLdScriptProps = t.JsonLd = void 0);
      var i = a(2784);
      function r(e, t) {
        return (
          void 0 === t && (t = {}),
          {
            type: "application/ld+json",
            dangerouslySetInnerHTML: { __html: JSON.stringify(e, c, t.space) },
          }
        );
      }
      (t.JsonLd = function (e) {
        return i.createElement("script", s({}, r(e.item, e)));
      }),
        (t.jsonLdScriptProps = r),
        (t.helmetJsonLdProp = function (e, t) {
          return (
            void 0 === t && (t = {}),
            {
              type: "application/ld+json",
              innerHTML: JSON.stringify(e, c, t.space),
            }
          );
        });
      var n = Object.freeze({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        }),
        l = RegExp("[" + Object.keys(n).join("") + "]", "g"),
        o = function (e) {
          return n[e];
        },
        c = function (e, t) {
          switch (typeof t) {
            case "object":
              if (null === t) return;
              return t;
            case "number":
            case "boolean":
            case "bigint":
              return t;
            case "string":
              return t.replace(l, o);
            default:
              return;
          }
        };
    },
  },
  function (e) {
    e.O(0, [9324, 2780, 9291, 6892, 71, 3433, 8597, 7668, 8381, 2888, 9774, 179], function () {
      return e((e.s = 94195));
    }),
      (_N_E = e.O());
  },
]);
```

SHA256 source string:

```text
query FindPageSearch($skipHasExact: Boolean!, $numResults: Int!, $searchTerm: String!, $includeAdult: Boolean!, $isExactMatch: Boolean!, $typeFilter: [MainSearchType!], $titleSearchOptions: TitleSearchOptions, $after: String) {
  results: mainSearch(
    first: $numResults
    after: $after
    options: {searchTerm: $searchTerm, type: $typeFilter, includeAdult: $includeAdult, isExactMatch: $isExactMatch, titleSearchOptions: $titleSearchOptions}
  ) {
    edges {
      node {
        entity {
          ... on Company {
            ...CompanyResult
          }
          ... on Keyword {
            ...KeywordResult
          }
          ... on Interest {
            ...InterestResult
          }
          ... on Name {
            ...NameResult
          }
          ... on Title {
            ...TitleResult
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
  hasExact: mainSearch(
    first: 1
    options: {searchTerm: $searchTerm, type: $typeFilter, includeAdult: $includeAdult, isExactMatch: true, titleSearchOptions: $titleSearchOptions}
  ) {
    edges @skip(if: $skipHasExact) {
      node {
        entity {
          __typename
        }
      }
    }
  }
}

fragment CompanyResult on Company {
  __typename
  id
  companyText {
    text
  }
  companyTypes(limit: 1) {
    text
  }
  country {
    text
  }
}

fragment InterestResult on Interest {
  __typename
  id
  primaryText {
    text
  }
  secondaryText {
    text
  }
  primaryImage {
    url
    height
    width
    caption {
      plainText
    }
  }
}

fragment KeywordResult on Keyword {
  __typename
  id
  text {
    text
  }
  titles(first: 1) {
    total
  }
}

fragment NameResult on Name {
  __typename
  id
  nameText {
    text
  }
  disambiguator {
    text
  }
  primaryImage {
    url
    height
    width
    caption {
      plainText
    }
  }
  akas(first: 10) {
    edges {
      node {
        displayableProperty {
          value {
            plainText
          }
        }
      }
    }
  }
  nickNames(limit: 10) {
    displayableProperty {
      value {
        plainText
      }
    }
  }
  knownFor(first: 1) {
    edges {
      node {
        title {
          titleText {
            text
          }
          originalTitleText {
            text
          }
          releaseYear {
            year
            endYear
          }
          titleType {
            id
            text
            canHaveEpisodes
          }
        }
        summary {
          principalCategory {
            text
          }
        }
      }
    }
  }
}

fragment TitleResult on Title {
  __typename
  id
  meta {
    canonicalId
    publicationStatus
  }
  titleType {
    id
    canHaveEpisodes
    displayableProperty {
      value {
        plainText
      }
    }
  }
  titleText {
    text
  }
  originalTitleText {
    text
  }
  releaseYear {
    year
    endYear
  }
  primaryImage {
    url
    height
    width
    caption {
      plainText
    }
  }
  principalCredits(filter: {categories: ["cast"]}) {
    credits {
      name {
        nameText {
          text
        }
      }
    }
  }
  series {
    series {
      id
      titleText {
        text
      }
      originalTitleText {
        text
      }
      releaseYear {
        year
        endYear
      }
      titleType {
        id
        canHaveEpisodes
        displayableProperty {
          value {
            plainText
          }
        }
      }
    }
    displayableEpisodeNumber {
      displayableSeason {
        displayableProperty {
          value {
            plainText
          }
        }
      }
      episodeNumber {
        displayableProperty {
          value {
            plainText
          }
        }
      }
    }
  }
}
```

## LATER

### IMDB Interests

- IMDB provides interests (genres, subgenres, form, style etc.)
- update-imdb-interests which created data/imdb-interests.json is already created, run with `npm run update-imdb-interests`

### IMDB Soundtrack

- https://www.imdb.com/title/tt0227445/soundtrack/

### Series: Link IMDB Dialog

- [ ] for episodes:

  - [ ] provide all entries for the current series (Series_id_Movies_Owner's IMDB_tconst)
    - [ ] new imdb scraper: scrapeSeriesSeasons(tconst) -> `https://www.imdb.com/title/tt0206512/episodes/` -> dropdown
  - [ ] allow a fallback to standard imdb search

### Series

- [ ] Heatmap: allow to customize the colors

- [ ] support for date based series (`2023-01-31`)

- [ ] BUG: subtitles in .rar files are added to the media list

- [ ] BUG: rescanning a specific series does not run mediainfo on its episodes

  - store.rescanItems

- [ ] Edit Episode: select season, episode number / bonus number

- [ ] if season is unknown or episode number not set: try to find the imdb tconst by comparing names
  - [ ] store.findIMDBtconst: series episode find by name

### Misc (LATER)

- [ ] download <https://easylist.to/easylist/easylist.txt> every now and then
- [ ] implement a test which just checks if the graphQL URLs are fine
- [ ] Fix: subdirectory called "extras" is not assigned to the main movie (the files are provided as main movies themselves)
- [ ] lots of video encoders are `<not available>`
- [ ] BUG: with age rating range (e.g. 6-16+), the dialog's movies and series lists do not expand
  - we have a general issue with age ratings and their ranges
- [ ] BUG: subdirectory called "extras" is not assigned to the main movie (the files are provided as main movies themselves)
- [ ] IMDB Scraper: analyze video URLs in "Videos" section and find a better suited Trailer URL than the one primarily shown in the main page (which is oftentimes an IMDB special)
  - or simply use:
    - <https://www.imdb.com/title/tt0088247/videogallery/content_type-trailer/?sort=date&sortDir=desc>
    - <https://www.imdb.com/title/tt4154796/videogallery/content_type-trailer/?sortDir=desc&sort=duration>
    - the trailers are also labeled!
- [ ] refactor buildINSERTQuery, buildUDPATEQuery to accept only one object as function parameter
- [ ] scanErrors:
  - [ ] review how rescan and applyIMDB handle scanErrors (string to object, handle null)
  - [ ] artificially test graphql not found errors
  - [ ] introduce WARNING vs. ERROR
    - WARNING:
      - imdb implausibility
    - ERROR:
      - (new) mediainfo without result (possibly due to max path length exceeded)
      - IMDB GraphQL errors
  - [ ] introduce error types:
    - during filescan
    - during imdb scraping
    - during mediainfo
- [ ] i18n: rescan finished snackbar
- [ ] add ScanErrors functionality in applyMediaInfo (mediainfo may fail on exceeding 259 chars paths)
- [ ] we apparently do not use the timezone (we store in UTC)
- [ ] investigate everything that still works with MediaType (and possibly should also use SpecificMediaType)
- [ ] investigate if we still use Series_id_Movies_Owner to differentiate Series and Episodes -> we have specificMediaType now
- [ ] BUG? when opening person dialog and clicking "filter by this person", the main list "jumps" and THEN reloads with the filter applied (possibly a fix for another issue)
- [ ] #36 Mediainfo always opening
- [ ] rescanHandleDuplicates (also provide snackbar progress for this)
- [ ] Allow user to upload a poster of their liking
- [ ] introduce AND filter for Video Qualities (other filters might also get AND filter added)
- [ ] Rescan: allow to select/unselect certain source paths for the rescan
- [ ] deprecate tbl_Movies.ML_Quality (it isn't used in code anymore)
- add ffmpeg in order to create screenshots for movies/episodes with missing poster
- [ ] provide "source path selection" in "scan media" dialog
  - allows to select a sub-set of source paths for a media scan
- [ ] include find-imdb-tconst-tests in imdb scraper watchdog
- [ ] fix file/dirbased name when IMDB tconst detection has no result: if the medium is directory-based, then show the directory name and not the file-based name
- [ ] new filter: min. IMDB votes
- [ ] "IMDB score comparison game" (in context of the current list?)
- [ ] curl/wget easylist.txt automatically before build <https://easylist.to/easylist/easylist.txt>
- [ ] later: properly differentiate V1, V2 and V3 mainPageData handling
- [ ] later: async db funcs (initDb, syncSqlite)
- [ ] add "play random media" functionality to the List Actions menu
- [ ] Trailer Show - trailer dialog is open, when adding to list the scrollbar appears on the side, also the trailer dialog seems to wiggle a bit when the add-to-list dialog closes

### Plugin System

- check Shopware's Plugin System <https://www.youtube.com/watch?v=SlhFzRpneJI>

### Remove Noise from duplicate router push

router.js

```js
// remove the noise from duplicated router pushs (https://stackoverflow.com/a/58439497/5627010)
const originalPush = Router.prototype.push;
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((err) => err);
};
```

### In-List File Management

- for individual movies as well as for the whole (filtered) list
- copy/move entries to
  - another sourcepath
  - a user-defined destination

### Customizable Quick Info Area

- [ ] have the quick info area customizable?
  - [ ] let user decide to hide certain fields
  - [ ] let user re-arrange the fields

### Find Inspiration from <https://github.com/whyboris/Video-Hub-App>

### Create i18n Editor

- [ ] check out <https://crowdin.com/> which is free for opensource projects

- [x] load message definitions from %workdir%/i18n (e.g. zh.json, fr.json etc.)
- [x] provide selectable languages from actually loaded messages
- [ ] include \*.json export in Media Hoarder
- [ ] investigate external i18n sources - so that tranlastors can access their creation
- [ ] dropdown of available (to be translated) languages
- [ ] read available en.json ($fieldName, $expectedText)
- [ ] provide $expectedText as Input, let user type the translation in the language of choice
- [ ] establish a way of file exchange
- [ ] implement i18n/where.json as copy of en.json. The value describes the location in the UI where the string is shown.

### Raspberry Pi (armhf) Build

### JSDoc everywhere

```text
/**
 * Description of the function
 * @param {string} myParam
 */
```

### Memory Leak (multiple reloads of medialist)

- [ ] more intelligent loading?
- [ ] better garbage collection?
- [x] -> we have a memory leak using eventBus.$on -> implement eventBus.$off on beforeDestroy() lifecycle hook
- [x] -> we still have the memory leak: don't fetch all data at once (re-fetch for each page)
- [x] -> check if memory leak is only in dev-mode (yes, it still persists even in prod-mode)

### Use Alternative Search Method

- [ ] IMDB Detection uses Suggestion API which doesn't support non-latin names
- [ ] IMDB Link Dialog uses Advanced Title Search API which doesn't support non-latin names
- [ ] maybe we should use `https://www.imdb.com/find?q=` (which is IMDB search incl. ENTER)?
- [ ] -> replace it in LinkIMDBDialog
- [ ] -> also use it for IMDB detection by filename
- IMPORTANT: Find API only yields results if the movie title is complete
- [ ] => we have to use find API only as fallback for the advancedTitleSearch
- [ ] => maybe we should implement an "ultimate" search which combines results of all three searches?

### Filters Customization

- [ ] UI: implement App - Filters as array with Sort field
- [ ] add Settings - Filters tab
- [ ] user may reorder and show/hide filters
- [ ] also use this in the filtersList creation

### I18N - Basic

- [ ] support all languages supported by DeepL or AWS (API): `en, de, fr, es, it, nl, pl, ja, pt-PT, pt-BR, ru, zh`

### I18N - Advanced

- [ ] Create AWS-based Service for automatic translation
  - [ ] Integrate with DeepL API or AWS
  - [ ] Integrate Payment API (sorry, DeepL/AWS are great but also want some cash)

### Mediainfo Languages

- [ ] we get languages like "German" from Mediainfo and map them to e.g. "De" using languages.js and store.js' ensureLanguageMapping
- [ ] however, we can't be sure that we know all possible Mediainfo provided languages
- [ ] how do we cope with that???
  - [ ] local logging?
  - [ ] webservice?

### Progress - Movies sorted by Name

- page: 56 (God bless America)

### Other (later)

- [ ] investigate Linux "stores" (see: https://www.electron.build/configuration/linux.html)
  - [ ] Linux Mint
  - [ ] Flatpak <https://docs.flatpak.org/en/latest/electron.html>
  - [ ] Snap <https://snapcraft.io/docs/electron-apps>
- [ ] investigate scroll-snap <https://markodenic.com/css-tips/>
- [ ] have individual lists of "my lists" clickable, show dialog (analog to genres, people, companies etc.) and thus "filter by this list"

- [ ] create a MediaInfo watchdog

  - autodownload latest mediainfo
  - check for expected fields (error on fail)
  - check for new fields (warning on fail)

- [ ] Test mediainfo and VLC in Linux/MacOS (we now use "" in the exec)

  - [x] Win: OK
  - [x] Linux: OK
  - [ ] MacOS: ??

- [ ] MediaInfo supports "--Output=JSON", better use this instead of the default XML Output
- [ ] .iso handling?
- [ ] IMDB Awards (Oscars etc.) as data and filter criteria
- [ ] apply shared.\*AppliedContains to the media item once after completely fetching media
  - huge refactoring as movie data must then contain the information if it is affected by the filter
- [ ] items which have a scan error skew the next scan's time-per-item
- [ ] allow imdbid in relink dialog
- [ ] refactor
  - [x] use find-imdb-tconst.js and remove functions from store
  - [ ] find proper place for imdb-scraper.js, find-imdb-tconst.js
  - [ ] identify other functions in store.js which don't really belong there
  - [ ] provide util.promisified stuff in helpers.js and use it exclusively from there
- [ ] handle helpers.isPortable via env-var (get rid of set-portable.js)
- [ ] add a new rescan method: "rescan entries with errors"
- [ ] layout the app with css grid (see: <https://layout.bradwoods.io/customize>)
- [ ] treat rescan of particular titles as a queue (don't disable all other titles when a rescan runs)
  - same queue as a "Scan Media" process
- introduce #tags instead of lists (keep the datastructures in .db though)
- [ ] correctly implement mk-scrollcontainer class (e.g. Medialist)
- [ ] OK? - fix moment's missing local time (see MediaList.lastAccessDisplayText)

### Youtube Support

- [ ] youtube (incl. subscription importer -> <https://www.youtube.com/subscription_manager?action_takeout=1)>

### QA

- [ ] check how fetchMedia/MediaList works if only filescan has been performed (no MI/IMDB data)

### Unsure: Implement Backend as express-like server

- this way we can have front- and backend as independent apps
- major re-write neccessary
