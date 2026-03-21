const child_process = require("child_process");
const util = require("util");

const xml2js = require("xml2js");

const logger = require("./helpers/logger");
const helpers = require("./helpers/helpers");
const mediainfoTrackDefinition = require("./object-definitions/mediainfo-track");
const { languageNameCodeMapping } = require("./languages");

const { shared } = require("./shared");

const execAsync = util.promisify(child_process.exec);

/**
 * Run MediaInfo and return MediaInfo's analysis result
 * @param {String} mediaInfoPath Path to MediaInfo CLI
 * @param {String} mediaPath Path to the media file
 */
async function runMediaInfo(mediaInfoPath, mediaPath) {
  const mi_task = `"${mediaInfoPath}" --Output=XML "${mediaPath}"`;
  logger.log("[runMediaInfo] running mediainfo:", mi_task);

  const { stdout, stderr } = await execAsync(mi_task);

  if (stderr) {
    logger.error(stderr);
    return;
  }

  const miObj = await xml2js.parseStringPromise(stdout);

  return miObj;
}

/**
 * Analyze Media Info Data
 * @param {Object} miObj Media Info Data Object (result from runMediaInfo)
 */
async function analyzeMediaInfoData(miObj, id_Movies) {
  logger.log("[analyzeMediaInfoData] id_Movies:", id_Movies, "miObj:", miObj);

  const MI = {
    $id_Movies: id_Movies,
    $MI_Duration: null,
    $MI_Duration_Seconds: null,
    $MI_Duration_Formatted: null,
    $MI_Quality: null, // TODO: deprecate!
    $MI_Aspect_Ratio: null,
    $MI_Audio_Languages: "",
    $MI_Subtitle_Languages: "",
  };

  const audioLanguages = [];
  const subtitleLanguages = [];
  const videoResolutions = [];
  const videoHDR = [];

  let tracks = [];

  if (miObj.File && miObj.File.track) {
    tracks = miObj.File.track;
  } else if (miObj.MediaInfo && miObj.MediaInfo.media) {
    miObj.MediaInfo.media.forEach((media) => {
      (media.track || []).forEach((track) => {
        tracks.push(track);
      });
    });
  }

  let bestQualityLevel = 0;

  tracks.forEach((track) => {
    // collect all track data into tbl_Movies_MI_Tracks
    const trackFields = JSON.parse(JSON.stringify(mediainfoTrackDefinition));
    trackFields.$id_Movies = id_Movies;
    trackFields.$type = track.$.type ? track.$.type.toLowerCase() : "<undefined>";
    trackFields.$typeorder = Object.keys(track.$).find((key) => key === "typeorder") ? track.$.typeorder : null;

    for (let key of Object.keys(track)) {
      if (Object.keys(trackFields).find((fk) => fk === `$${key}`)) {
        trackFields[`$${key}`] = track[key][0];

        if (key === "extra") {
          try {
            trackFields[`$${key}`] = JSON.stringify(track[key][0]);
          } catch (err) {
            logger.error(err);
          }
        }

        if (key === "Language") {
          if (languageNameCodeMapping[trackFields[`$${key}`]]) {
            trackFields[`$${key}`] = languageNameCodeMapping[trackFields[`$${key}`]];
          } else {
            trackFields[`$${key}`] = helpers.uppercaseEachWord(trackFields[`$${key}`]);
          }
        }
      } else {
        // eslint-disable-next-line no-constant-condition
        if (!`$${key}` === "$$") {
          logger.warn(`[applyMediaInfo] track key not found: "$${key}"`);
        }
      }
    }

    if (trackFields.$Encoded_Library_Name) {
      trackFields.$Encoded_Library_Name_Trimmed = trackFields.$Encoded_Library_Name.split(" ")[0].trim();
    }

    track.trackFields = trackFields;

    // more specific analysis of track data
    if (track.$.type === "Video") {
      const durationAnalysis = analyzeMediaInfoVideoDuration(track);

      if (
        durationAnalysis.$MI_Duration_Seconds &&
        (!MI.$MI_Duration_Seconds || MI.$MI_Duration_Seconds < durationAnalysis.$MI_Duration_Seconds)
      ) {
        MI.$MI_Duration = durationAnalysis.$MI_Duration;
        MI.$MI_Duration_Seconds = durationAnalysis.$MI_Duration_Seconds;
        MI.$MI_Duration_Formatted = durationAnalysis.$MI_Duration_Formatted;
      }

      const videoAnalysis = analyzeMediaInfoVideoProperties(track);

      if (videoAnalysis.Video_Resolution && !videoResolutions.find((r) => r === videoAnalysis.Video_Resolution)) {
        videoResolutions.push(videoAnalysis.Video_Resolution);
      }
      if (videoAnalysis.Video_HDR && !videoHDR.find((r) => r === videoAnalysis.Video_HDR)) {
        videoHDR.push(videoAnalysis.Video_HDR);
      }

      // TODO: deprecate, use videoResolutions instead
      if (videoAnalysis.qualityLevel && videoAnalysis.qualityLevel > bestQualityLevel) {
        bestQualityLevel = videoAnalysis.qualityLevel;

        MI.$MI_Quality = videoAnalysis.Video_Resolution;
        MI.$MI_Aspect_Ratio = videoAnalysis.$MI_Aspect_Ratio;
      }
    }

    if (track.$.type === "Audio") {
      if (track.Language && track.Language.length > 0) {
        let lang = track.Language[0];

        if (languageNameCodeMapping[lang]) {
          lang = languageNameCodeMapping[lang];
        } else {
          lang = helpers.uppercaseEachWord(lang);
        }

        if (!audioLanguages.find((al) => al === lang)) {
          audioLanguages.push(lang);
        }
      }
    }

    if (track.$.type === "Text") {
      if (track.Language && track.Language.length > 0) {
        let lang = track.Language[0];
        if (languageNameCodeMapping[lang]) {
          lang = languageNameCodeMapping[lang];
        } else {
          lang = helpers.uppercaseEachWord(lang);
        }

        if (!subtitleLanguages.find((al) => al === lang)) {
          subtitleLanguages.push(lang);
        }
      }
    }
  });

  if (audioLanguages.length > 0) {
    MI.$MI_Audio_Languages = audioLanguages.reduce((prev, current) => prev + (prev ? ", " : "") + current);
  }

  if (subtitleLanguages.length > 0) {
    MI.$MI_Subtitle_Languages = subtitleLanguages.reduce((prev, current) => prev + (prev ? ", " : "") + current);
  }

  return { MI, tracks, audioLanguages, subtitleLanguages, videoResolutions, videoHDR };
}

