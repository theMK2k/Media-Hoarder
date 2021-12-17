# TODO

## v1.0.0

- [ ] remove MediaInfoObject from tbl_Movies
- [ ] introduce Audio Metadata
  - [x] see below: use Movie Manager to mass-scan a movie folder and find out the different audio codecs
  - [ ] provide mapping for Format (like release attributes)
  - [x] new table tbl_Movies_MI_Tracks
    - scan all media info data to find out which fields are populated by each track type
  - new Filters:
    - Audio Formats (optionally for language X)
    - Audio Formats (Commercial) (optionally for language X)

- [ ] Test mediainfo and VLC in Linux/MacOS (we now use "" in the exec)
  - [x] Win: OK
  - [x] Linux: OK
  - [ ] MacOS: ??

KHLP F

```text
General Keys

UniqueID	4277	192503062109255373286008662619018597250
VideoCount	5372	1
AudioCount	5396	4
TextCount	8869	7
MenuCount	3279	1
FileExtension	16593	mkv
Format	11087	Matroska
Format_Version	4830	2
FileSize	16593	5741688948
Duration	10682	4764.362
OverallBitRate_Mode	688	VBR
OverallBitRate	10682	9641062
FrameRate	5371	23.976
FrameCount	5365	114230
StreamSize	16389	114272425
IsStreamable	4887	Yes
Encoded_Date	4262	UTC 2010-06-03 18:14:49
File_Created_Date	16593	UTC 2020-02-22 08:31:30.655
File_Created_Date_Local	16593	2020-02-22 09:31:30.655
File_Modified_Date	16591	UTC 2010-06-10 15:40:13.000
File_Modified_Date_Local	16591	2010-06-10 16:40:13.000
Encoded_Application	5298	mkvmerge v3.3.0 ('Language') gebaut am Mar 24 2010 14:59:24
Encoded_Library	5254	libebml v0.8.0 + libmatroska v0.9.0
Title	904	...und dann kam Polly
Movie	904	...und dann kam Polly
Cover	83	Yes
extra	5644	Cover.jpg
Format_Profile	63	Base Media
CodecID	57	isom
CodecID_Compatible	57	isom/avc1
HeaderSize	57	2958296
DataSize	57	785651478
FooterSize	57	57
Tagged_Date	36	UTC 2014-10-21 23:43:39
Interleaved	450	Yes
Copyright	2	iNFOTv
Comment	9	RARBG.COM - Brazil.1985.DC.1080p.BluRay.H264.AAC-RARBG
Performer	5	Martin Brest
Director	2	Martin Brest
Actor	1	Al Pacino / Chris O'Donnell / Gabrielle Anwar / Philip Seymour Hoffman
ScreenplayBy	1	Bo Goldman
Producer	1	Martin Brest
Genre	5	Drama
ContentType	2	Short Film
Recorded_Date	8	1992
OriginalSourceForm_Name	1	Die Katze auf dem heiÃŸen Blechdach - SZ-Cinemathek Nr. 22 [DVD5] Untouched
ID	33	0
OverallBitRate_Maximum	33	48000000
Subject	1	Serdar Somuncu - Der Hassprediger Hardcore Live
Description	2	Encoded By RMTeam, http://RMZ.cr
Album	1	The Hobbit: The Tolkien Edit
EncodedBy	1	Sartre
Released_Date	1	1980-12-25

Video Keys

StreamOrder	5371	0
ID	5373	1
UniqueID	4830	1
Format	5373	AVC
Format_Profile	5360	High
Format_Level	5360	4.1
Format_Settings_CABAC	4871	Yes
Format_Settings_RefFrames	4871	4
CodecID	5371	V_MPEG4/ISO/AVC
Duration	5371	4764.348
BitRate	5304	7230000
Width	5373	1920
Height	5373	1040
Sampled_Width	5371	1920
Sampled_Height	5371	1040
PixelAspectRatio	5373	1.000
DisplayAspectRatio	5373	1.846
FrameRate_Mode	4887	CFR
FrameRate	5372	23.976
FrameCount	5371	114230
ColorSpace	5371	YUV
ChromaSubsampling	5371	4:2:0
BitDepth	5371	8
ScanType	5325	Progressive
Delay	5314	0.000
StreamSize	5303	4176072749
Title	1139	7 Mbps AVC MPEG-4
Encoded_Library	5062	x264 - core 96 r1613M 81e75e9
Encoded_Library_Name	5057	x264
Encoded_Library_Version	5048	core 96 r1613M 81e75e9
Encoded_Library_Settings	4599	cabac=1 / ref=4 / deblock=1:-1:-1 / analyse=0x3:0x113 / me=umh / subme=9 / psy=1 / fade_compensate=0.00 / psy_rd=1.30:0.00 / mixed_ref=1 / me_range=24 / chroma_me=1 / trellis=2 / 8x8dct=1 / cqm=0 / deadzone=21,11 / fast_pskip=1 / chroma_qp_offset=-2 / threads=6 / sliced_threads=0 / nr=0 / decimate=1 / interlaced=0 / constrained_intra=0 / bframes=5 / b_pyramid=2 / b_adapt=2 / b_bias=0 / direct=3 / weightb=1 / weightp=2 / keyint=250 / keyint_min=25 / scenecut=40 / intra_refresh=0 / rc_lookahead=80 / rc=2pass / mbtree=1 / bitrate=7230 / ratetol=1.0 / qcomp=0.80 / qpmin=10 / qpmax=51 / qpstep=4 / cplxblur=20.0 / qblur=0.5 / ip_ratio=1.40 / aq=1:0.70
Language	2271	de
Default	4830	No
Forced	4830	No
MuxingMode	132	Header stripping
FrameRate_Mode_Original	90	VFR
Stored_Height	2410	816
colour_description_present	470	Yes
colour_description_present_Source	470	Stream
colour_range	475	Limited
colour_range_Source	475	Stream
colour_primaries_Source	469	Stream
transfer_characteristics_Source	469	Stream
matrix_coefficients	469	BT.709
matrix_coefficients_Source	469	Stream
BitRate_Maximum	309	9146920
Rotation	57	0.000
Encoded_Date	36	UTC 2014-10-21 23:43:39
Tagged_Date	36	UTC 2014-10-21 23:43:48
colour_primaries	423	BT.709
extra	120	avcC
Format_Tier	44	Main
Stored_Width	85	1920
transfer_characteristics	420	BT.709
BitRate_Mode	369	VBR
BufferSize	378	11600000
FrameRate_Original	175	29.970
Format_Settings_BVOP	452	2
Format_Settings_QPel	449	No
Format_Settings_GMC	449	0
Format_Settings_Matrix	452	Default (H.263)
Compression_Mode	457	Lossy
Encoded_Library_Date	327	UTC 2008-12-04
BitRate_Nominal	100	6951200
Format_Settings_Matrix_Data	27	081010141014171717171B181B181B1E1D1C1C1D1E201F1E1D1E1F2022222323232322222626272727262628282A2A28282C2D2E2D2C323636323B3E3B484854 / 1113131515151717171719191919191B1B1B1B1B1B1D1C1D1E1D1C1D1F1D1E1F1F1E1D1F2120222622202125282E2E28252D363A362D3C48483C4A5A4A64647C
FrameRate_Minimum	12	1.501
FrameRate_Maximum	12	24.000
Format_Settings_GOP	54	M=1, N=3
ScanOrder	19	BFF
Standard	43	NTSC
Source_Duration	7	303.076
Source_StreamSize	7	1298742853
MenuID	34	1
OriginalSourceMedium_ID	8	4113
MultiView_Count	2	2
MultiView_Layout	2	Side by Side (left eye first)
DisplayAspectRatio_Original	30	2.348
PixelAspectRatio_Original	24	1.091
Format_Settings_PictureStructure	1	Frame
Height_Original	2	1088
Format_Version	5	2
Height_Offset	1	0
Delay_Original	1	0.000
TimeCode_FirstFrame	1	00:00:00;00
TimeCode_Source	1	Group of pictures header
Gop_OpenClosed	1	Open
Gop_OpenClosed_FirstFrame	1	Closed
ScanType_Original	1	Progressive

Audio Keys

StreamOrder	9060	1
ID	9122	2
UniqueID	8467	2997387431
Format	9123	DTS
Format_Settings_Mode	6131	16
Format_Settings_Endianness	8597	Big
CodecID	9060	A_DTS
Duration	9064	4764.362
BitRate_Mode	8980	CBR
BitRate	8979	768000
Channels	9064	6
ChannelPositions	8128	Front: L C R, Side: L R, LFE
ChannelLayout	8128	C L R Ls Rs LFE
SamplesPerFrame	8987	512
SamplingRate	9064	48000
SamplingCount	9064	228689376
FrameRate	8987	93.750
BitDepth	5790	24
Compression_Mode	9114	Lossy
Delay	8957	0.000
Delay_Source	8957	Container
StreamSize	8979	457378752
StreamSize_Proportion	8979	0.07966
Title	3363	5.1 DTS @ 755 kbps
Language	8492	de
Default	8539	Yes
Forced	8467	Yes
Format_Settings_Floor	42	1
Encoded_Library	291	AO; aoTuV b5c [20081215] (based on Xiph.Org's libVorbis)
Encoded_Library_Name	47	aoTuV
Encoded_Library_Version	47	b5c
Encoded_Library_Date	47	UTC 2008-12-15
MuxingMode	148	Header stripping
Format_Commercial_IfAny	3167	Dolby Digital
FrameCount	3919	194213
ServiceKind	2823	CM
extra	2849	6-271.491.0271-27-272.790.535.467382.670.275.16746
Format_Settings_SBR	48	No (Explicit)
Format_AdditionalFeatures	496	LC
ChannelPositions_Original	615	Front: L C R, Side: L R, LFE
ChannelLayout_Original	615	C L R Ls Rs LFE
BitRate_Maximum	39	99648
Encoded_Date	45	UTC 2014-10-21 23:43:47
Tagged_Date	43	UTC 2014-10-21 23:43:48
AlternateGroup	72	1
Alignment	458	Split
Interleave_VideoFrames	458	1.00
Interleave_Duration	458	0.042
Interleave_Preload	442	0.500
Channels_Original	232	7
Format_Version	260	1
Format_Profile	261	Layer 3
Format_Settings_ModeExtension	217	MS Stereo
Encoded_Library_Settings	225	-m j -V 4 -q 2 -lowpass 17.6 --abr 128
BitRate_Nominal	62	140000
BitRate_Minimum	42	128000
Source_Duration	4	7087.958
Source_FrameCount	3	332248
Source_StreamSize	3	84945247
Source_StreamSize_Proportion	3	0.04569
MenuID	37	1
OriginalSourceMedium_ID	14	4352
Format_Settings_Sign	8	Signed
BitDepth_Detected	5	24
FirstPacketOrder	59	1
Duration_LastFrame	1	-0.011
Encoded_Application	2	VLC media player
```

