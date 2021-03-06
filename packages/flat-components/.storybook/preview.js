import "../src/theme/index.less";
import "../src/theme/custom-bulma.scss";
import "tachyons/css/tachyons.min.css";

import { MINIMAL_VIEWPORTS } from "@storybook/addon-viewport";
import { i18n } from "./i18next.js";

export const parameters = {
    options: {
        showPanel: true,
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
        expanded: true,
        hideNoControlsWarning: true,
    },
    backgrounds: {
        values: [
            {
                name: "Homepage Background",
                value: "#F3F6F9",
            },
        ],
    },
    i18n,
    locale: "en",
    locales: {
        en: {
            right: "πΊπΈ",
            title: "English",
        },
        "zh-CN": {
            right: "π¨π³",
            title: "δΈ­ζ",
        },
    },
    viewport: {
        viewports: {
            ...MINIMAL_VIEWPORTS,
            tablet2: {
                name: "Large Tablet",
                styles: { width: "659px", height: "1000px" },
            },
        },
    },
};
