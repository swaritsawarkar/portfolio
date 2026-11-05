import team0 from "../assets/portfolio/creative/davinci-team-mainteam.webp";
import team1 from "../assets/portfolio/creative/davinci-team-swarit.webp";
import team2 from "../assets/portfolio/creative/davinci-team-pragun.webp";
import team3 from "../assets/portfolio/creative/davinci-team-aryansh.webp";
import team4 from "../assets/portfolio/creative/davinci-team-yash.webp";
import team5 from "../assets/portfolio/creative/davinci-team-swarnika.webp";
import team6 from "../assets/portfolio/creative/davinci-team-rohan.webp";
import team7 from "../assets/portfolio/creative/davinci-team-ranjan.webp";
import genZCover from "../assets/portfolio/creative/gen-z-is-cooked-cover.webp";
import davinciPanelOne from "../assets/portfolio/creative/davinci-panel-01.webp";
import davinciPanelTwo from "../assets/portfolio/creative/davinci-panel-02.webp";
import davinciPanelThree from "../assets/portfolio/creative/davinci-panel-03.webp";
import davinciPoster from "../assets/portfolio/creative/davinci-027-poster.webp";
import davinciDesignBuildAutomate from "../assets/portfolio/creative/davinci-design-build-automate.webp";
import davinciWeBuildToCompete from "../assets/portfolio/creative/davinci-we-build-to-compete.webp";
import type { PortfolioMediaItem } from "../types/portfolio";

export const genZCoverItem: PortfolioMediaItem = {
  kind: "image",
  src: genZCover,
  alt: "Final black-and-white GEN Z IS COOKED book cover designed by Swarit Sawarkar",
  caption: "GEN Z IS COOKED — final cover design",
};

export const davinciPanels: PortfolioMediaItem[] = [
  {
    kind: "image",
    src: davinciPanelOne,
    alt: "First black-and-white panel of the DaVinci graphic design strip",
    caption: "DaVinci design strip — panel 01",
  },
  {
    kind: "image",
    src: davinciPanelTwo,
    alt: "Second black-and-white panel of the DaVinci graphic design strip",
    caption: "DaVinci design strip — panel 02",
  },
  {
    kind: "image",
    src: davinciPanelThree,
    alt: "Third black-and-white panel of the DaVinci graphic design strip",
    caption: "DaVinci design strip — panel 03",
  },
];

export const davinciPosterSeries: PortfolioMediaItem[] = [
  {
    kind: "image",
    src: davinciWeBuildToCompete,
    alt: "Black-and-white DaVinci poster with the words We Build to Compete and a robot chassis",
    caption: "DaVinci poster — We Build to Compete / design work",
  },
  {
    kind: "image",
    src: davinciDesignBuildAutomate,
    alt: "Black-and-white DaVinci poster with the words Design Build Automate around a robot chassis",
    caption: "DaVinci poster — Design. Build. Automate. / design work",
  },
  {
    kind: "image",
    src: davinciPoster,
    alt: "Black-and-white DaVinci 027 typography poster",
    caption: "DaVinci 027 typography poster / design work",
  },
];

export const instagramEdits: PortfolioMediaItem[] = [];

export const davinciTeamSeries: PortfolioMediaItem[] = [
  {
    kind: "image",
    src: team0,
    alt: "DaVinci 027 black-and-white team introduction poster: Team roster",
    caption: "DaVinci 027 / Team roster",
  },
  {
    kind: "image",
    src: team1,
    alt: "DaVinci 027 black-and-white team introduction poster: Swarit Sawarkar",
    caption: "DaVinci 027 / Swarit Sawarkar",
  },
  {
    kind: "image",
    src: team2,
    alt: "DaVinci 027 black-and-white team introduction poster: Pragun Bhartiya",
    caption: "DaVinci 027 / Pragun Bhartiya",
  },
  {
    kind: "image",
    src: team3,
    alt: "DaVinci 027 black-and-white team introduction poster: Aryansh Jajoo",
    caption: "DaVinci 027 / Aryansh Jajoo",
  },
  {
    kind: "image",
    src: team4,
    alt: "DaVinci 027 black-and-white team introduction poster: Yash Agrawal",
    caption: "DaVinci 027 / Yash Agrawal",
  },
  {
    kind: "image",
    src: team5,
    alt: "DaVinci 027 black-and-white team introduction poster: Swarnika Sawarkar",
    caption: "DaVinci 027 / Swarnika Sawarkar",
  },
  {
    kind: "image",
    src: team6,
    alt: "DaVinci 027 black-and-white team introduction poster: Rohan Tharwani",
    caption: "DaVinci 027 / Rohan Tharwani",
  },
  {
    kind: "image",
    src: team7,
    alt: "DaVinci 027 black-and-white team introduction poster: Shaurya Ranjan",
    caption: "DaVinci 027 / Shaurya Ranjan",
  },
];