function analyzeMediaInfoVideoDuration(videoTrack) {
  logger.log("[analyzeMediaInfoVideoDuration] videoTrack:", videoTrack);

  const result = {
    $MI_Duration: null,
    $MI_Duration_Seconds: null,
    $MI_Duration_Formatted: null,
  };

  if (videoTrack.Duration && videoTrack.Duration.length > 0) {
    result.$MI_Duration = videoTrack.Duration[0];

    // eslint-disable-next-line no-unused-vars
    result.$MI_Duration_Seconds = 0;

    if (result.$MI_Duration.includes("h") || result.$MI_Duration.includes("mn") || result.$MI_Duration.includes("s")) {
      if (/(\d*)h/.test(result.$MI_Duration)) {
        result.$MI_Duration_Seconds += 60 * 60 * parseInt(result.$MI_Duration.match(/(\d*)h/)[1]);
      }
      if (/(\d*)mn/.test(result.$MI_Duration)) {
        result.$MI_Duration_Seconds += 60 * parseInt(result.$MI_Duration.match(/(\d*)mn/)[1]);
      }
      if (/(\d*)s/.test(result.$MI_Duration)) {
        result.$MI_Duration_Seconds += parseInt(result.$MI_Duration.match(/(\d*)s/)[1]);
      }
    }

    if (/^\d+/.test(result.$MI_Duration) && /\d+$/.test(result.$MI_Duration)) {
      result.$MI_Duration_Seconds = parseInt(result.$MI_Duration);
    }
  } else if (videoTrack.DURATION && videoTrack.DURATION.length > 0) {
    result.$MI_Duration = videoTrack.DURATION[0];

    const matches = videoTrack.DURATION[0].match(/(\d+):(\d+):(\d+)/);

    logger.log("[applyMediaInfo] DURATION matches:", matches);

    result.$MI_Duration_Seconds = 0;

    result.$MI_Duration_Seconds += 60 * 60 * +matches[1];
    result.$MI_Duration_Seconds += 60 * +matches[2];
    result.$MI_Duration_Seconds += +matches[3];
  }

  if (result.$MI_Duration_Seconds > 0) {
    result.$MI_Duration_Formatted = helpers.getTimeString(result.$MI_Duration_Seconds);
  }

  return result;
}

