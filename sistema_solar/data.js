import { sun } from "./bodies/sun.js";
import { mercury } from "./bodies/mercury.js";
import { venus } from "./bodies/venus.js";
import { earth } from "./bodies/earth.js";
import { moon } from "./bodies/moon.js";
import { mars } from "./bodies/mars.js";
import { jupiter } from "./bodies/jupiter.js";
import { saturn } from "./bodies/saturn.js";
import { uranus } from "./bodies/uranus.js";
import { neptune } from "./bodies/neptune.js";
import { BODY_ORDER, SOLAR_SYSTEM_BEHAVIOR, TIMELINE_EVENTS, TIMELINE_INDEX_BY_ID, getMoonOrbitPosition, getOrbitPosition } from "./solar-system.js";
import { CONSTELLATIONS, CONSTELLATION_BY_SLUG } from "./universe/constellations.js";
import { KNOWN_STARS, KNOWN_STAR_BY_SLUG } from "./universe/stars.js";
import { KNOWN_GALAXIES, KNOWN_GALAXY_BY_SLUG } from "./universe/galaxies.js";

export const BODY_DATA = {sun,mercury,venus,earth,moon,mars,jupiter,saturn,uranus,neptune};

export {
  BODY_ORDER,
  CONSTELLATIONS,
  CONSTELLATION_BY_SLUG,
  KNOWN_STARS,
  KNOWN_STAR_BY_SLUG,
  KNOWN_GALAXIES,
  KNOWN_GALAXY_BY_SLUG,
  SOLAR_SYSTEM_BEHAVIOR,
  TIMELINE_EVENTS,
  TIMELINE_INDEX_BY_ID,
  getMoonOrbitPosition,
  getOrbitPosition
};
