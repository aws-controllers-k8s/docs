import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "AWS Controllers for Kubernetes",
  tagline: "Manage AWS services directly from Kubernetes",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://aws-controllers-k8s.github.io",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/docs/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "aws-controllers-k8s", // Usually your GitHub org/user name.
  projectName: "docs", // Usually your repo name.

  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/aws-controllers-k8s/docs/tree/main/website/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  markdown: {
    mermaid: true,
  },
  themes: [
    "@docusaurus/theme-mermaid",
    [
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
        language: ["en"],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: "/",
        indexBlog: false,
        indexPages: true,
      },
    ],
  ],

  themeConfig: {
    // Social card for link previews (Twitter, Slack, etc.)
    image: "img/ack-social.png",
    announcementBar: {
      id: "eks_capabilities_launch",
      content:
        '<div style="min-height: 60px !important; height: 60px !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 16px 20px !important; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; letter-spacing: 0.4px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, sans-serif;">✨ <strong style="font-weight: 600;">Exciting News:</strong> ACK is now available as an EKS Capability <a target="_blank" rel="noopener noreferrer" href="https://docs.aws.amazon.com/eks/latest/userguide/capabilities.html" style="text-decoration: underline; font-weight: 600; margin-left: 8px; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">Learn more →</a></div>',
      backgroundColor: "#0D9488",
      textColor: "#FFFFFF",
      isCloseable: true,
    },
    colorMode: {
      respectPrefersColorScheme: false,
      disableSwitch: false,
    },
    navbar: {
      title: "",
      logo: {
        alt: "AWS Controllers for Kubernetes",
        src: "img/ack-logo.png",
        srcDark: "img/ack-logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          to: "/services",
          label: "Controllers",
          position: "left",
        },
        {
          to: "/api-reference",
          label: "API Reference",
          position: "left",
        },
        {
          href: "https://github.com/aws-controllers-k8s",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [
            {
              label: "Getting Started",
              to: "/getting-started",
            },
            {
              label: "Controllers",
              to: "/services",
            },
            {
              label: "API Reference",
              to: "/api-reference",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Slack (#aws-controllers-k8s)",
              href: "https://kubernetes.slack.com/messages/aws-controllers-k8s",
            },
            {
              label: "GitHub Discussions",
              href: "https://github.com/aws-controllers-k8s/community/discussions",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/aws-controllers-k8s",
            },
            {
              label: "AWS Open Source",
              href: "https://aws.amazon.com/opensource/",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Amazon.com, Inc. or its affiliates. All Rights Reserved.`,
    },
    prism: {
      theme: prismThemes.oceanicNext,
      darkTheme: prismThemes.vsLight,
      additionalLanguages: ["yaml", "bash", "json"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