function analyzeMediaInfoVideoProperties(videoTrack) {
  const result = {
    Video_Resolution: null,
    qualityLevel: null,
    $MI_Aspect_Ratio: null,
    Video_HDR: null,
  };

  if (videoTrack.Width && videoTrack.Width.length > 0) {
    const width = videoTrack.Width[0].replace(/\s/g, "");
    const iWidth = parseInt(width);

    let height = 0;
    if (videoTrack.Height && videoTrack.Height.length > 0) {
      height = videoTrack.Height[0].replace(/\s/g, "");
    }
    const iHeight = parseInt(height);

    const tolerance = 1.1; // tolerance level, so that e.g. 1085p is NOT UHD

    result.Video_Resolution = shared.videoQualities.SD.name;
    result.qualityLevel = 1;

    if (iWidth * iHeight > 720 * 576 * tolerance) {
      result.Video_Resolution = shared.videoQualities["720p"].name;
      result.qualityLevel = 2;
    }
    if (iWidth * iHeight > 1280 * 720 * tolerance) {
      result.Video_Resolution = shared.videoQualities.HD.name;
      result.qualityLevel = 3;
    }
    if (iWidth * iHeight > 1920 * 1080 * tolerance) {
      result.Video_Resolution = shared.videoQualities.UHD.name;
      result.qualityLevel = 4;
    }
    if (iWidth * iHeight > 3840 * 2160 * tolerance) {
      result.Video_Resolution = shared.videoQualities["4K"].name;
      result.qualityLevel = 5;
    }
    if (iWidth * iHeight > 4096 * 2160 * tolerance) {
      result.Video_Resolution = shared.videoQualities["8K"].name;
      result.qualityLevel = 6;
    }
  }

  if (videoTrack.Display_aspect_ratio && videoTrack.Display_aspect_ratio.length > 0) {
    result.$MI_Aspect_Ratio = videoTrack.Display_aspect_ratio[0];
  }

  if (videoTrack.DisplayAspectRatio && videoTrack.DisplayAspectRatio.length > 0) {
    result.$MI_Aspect_Ratio = videoTrack.DisplayAspectRatio[0];
  }

  // HDR - 'HDR10', 'HDR10+', 'DV', 'HLG'
  logger.log("[analyzeMediaInfoVideoProperties] HDR_Format:", videoTrack.HDR_Format);
  logger.log("[analyzeMediaInfoVideoProperties] HDR_Format_Compatibility:", videoTrack.HDR_Format_Compatibility);

  if (videoTrack.HDR_Format == "Dolby Vision") {
    result.Video_HDR = shared.videoQualities.DV.name;
  } else if (videoTrack.HDR_Format_Compatibility?.[0]?.startsWith("HDR10+")) {
    result.Video_HDR = shared.videoQualities["HDR10+"].name;
  } else if (videoTrack.HDR_Format_Compatibility?.[0]?.startsWith("HDR10")) {
    result.Video_HDR = shared.videoQualities["HDR10"].name;
  }

  logger.log("[analyzeMediaInfoVideoProperties] result:", result);

  return result;
}

export { runMediaInfo, analyzeMediaInfoData };