```text
Audio Formats

Format  numEntries
DTS         5730
Vorbis      42
AC-3        2459
AAC         131
E-AC-3      354
MPEG Audio  319
Opus        11
PCM         8
FLAC        5
MLP FBA     9

Audio Codec IDs

CodecID         numEntries
A_DTS           5701
A_VORBIS        42
A_AC3           2237
A_AAC-2         63
mp4a-40-2       67
A_EAC3          334
ec-3            21
2000            199
55              259
ac-3            10
A_OPUS          11
134             5
130             23
A_MPEG/L3       1
A_PCM/INT/LIT   8
A_FLAC          5
A_TRUEHD        9
A_AAC-5         1
129             9

Commercial Format

CommercialFormat                    numEntries
Dolby Digital                       2451
Dolby Digital Plus                  293
HE-AAC                              36
DTS-HD Master Audio                 145
DTS-ES Matrix                       101
Dolby Digital Plus with Dolby Atmos 62
DTS-ES Discrete                     42
DTS-HD High Resolution Audio        8
Dolby TrueHD with Dolby Atmos       1
Dolby TrueHD                        8
```

### Bugs

- nothing

### Other

- nothing

### FR Translation v0.1

- `"Audio Languages": "Langues"`: _is there a possibility to explicitly distinguish between Audio and Subtitle Languages?_
- `"Find Filming Location": "Rechercher par Société de Production ",`: _incorrect translation_
- `"Mediainfo CLI Path": "Chemin d'accès à Mediainfo CLI",`: _"ILC" instead of "CLI", really?_ (multiple apply)
- `"IMDB Rating Demographic": "Evaluations d'IMDB par tranche d'âge",`: _Demographic is not only specified by age (e.g. US/Non-US, Male/Female)_
- [x] Tu/Toi vs. Vous/Votre: _we are not a banking app, so let's drop the formal "vous" and use informal "tu"_ (multiple apply)

- scrape = ?

(last line: 105)

## LATER

### Find Inspiration from <https://github.com/whyboris/Video-Hub-App>

### Create i18n Editor

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

### TV Series Support

- incl. IMDB Rating heatmap like <https://whattowatchon.tv>
- Dialogs: most of them do not utilize mediaType

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

- [ ] apply shared.*AppliedContains to the media item once after completely fetching media
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
